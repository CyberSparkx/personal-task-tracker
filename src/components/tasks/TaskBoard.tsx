"use client";

import { useState, useCallback } from "react";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { LayoutGrid, List, Plus, Filter, SortAsc } from "lucide-react";

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
  markdownNotes: string | null;
  description: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
};

const COLUMNS = [
  { key: "TODO", label: "To Do", color: "hsl(var(--text-muted))" },
  { key: "IN_PROGRESS", label: "In Progress", color: "hsl(var(--accent))" },
  { key: "DONE", label: "Done", color: "hsl(var(--success))" },
];

export function TaskBoard({
  initialTasks,
  projects,
}: {
  initialTasks: Task[];
  projects: Project[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<"board" | "list">("board");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const refreshTasks = useCallback(async () => {
    const res = await fetch("/api/tasks?parentTaskId=null");
    if (res.ok) setTasks(await res.json());
  }, []);

  const handleStatusChange = async (taskId: string, status: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
    }
  };

  const handleDelete = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filteredTasks = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            id="view-board-btn"
            onClick={() => setView("board")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: view === "board" ? "hsl(var(--primary-muted))" : "hsl(var(--surface-elevated))",
              color: view === "board" ? "hsl(var(--primary))" : "hsl(var(--text-secondary))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <LayoutGrid size={15} /> Board
          </button>
          <button
            id="view-list-btn"
            onClick={() => setView("list")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: view === "list" ? "hsl(var(--primary-muted))" : "hsl(var(--surface-elevated))",
              color: view === "list" ? "hsl(var(--primary))" : "hsl(var(--text-secondary))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <List size={15} /> List
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--text-secondary))",
            }}
          >
            <option value="">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            id="create-task-board-btn"
            onClick={() => { setEditTask(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold gradient-primary text-white"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                  style={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border-subtle))",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--text-primary))" }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-muted))" }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="flex flex-col gap-2 min-h-24">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div
                      className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed text-sm"
                      style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-muted))" }}
                    >
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
              No tasks yet. Create your first task!
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "hsl(var(--border-subtle))" }}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="list"
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editTask ?? undefined}
          projects={projects}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onCreated={refreshTasks}
        />
      )}
    </div>
  );
}
