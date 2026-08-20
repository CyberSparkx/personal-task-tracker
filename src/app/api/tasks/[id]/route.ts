import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMins: z.number().int().positive().optional().nullable(),
  projectId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  markdownNotes: z.string().optional().nullable(),
  googleEventId: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getTaskOrFail(id: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id, userId },
  });
  return task;
}

// GET /api/tasks/[id]
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
      subtasks: {
        include: {
          tags: { include: { tag: true } },
          _count: { select: { subtasks: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      reminders: true,
      _count: { select: { attachments: true, subtasks: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

// PATCH /api/tasks/[id]
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await getTaskOrFail(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { tagIds, ...data } = parsed.data;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate,
      ...(data.status === "DONE" && { completedAt: new Date() }),
      ...(data.status && data.status !== "DONE" && { completedAt: null }),
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
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

  return NextResponse.json(task);
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await getTaskOrFail(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
