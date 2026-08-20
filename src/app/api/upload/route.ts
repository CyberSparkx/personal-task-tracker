/**
 * POST /api/upload
 *
 * Authenticated file upload to MinIO.
 * Accepts multipart/form-data with a "file" field and optional "taskId".
 * Returns the public URL of the uploaded object.
 *
 * File path pattern: uploads/{userId}/{taskId|misc}/{timestamp}-{filename}
 */

import { auth } from "@/lib/auth";
import { minio, BUCKET_NAME, ensureBucketExists, getPublicUrl } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Readable } from "stream";

// 10 MB limit
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const taskId = formData.get("taskId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max size is 10 MB." },
      { status: 413 }
    );
  }

  // Ensure bucket exists with public-read policy
  await ensureBucketExists();

  // Build a unique object name
  const timestamp = Date.now();
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = taskId
    ? `uploads/${session.user.id}/${taskId}`
    : `uploads/${session.user.id}/misc`;
  const objectName = `${folder}/${timestamp}-${sanitized}`;

  // Stream the file into MinIO
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(buffer);

  await minio.putObject(BUCKET_NAME, objectName, stream, file.size, {
    "Content-Type": file.type,
    "x-amz-meta-uploader": session.user.id,
  });

  const publicUrl = getPublicUrl(objectName);

  // If linked to a task — record the attachment in the DB
  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });
    if (task) {
      await prisma.attachment.create({
        data: {
          taskId,
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
          sizeBytes: file.size,
        },
      });
    }
  }

  return NextResponse.json({ url: publicUrl, objectName }, { status: 201 });
}
