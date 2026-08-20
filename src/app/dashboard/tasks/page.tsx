import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/tasks/TaskBoard";

export const metadata: Metadata = { title: "All Tasks" };

export default async function AllTasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: { userId: session.user.id, parentTaskId: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        subtasks: { select: { id: true, status: true } },
        _count: { select: { attachments: true, subtasks: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { tasks: true } } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          All <span className="gradient-text">Tasks</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
        </p>
      </div>
      <TaskBoard initialTasks={tasks as any} projects={projects as any} />
    </div>
  );
}
