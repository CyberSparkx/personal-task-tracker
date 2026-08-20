"use client";

/**
 * CommandPalette — Global search overlay (⌘K / Ctrl+K)
 *
 * Features:
 *  - Fuzzy search across tasks and projects
 *  - Keyboard navigation (↑↓ arrow, Enter, Escape)
 *  - Shows recent tasks when query is empty
 *  - Direct navigation to task detail on select
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, FolderOpen, ArrowRight, Loader2, X } from "lucide-react";

type Result = {
  id: string;
  type: "task" | "project";
  title: string;
  subtitle?: string;
  color?: string;
  href: string;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search with debounce
  const search = useCallback(async (q: string) => {
    setLoading(true);
    const [taskRes, projRes] = await Promise.all([
      fetch(`/api/tasks?search=${encodeURIComponent(q)}`),
      fetch(`/api/projects`),
    ]);

    const taskResults: Result[] = [];
    const projResults: Result[] = [];

    if (taskRes.ok) {
      const tasks = await taskRes.json();
      tasks.slice(0, 6).forEach((t: any) => {
        taskResults.push({
          id: t.id, type: "task",
          title: t.title,
          subtitle: t.project?.name ?? t.status,
          color: t.project?.color,
          href: `/dashboard/tasks/${t.id}`,
        });
      });
    }

    if (projRes.ok) {
      const projects = await projRes.json();
      const filtered = q
        ? projects.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase()))
        : projects;
      filtered.slice(0, 3).forEach((p: any) => {
        projResults.push({
          id: p.id, type: "project",
          title: p.name,
          subtitle: `${p._count?.tasks ?? 0} tasks`,
          color: p.color,
          href: `/dashboard/tasks?projectId=${p.id}`,
        });
      });
    }

    setResults([...taskResults, ...projResults]);
    setLoading(false);
    setSelected(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
  }, [query, open, search]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected((s) => Math.min(s + 1, results.length - 1));
      if (e.key === "ArrowUp") setSelected((s) => Math.max(s - 1, 0));
      if (e.key === "Enter" && results[selected]) {
        router.push(results[selected].href);
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, results, selected, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "hsl(var(--surface-elevated))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
          ) : (
            <Search size={18} className="flex-shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
          )}
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects…"
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: "hsl(var(--text-primary))" }}
          />
          <button onClick={onClose} className="cursor-pointer" style={{ color: "hsl(var(--text-muted))" }}>
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "hsl(var(--text-muted))" }}>
              {query ? "No results found." : "Start typing to search…"}
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {/* Group by type */}
              {(["task", "project"] as const).map((type) => {
                const group = results.filter((r) => r.type === type);
                if (group.length === 0) return null;
                return (
                  <div key={type} className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "hsl(var(--text-muted))" }}>
                      {type === "task" ? "Tasks" : "Projects"}
                    </div>
                    {group.map((result, i) => {
                      const globalIdx = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          id={`cmd-result-${result.id}`}
                          onClick={() => { router.push(result.href); onClose(); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all"
                          style={{
                            background: globalIdx === selected ? "hsl(var(--primary-muted))" : "transparent",
                            color: globalIdx === selected ? "hsl(var(--primary))" : "hsl(var(--text-primary))",
                          }}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: result.color ? `${result.color}20` : "hsl(var(--surface))" }}>
                            {result.type === "task"
                              ? <FileText size={14} style={{ color: result.color ?? "hsl(var(--text-muted))" }} />
                              : <FolderOpen size={14} style={{ color: result.color ?? "hsl(var(--text-muted))" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs truncate" style={{ color: "hsl(var(--text-muted))" }}>
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <ArrowRight size={14} className="flex-shrink-0" style={{ color: "hsl(var(--text-muted))" }} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t text-xs"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--text-muted))" }}>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(var(--border))", fontFamily: "monospace" }}>↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(var(--border))", fontFamily: "monospace" }}>↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(var(--border))", fontFamily: "monospace" }}>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
