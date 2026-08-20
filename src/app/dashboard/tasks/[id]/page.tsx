import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, select: { title: true } });
  return { title: task?.title ?? "Task" };
}

export default async function TaskDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
      subtasks: {
        include: { tags: { include: { tag: true } }, _count: { select: { subtasks: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      reminders: true,
      _count: { select: { attachments: true, subtasks: true } },
    },
  });

  if (!task) notFound();

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, color: true },
  });

  return <TaskDetailClient task={task as any} projects={projects as any} />;
}
