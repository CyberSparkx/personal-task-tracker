"use client";

/**
 * CalendarView
 *
 * Shows Google Calendar events alongside TaskFlow tasks for the current month.
 * Features:
 *  - Monthly grid view
 *  - Each day cell shows tasks with due dates and Calendar events
 *  - Clicking a Calendar event offers "Import as Task"
 *  - Clicking a task card shows quick status toggle + "Sync to Calendar" button
 */

import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, Import, CalendarCheck } from "lucide-react";

type CalEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string } | null;
  taskflowId: string | null;
  taskStatus: string | null;
  htmlLink: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  googleEventId: string | null;
};

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calEvents, setCalEvents] = useState<CalEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [googleLinked, setGoogleLinked] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const from = startOfMonth(currentMonth).toISOString();

    const [evRes, taskRes] = await Promise.all([
      fetch(`/api/calendar/events?from=${from}`),
      fetch("/api/tasks"),
    ]);

    if (evRes.ok) {
      const data = await evRes.json();
      if (data.error === "No Google account linked") setGoogleLinked(false);
      else { setCalEvents(data.events ?? []); setGoogleLinked(true); }
    }
    if (taskRes.ok) setTasks(await taskRes.json());
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  // Build the calendar grid (Mon–Sun, pad with prev/next month days)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Index events/tasks by day
  function getEventsForDay(day: Date) {
    return calEvents.filter((e) => {
      const dt = e.start?.dateTime ?? e.start?.date;
      return dt ? isSameDay(new Date(dt), day) : false;
    });
  }
  function getTasksForDay(day: Date) {
    return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
  }

  const syncTask = async (taskId: string) => {
    setSyncing(taskId);
    await fetch(`/api/tasks/${taskId}/sync-calendar`, { method: "POST" });
    setSyncing(null);
    load();
  };

  const importEvent = async (event: CalEvent) => {
    if (!event.start) return;
    setImporting(event.id);
    await fetch("/api/calendar/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleEventId: event.id,
        summary: event.summary,
        start: event.start.dateTime ?? event.start.date,
      }),
    });
    setImporting(null);
    load();
  };

  const PRIORITY_COLOR: Record<string, string> = {
    URGENT: "hsl(var(--danger))",
    HIGH: "hsl(var(--warning))",
    MEDIUM: "hsl(var(--primary))",
    LOW: "hsl(var(--success))",
  };

  return (
    <div
      className="glass rounded-2xl overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3">
          <button
            id="cal-prev-month"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg cursor-pointer"
            style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-secondary))" }}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            id="cal-next-month"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg cursor-pointer"
            style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-secondary))" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs mr-4" style={{ color: "hsl(var(--text-muted))" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} /> Task
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--accent))" }} /> Calendar
            </span>
          </div>
          <button
            id="cal-refresh-btn"
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-secondary))", border: "1px solid hsl(var(--border))" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Not linked warning ── */}
      {!googleLinked && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.3)" }}
        >
          ⚠️ Google Calendar not linked. Sign in with Google to enable sync.
        </div>
      )}

      {/* ── Day headers ── */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-semibold"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const todayDay = isToday(day);

          return (
            <div
              key={i}
              className="min-h-28 p-2 border-b border-r"
              style={{
                borderColor: "hsl(var(--border-subtle))",
                background: todayDay
                  ? "hsl(var(--primary-muted))"
                  : !inMonth
                  ? "hsl(var(--background) / 0.5)"
                  : "transparent",
              }}
            >
              {/* Day number */}
              <div
                className="text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  color: todayDay
                    ? "hsl(var(--primary))"
                    : inMonth
                    ? "hsl(var(--text-secondary))"
                    : "hsl(var(--text-muted))",
                  background: todayDay ? "hsl(var(--primary) / 0.15)" : "transparent",
                }}
              >
                {format(day, "d")}
              </div>

              {/* Tasks */}
              {dayTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  id={`cal-task-${task.id}`}
                  className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer group"
                  style={{
                    background: `${PRIORITY_COLOR[task.priority]}18`,
                    border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
                    color: task.status === "DONE" ? "hsl(var(--text-muted))" : "hsl(var(--text-primary))",
                    textDecoration: task.status === "DONE" ? "line-through" : "none",
                  }}
                  title={task.title}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: PRIORITY_COLOR[task.priority] }}
                  />
                  <span className="truncate flex-1">{task.title}</span>
                  {/* Sync button on hover */}
                  {!task.googleEventId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); syncTask(task.id); }}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Sync to Calendar"
                    >
                      {syncing === task.id ? (
                        <RefreshCw size={10} className="animate-spin" style={{ color: "hsl(var(--accent))" }} />
                      ) : (
                        <CalendarCheck size={10} style={{ color: "hsl(var(--accent))" }} />
                      )}
                    </button>
                  )}
                </div>
              ))}

              {/* Calendar Events */}
              {dayEvents
                .filter((e) => !e.taskflowId) // don't double-show synced tasks
                .slice(0, 1)
                .map((event) => (
                  <div
                    key={event.id}
                    id={`cal-event-${event.id}`}
                    className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded text-xs truncate group cursor-pointer"
                    style={{
                      background: "hsl(var(--accent) / 0.12)",
                      border: "1px solid hsl(var(--accent) / 0.3)",
                      color: "hsl(var(--accent))",
                    }}
                    title={event.summary}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                    <span className="truncate flex-1">{event.summary}</span>
                    <button
                      onClick={() => importEvent(event)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Import as Task"
                    >
                      {importing === event.id ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <Import size={10} />
                      )}
                    </button>
                  </div>
                ))}

              {/* Overflow */}
              {dayTasks.length + dayEvents.length > 3 && (
                <div className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                  +{dayTasks.length + dayEvents.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
