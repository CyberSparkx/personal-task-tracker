import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";
import { startOfDay, subDays, format } from "date-fns";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // Fetch tasks completed in last 30 days
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: "DONE",
      completedAt: { gte: thirtyDaysAgo },
    },
    select: { completedAt: true, priority: true },
  });

  // Build daily completion data
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const day = format(subDays(now, i), "MMM d");
    dailyMap.set(day, 0);
  }
  completedTasks.forEach((t) => {
    if (t.completedAt) {
      const day = format(t.completedAt, "MMM d");
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }
  });
  const dailyData = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  // Task counts by status
  const statusCounts = await prisma.task.groupBy({
    by: ["status"],
    where: { userId },
    _count: { id: true },
  });

  // Task counts by priority
  const priorityCounts = await prisma.task.groupBy({
    by: ["priority"],
    where: { userId, status: { not: "CANCELLED" } },
    _count: { id: true },
  });

  // Total stats
  const [totalTasks, doneTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "DONE" } }),
    prisma.task.count({
      where: { userId, dueDate: { lt: now }, status: { in: ["TODO", "IN_PROGRESS"] } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Your productivity insights for the last 30 days.
        </p>
      </div>
      <AnalyticsClient
        dailyData={dailyData}
        statusCounts={statusCounts.map((s) => ({ status: s.status, count: s._count.id }))}
        priorityCounts={priorityCounts.map((p) => ({ priority: p.priority, count: p._count.id }))}
        totalTasks={totalTasks}
        doneTasks={doneTasks}
        overdueTasks={overdueTasks}
        completedThisMonth={completedTasks.length}
      />
    </div>
  );
}
