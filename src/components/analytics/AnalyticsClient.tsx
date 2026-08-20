"use client";

/**
 * AnalyticsClient
 *
 * Interactive charts using Recharts:
 *  - 30-day daily completion bar chart
 *  - Task status donut chart
 *  - Priority distribution bar chart
 *  - Summary stat cards
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { CheckCircle2, AlertCircle, TrendingUp, Target } from "lucide-react";

type Props = {
  dailyData: { date: string; count: number }[];
  statusCounts: { status: string; count: number }[];
  priorityCounts: { priority: string; count: number }[];
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completedThisMonth: number;
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "hsl(var(--text-muted))",
  IN_PROGRESS: "#38bdf8",
  DONE: "#22c55e",
  CANCELLED: "#475569",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#22c55e", MEDIUM: "#8b5cf6", HIGH: "#f97316", URGENT: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-primary))" }}>
      <p className="font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.value} tasks</p>
      ))}
    </div>
  );
};

export function AnalyticsClient({
  dailyData, statusCounts, priorityCounts,
  totalTasks, doneTasks, overdueTasks, completedThisMonth,
}: Props) {
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const avgPerDay = completedThisMonth > 0 ? (completedThisMonth / 30).toFixed(1) : "0";

  const summaryCards = [
    { id: "stat-total", label: "Total Tasks", value: totalTasks, icon: Target, color: "hsl(var(--primary))", bg: "hsl(var(--primary-muted))" },
    { id: "stat-done", label: "Completed", value: doneTasks, icon: CheckCircle2, color: "#22c55e", bg: "hsl(var(--success-muted))" },
    { id: "stat-overdue", label: "Overdue", value: overdueTasks, icon: AlertCircle, color: "#ef4444", bg: "hsl(var(--danger-muted))" },
    { id: "stat-rate", label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp, color: "#38bdf8", bg: "hsl(var(--accent-muted))" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.id} id={card.id}
            className="glass rounded-xl p-5 animate-slide-up"
            style={{ border: "1px solid hsl(var(--border))" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: card.bg }}>
              <card.icon size={20} style={{ color: card.color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>{card.value}</div>
            <div className="text-xs mt-1" style={{ color: "hsl(var(--text-muted))" }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Daily completions chart */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <div className="mb-4">
          <h2 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>Daily Completions</h2>
          <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
            Last 30 days · avg {avgPerDay}/day
          </p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }}
              tickLine={false} axisLine={false}
              tickFormatter={(v, i) => i % 5 === 0 ? v : ""} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--border) / 0.5)" }} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status + Priority charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status donut */}
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
          <h2 className="font-semibold mb-4" style={{ color: "hsl(var(--text-primary))" }}>By Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusCounts} dataKey="count" nameKey="status" cx="50%" cy="50%"
                innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusCounts.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#8b5cf6"} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} tasks`, n]} contentStyle={{
                background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))",
                borderRadius: "12px", color: "hsl(var(--text-primary))",
              }} />
              <Legend formatter={(v) => v.replace("_", " ")}
                iconType="circle" iconSize={10}
                wrapperStyle={{ fontSize: "12px", color: "hsl(var(--text-muted))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority bar */}
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
          <h2 className="font-semibold mb-4" style={{ color: "hsl(var(--text-primary))" }}>By Priority</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityCounts} layout="vertical" margin={{ top: 0, right: 16, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }}
                tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="priority" tick={{ fontSize: 11, fill: "hsl(var(--text-muted))" }}
                tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--border) / 0.5)" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {priorityCounts.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#8b5cf6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
