"use client";

import { format, isPast, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  Clock,
  Paperclip,
  ChevronRight,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedMins: number | null;
  project: { id: string; name: string; color: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  subtasks: { id: string; status: string }[];
  _count: { attachments: number; subtasks: number };
  description: string | null;
  markdownNotes: string | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "priority-urgent",
  HIGH: "priority-high",
  MEDIUM: "priority-medium",
  LOW: "priority-low",
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "🔴 Urgent",
  HIGH: "🟠 High",
  MEDIUM: "🟡 Medium",
  LOW: "🟢 Low",
};

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return { label: "Today", isOverdue: false, isToday: true };
  if (isTomorrow(date)) return { label: "Tomorrow", isOverdue: false, isToday: false };
  if (isPast(date)) return { label: format(date, "MMM d"), isOverdue: true, isToday: false };
  return { label: format(date, "MMM d"), isOverdue: false, isToday: false };
}

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onEdit,
  variant = "card",
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  variant?: "card" | "list";
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const dueInfo = formatDueDate(task.dueDate);
  const isDone = task.status === "DONE";
  const completedSubtasks = task.subtasks.filter((s) => s.status === "DONE").length;
  const totalSubtasks = task.subtasks.length;

  const toggleDone = async () => {
    setLoading(true);
    await onStatusChange(task.id, isDone ? "TODO" : "DONE");
    setLoading(false);
  };

  if (variant === "list") {
    return (
      <div
        id={`task-${task.id}`}
        className="flex items-center gap-4 px-4 py-3 group transition-all duration-150"
        style={{ background: "hsl(var(--surface))" }}
      >
        {/* Checkbox */}
        <button onClick={toggleDone} className="flex-shrink-0 cursor-pointer" disabled={loading}>
          {isDone ? (
            <CheckCircle2 size={20} style={{ color: "hsl(var(--success))" }} />
          ) : (
            <Circle size={20} style={{ color: "hsl(var(--text-muted))" }} />
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium"
            style={{
              color: isDone ? "hsl(var(--text-muted))" : "hsl(var(--text-primary))",
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {task.title}
          </span>
          {task.project && (
            <span className="ml-2 text-xs" style={{ color: task.project.color }}>
              {task.project.name}
            </span>
          )}
        </div>

        {/* Priority */}
        <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>

        {/* Due date */}
        {dueInfo && (
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: dueInfo.isOverdue ? "hsl(var(--danger))" : "hsl(var(--text-muted))" }}
          >
            <Calendar size={12} />
            {dueInfo.label}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "hsl(var(--text-muted))" }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "hsl(var(--danger))" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`task-card-${task.id}`}
      className="glass rounded-xl p-4 group transition-all duration-200 animate-scale-in"
      style={{
        border: `1px solid hsl(var(--border${isDone ? "-subtle" : ""}))`,
        opacity: isDone ? 0.65 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <button onClick={toggleDone} className="flex-shrink-0 mt-0.5 cursor-pointer" disabled={loading}>
          {isDone ? (
            <CheckCircle2 size={18} style={{ color: "hsl(var(--success))" }} />
          ) : (
            <Circle size={18} style={{ color: "hsl(var(--text-muted))" }} />
          )}
        </button>
        <span
          className="flex-1 text-sm font-medium leading-tight"
          style={{
            color: isDone ? "hsl(var(--text-muted))" : "hsl(var(--text-primary))",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </span>
        <div className="relative">
          <button
            id={`task-menu-${task.id}`}
            onClick={() => setShowMenu(!showMenu)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg cursor-pointer transition-opacity"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-6 z-20 rounded-xl overflow-hidden shadow-lg w-40 animate-scale-in"
              style={{
                background: "hsl(var(--surface-elevated))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <button
                onClick={() => { onEdit(task); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left cursor-pointer hover:bg-white/5"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left cursor-pointer hover:bg-white/5"
                style={{ color: "hsl(var(--danger))" }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: "hsl(var(--text-muted))" }}>
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks progress */}
      {totalSubtasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: "hsl(var(--text-muted))" }}>
            <span>Subtasks</span>
            <span>{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                background: "hsl(var(--success))",
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          {task.project && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: `${task.project.color}20`,
                color: task.project.color,
                border: `1px solid ${task.project.color}40`,
              }}
            >
              {task.project.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              <Paperclip size={11} />
              {task._count.attachments}
            </span>
          )}
          {dueInfo && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{
                color: dueInfo.isOverdue
                  ? "hsl(var(--danger))"
                  : dueInfo.isToday
                  ? "hsl(var(--warning))"
                  : "hsl(var(--text-muted))",
              }}
            >
              {dueInfo.isOverdue && <AlertCircle size={11} />}
              <Calendar size={11} />
              {dueInfo.label}
            </span>
          )}
          {task.estimatedMins && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              <Clock size={11} />
              {task.estimatedMins}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
