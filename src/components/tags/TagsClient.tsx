"use client";

import { useState } from "react";
import { Plus, Tag as TagIcon, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

type Tag = {
  id: string;
  name: string;
  color: string | null;
  _count: { tasks: number };
};

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#38bdf8",
  "#3b82f6",
];

export function TagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim().toLowerCase(), color }),
    });
    if (res.ok) {
      const newTag = await res.json();
      setTags((prev) => {
        const exists = prev.find((t) => t.id === newTag.id);
        if (exists) return prev;
        return [...prev, { ...newTag, _count: { tasks: 0 } }];
      });
      setName("");
      setShowForm(false);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          id="new-tag-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer"
        >
          <Plus size={15} /> New Tag
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="glass rounded-2xl p-5"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          <h3
            className="font-semibold text-sm mb-4"
            style={{ color: "hsl(var(--text-primary))" }}
          >
            Create Tag
          </h3>
          <div className="space-y-4">
            <input
              id="tag-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name (e.g. bug, feature, urgent)…"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "hsl(var(--surface-elevated))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--text-primary))",
              }}
            />
            <div>
              <p
                className="text-xs mb-2"
                style={{ color: "hsl(var(--text-muted))" }}
              >
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: color === c ? `3px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                id="submit-create-tag-btn"
                onClick={create}
                disabled={creating || !name.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin inline mr-1" />
                ) : null}
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm cursor-pointer"
                style={{
                  background: "hsl(var(--surface-elevated))",
                  color: "hsl(var(--text-muted))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.length === 0 && (
          <div
            className="col-span-full text-center py-16 text-sm"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            No tags created yet.
          </div>
        )}
        {tags.map((tag) => {
          const tagColor = tag.color || "#6366f1";
          return (
            <div
              key={tag.id}
              className="glass rounded-2xl p-4 flex items-center justify-between group transition-all"
              style={{ border: `1px solid ${tagColor}30` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${tagColor}18` }}
                >
                  <TagIcon size={16} style={{ color: tagColor }} />
                </div>
                <div>
                  <h4
                    className="font-medium text-sm"
                    style={{ color: "hsl(var(--text-primary))" }}
                  >
                    #{tag.name}
                  </h4>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--text-muted))" }}
                  >
                    {tag._count?.tasks ?? 0} tasks
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/tasks?search=${tag.name}`}
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{
                  background: `${tagColor}15`,
                  color: tagColor,
                }}
              >
                View
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
