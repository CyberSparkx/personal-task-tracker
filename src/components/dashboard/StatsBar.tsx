"use client";

import { CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp } from "lucide-react";

type Stats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
};

export function StatsBar({ stats }: { stats: Stats }) {
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const cards = [
    {
      id: "stat-total",
      label: "Total Tasks",
      value: stats.total,
      icon: ListTodo,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary-muted))",
    },
    {
      id: "stat-todo",
      label: "To Do",
      value: stats.todo,
      icon: ListTodo,
      color: "hsl(var(--text-secondary))",
      bg: "hsl(var(--surface-elevated))",
    },
    {
      id: "stat-in-progress",
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "hsl(var(--accent))",
      bg: "hsl(var(--accent-muted))",
    },
    {
      id: "stat-done",
      label: "Completed",
      value: stats.done,
      icon: CheckCircle2,
      color: "hsl(var(--success))",
      bg: "hsl(var(--success-muted))",
    },
    {
      id: "stat-overdue",
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "hsl(var(--danger))",
      bg: "hsl(var(--danger-muted))",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          className="glass rounded-xl p-4 flex flex-col gap-3 animate-slide-up transition-all duration-200"
          style={{ border: `1px solid hsl(var(--border))` }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: card.bg }}
            >
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            {card.id === "stat-done" && (
              <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--success))" }}>
                <TrendingUp size={12} />
                {completionRate}%
              </div>
            )}
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
              {card.value}
            </div>
            <div className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
