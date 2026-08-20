import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { StatsBar } from "@/components/dashboard/StatsBar";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
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
      take: 100,
    }),
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
    overdue: tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < new Date() &&
        t.status !== "DONE" &&
        t.status !== "CANCELLED"
    ).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          Good {getGreeting()},{" "}
          <span className="gradient-text">
            {session.user.name?.split(" ")[0] ?? "there"}
          </span>{" "}
          👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <StatsBar stats={stats} />
      <TaskBoard initialTasks={tasks as any} projects={projects as any} />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
