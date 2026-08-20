"use client";

import { useState } from "react";
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

type Project = {
  id: string; name: string; color: string;
  _count: { tasks: number };
  tasks: { status: string }[];
};

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e",
  "#f97316","#eab308","#22c55e","#14b8a6",
  "#38bdf8","#3b82f6",
];

export function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    if (res.ok) {
      const proj = await res.json();
      setProjects((p) => [{ ...proj, tasks: [] }, ...p]);
      setName(""); setShowForm(false);
    }
    setCreating(false);
  };

  const deleteProject = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((p) => p.filter((proj) => proj.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <button id="new-project-btn" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer">
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass rounded-2xl p-5" style={{ border: "1px solid hsl(var(--border))" }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: "hsl(var(--text-primary))" }}>Create Project</h3>
          <div className="space-y-4">
            <input id="project-name-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Project name…"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "hsl(var(--surface-elevated))", border: "1px solid hsl(var(--border))", color: "hsl(var(--text-primary))" }} />
            <div>
              <p className="text-xs mb-2" style={{ color: "hsl(var(--text-muted))" }}>Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button id="create-project-btn" onClick={create} disabled={creating || !name.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                Create
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: "hsl(var(--surface-elevated))", color: "hsl(var(--text-muted))", border: "1px solid hsl(var(--border))" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
            No projects yet. Create your first project above!
          </div>
        )}
        {projects.map((project) => {
          const done = project.tasks.filter((t) => t.status === "DONE").length;
          const total = project.tasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={project.id} className="glass rounded-2xl p-5 group transition-all"
              style={{ border: `1px solid ${project.color}30` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${project.color}18` }}>
                    <FolderOpen size={20} style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "hsl(var(--text-primary))" }}>{project.name}</h3>
                    <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{project._count.tasks} tasks</p>
                  </div>
                </div>
                <button id={`delete-project-${project.id}`} onClick={() => deleteProject(project.id)}
                  disabled={deleting === project.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg cursor-pointer"
                  style={{ color: "hsl(var(--danger))" }}>
                  {deleting === project.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "hsl(var(--text-muted))" }}>
                  <span>Progress</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: project.color }} />
                </div>
              </div>

              <Link href={`/dashboard/tasks?projectId=${project.id}`}
                className="text-xs font-medium cursor-pointer"
                style={{ color: project.color }}>
                View tasks →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
