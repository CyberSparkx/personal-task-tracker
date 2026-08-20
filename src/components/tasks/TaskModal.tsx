"use client";

import { useEffect, useRef, useState } from "react";
import { X, Calendar, Clock, Flag, FolderOpen, Tag, Loader2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedMins: number | null;
  projectId?: string | null;
  markdownNotes?: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string;
};

export function TaskModal({
  task,
  projects = [],
  onClose,
  onCreated,
}: {
  task?: Task;
  projects?: Project[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "TODO",
    priority: task?.priority ?? "MEDIUM",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
    estimatedMins: task?.estimatedMins?.toString() ?? "",
    projectId: task?.projectId ?? "",
  });

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      estimatedMins: form.estimatedMins ? parseInt(form.estimatedMins) : null,
      projectId: form.projectId || null,
    };

    const url = isEdit ? `/api/tasks/${task.id}` : "/api/tasks";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      onCreated();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl animate-slide-up overflow-hidden"
        style={{
          background: "hsl(var(--surface-elevated))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <h2 className="font-semibold text-base" style={{ color: "hsl(var(--text-primary))" }}>
            {isEdit ? "Edit Task" : "Create New Task"}
          </h2>
          <button id="close-modal-btn" onClick={onClose} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "hsl(var(--text-muted))" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              id="task-title-input"
              ref={titleRef}
              type="text"
              placeholder="Task title..."
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:opacity-40"
              style={{ color: "hsl(var(--text-primary))" }}
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              id="task-description-input"
              placeholder="Add a description..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
              style={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--text-primary))",
              }}
            />
          </div>

          {/* Grid: status, priority, due date, estimate */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>Status</label>
              <select
                id="task-status-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                }}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>Priority</label>
              <select
                id="task-priority-select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                }}
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                <span className="flex items-center gap-1"><Calendar size={11} /> Due Date</span>
              </label>
              <input
                id="task-due-date-input"
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                  colorScheme: "dark",
                }}
              />
            </div>

            {/* Estimate */}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                <span className="flex items-center gap-1"><Clock size={11} /> Estimate (mins)</span>
              </label>
              <input
                id="task-estimate-input"
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={form.estimatedMins}
                onChange={(e) => setForm({ ...form, estimatedMins: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                }}
              />
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "hsl(var(--text-muted))" }}>
                <span className="flex items-center gap-1"><FolderOpen size={11} /> Project</span>
              </label>
              <select
                id="task-project-select"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer"
                style={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--text-primary))",
                }}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              id="cancel-task-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer"
              style={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--text-secondary))",
              }}
            >
              Cancel
            </button>
            <button
              id="submit-task-btn"
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
