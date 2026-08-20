"use client";

/**
 * TaskDetailClient
 *
 * Full-page task detail view with:
 *  - Editable title inline
 *  - Status / priority selectors
 *  - Markdown notes with MarkdownEditor
 *  - PDF export button
 *  - Calendar sync button
 *  - Attachments list
 *  - Subtasks list
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, Download, CalendarCheck, Loader2,
  Paperclip, CheckCircle2, Circle, Plus
} from "lucide-react";
import { MarkdownEditor } from "./MarkdownEditor";

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "priority-urgent", HIGH: "priority-high",
  MEDIUM: "priority-medium", LOW: "priority-low",
};

type Task = {
  id: string; title: string; description: string | null;
  status: string; priority: string; dueDate: string | null;
  estimatedMins: number | null; googleEventId: string | null;
  markdownNotes: string | null;
  project: { id: string; name: string; color: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  subtasks: { id: string; title: string; status: string }[];
  attachments: { id: string; fileName: string; fileUrl: string; fileType: string; sizeBytes: number }[];
};

export function TaskDetailClient({ task: initialTask, projects }: {
  task: Task;
  projects: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  const patch = async (data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setTask((t) => ({ ...t, ...updated }));
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    const res = await fetch(`/api/tasks/${task.id}/export-pdf`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${task.title}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  const syncCalendar = async () => {
    setSyncing(true);
    const res = await fetch(`/api/tasks/${task.id}/sync-calendar`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setTask((t) => ({ ...t, googleEventId: data.googleEventId ?? t.googleEventId }));
    }
    setSyncing(false);
  };

  const toggleSubtask = async (subtaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    await fetch(`/api/tasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTask((t) => ({
      ...t,
      subtasks: t.subtasks.map((s) => s.id === subtaskId ? { ...s, status: newStatus } : s),
    }));
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSubtask.trim(), parentTaskId: task.id }),
    });
    if (res.ok) {
      const sub = await res.json();
      setTask((t) => ({ ...t, subtasks: [...t.subtasks, sub] }));
      setNewSubtask("");
    }
    setAddingSubtask(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm cursor-pointer"
          style={{ color: "hsl(var(--text-muted))" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button id="sync-cal-btn" onClick={syncCalendar} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer"
            style={{ background: "hsl(var(--accent-muted))", color: "hsl(var(--accent))", border: "1px solid hsl(var(--accent) / 0.3)" }}>
            {syncing ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
            {task.googleEventId ? "Re-sync" : "Sync to Calendar"}
          </button>
          <button id="export-pdf-btn" onClick={exportPdf} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer gradient-primary text-white">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export PDF
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="glass rounded-2xl p-6 space-y-6" style={{ border: "1px solid hsl(var(--border))" }}>
        {/* Title */}
        <input id="task-title-inline" defaultValue={task.title}
          onBlur={(e) => { if (e.target.value !== task.title) patch({ title: e.target.value }); }}
          className="w-full text-2xl font-bold bg-transparent outline-none"
          style={{ color: "hsl(var(--text-primary))" }} />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3">
          <select id="status-select" defaultValue={task.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-primary))", border: "1px solid hsl(var(--border))" }}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select id="priority-select" defaultValue={task.priority}
            onChange={(e) => patch({ priority: e.target.value })}
            className={`px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer ${PRIORITY_STYLES[task.priority]}`}>
            <option value="LOW">🟢 Low</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="HIGH">🟠 High</option>
            <option value="URGENT">🔴 Urgent</option>
          </select>

          {task.dueDate && (
            <span className="text-sm px-3 py-1.5 rounded-lg"
              style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-muted))", border: "1px solid hsl(var(--border))" }}>
              📅 {format(new Date(task.dueDate), "MMM d, yyyy HH:mm")}
            </span>
          )}

          {task.project && (
            <span className="text-sm px-3 py-1.5 rounded-lg"
              style={{ background: `${task.project.color}18`, color: task.project.color, border: `1px solid ${task.project.color}30` }}>
              📁 {task.project.name}
            </span>
          )}

          {task.googleEventId && (
            <span className="text-xs px-2 py-1 rounded-lg"
              style={{ background: "hsl(var(--accent-muted))", color: "hsl(var(--accent))" }}>
              📅 Synced to Calendar
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {task.tags.map(({ tag }) => (
              <span key={tag.id} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: `${tag.color}18`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
            {task.description}
          </div>
        )}
      </div>

      {/* Markdown Notes */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider"
          style={{ color: "hsl(var(--text-muted))" }}>Notes</h2>
        <MarkdownEditor taskId={task.id} initialValue={task.markdownNotes} />
      </div>

      {/* Subtasks */}
      <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider"
          style={{ color: "hsl(var(--text-muted))" }}>
          Subtasks ({task.subtasks.filter((s) => s.status === "DONE").length}/{task.subtasks.length})
        </h2>
        <div className="space-y-2 mb-4">
          {task.subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3">
              <button onClick={() => toggleSubtask(sub.id, sub.status)} className="cursor-pointer flex-shrink-0">
                {sub.status === "DONE"
                  ? <CheckCircle2 size={18} style={{ color: "hsl(var(--success))" }} />
                  : <Circle size={18} style={{ color: "hsl(var(--text-muted))" }} />}
              </button>
              <span className="text-sm" style={{
                color: sub.status === "DONE" ? "hsl(var(--text-muted))" : "hsl(var(--text-primary))",
                textDecoration: sub.status === "DONE" ? "line-through" : "none",
              }}>{sub.title}</span>
            </div>
          ))}
        </div>
        {/* Add subtask */}
        <div className="flex items-center gap-2">
          <input id="new-subtask-input" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); }}
            placeholder="Add a subtask…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "hsl(var(--text-primary))" }} />
          <button id="add-subtask-btn" onClick={addSubtask} disabled={addingSubtask || !newSubtask.trim()}
            className="p-1.5 rounded-lg cursor-pointer disabled:opacity-50"
            style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary))" }}>
            {addingSubtask ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>
      </div>

      {/* Attachments */}
      {task.attachments.length > 0 && (
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid hsl(var(--border))" }}>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider"
            style={{ color: "hsl(var(--text-muted))" }}>
            Attachments ({task.attachments.length})
          </h2>
          <div className="space-y-2">
            {task.attachments.map((a) => (
              <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-primary))" }}>
                <Paperclip size={16} style={{ color: "hsl(var(--text-muted))" }} />
                <span className="text-sm flex-1 truncate">{a.fileName}</span>
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                  {(a.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
