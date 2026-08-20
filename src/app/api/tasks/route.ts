import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMins: z.number().int().positive().optional().nullable(),
  projectId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  markdownNotes: z.string().optional().nullable(),
});

// GET /api/tasks — list all tasks for current user
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const projectId = searchParams.get("projectId");
  const search = searchParams.get("search");
  const parentTaskId = searchParams.get("parentTaskId");

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(projectId && { projectId }),
      ...(parentTaskId !== undefined && {
        parentTaskId: parentTaskId === "null" ? null : parentTaskId,
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
      subtasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
      reminders: true,
      _count: { select: { attachments: true, subtasks: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { tagIds, ...data } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      userId: session.user.id,
      ...(tagIds && tagIds.length > 0 && {
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
      reminders: true,
    },
  });

  // Auto-sync to Google Calendar if due date is present
  if (task.dueDate) {
    try {
      const googleEventId = await createCalendarEvent(session.user.id, {
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        estimatedMins: task.estimatedMins,
      });
      if (googleEventId) {
        await prisma.task.update({
          where: { id: task.id },
          data: { googleEventId },
        });
        (task as any).googleEventId = googleEventId;
      }
    } catch (err: any) {
      console.warn("[auto-calendar-sync] skipped/failed:", err?.message);
    }
  }

  return NextResponse.json(task, { status: 201 });
}
