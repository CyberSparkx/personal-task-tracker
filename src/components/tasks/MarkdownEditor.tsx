"use client";

/**
 * MarkdownEditor
 *
 * Per-task markdown notes editor with:
 *  - Edit / Preview toggle
 *  - Image paste/drag-drop → uploads to MinIO, inserts URL into markdown
 *  - Auto-save with 1 s debounce
 *  - Word count display
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Pencil, Save, Loader2, ImageIcon, Type } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

// Load the heavy MDEditor only client-side
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  taskId: string;
  initialValue?: string | null;
};

export function MarkdownEditor({ taskId, initialValue }: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save: debounce 1.5 s after every change
  const save = useCallback(
    async (md: string) => {
      setSaving(true);
      setSaved(false);
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdownNotes: md }),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    [taskId]
  );

  const handleChange = (val: string | undefined) => {
    const md = val ?? "";
    setValue(md);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(md), 1500);
  };

  // Image paste handler
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (!imageItem) return;

      e.preventDefault();
      setUploading(true);

      const blob = imageItem.getAsFile();
      if (!blob) { setUploading(false); return; }

      const form = new FormData();
      form.append("file", blob, `paste-${Date.now()}.png`);
      form.append("taskId", taskId);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      setUploading(false);

      if (res.ok) {
        const { url } = await res.json();
        const insertion = `\n![image](${url})\n`;
        const updated = value + insertion;
        setValue(updated);
        save(updated);
      }
    },
    [taskId, value, save]
  );

  const wordCount = value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid hsl(var(--border))" }}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: "hsl(var(--surface-elevated))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <div className="flex items-center gap-1">
          <button
            id="md-edit-btn"
            onClick={() => setMode("edit")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background:
                mode === "edit"
                  ? "hsl(var(--primary-muted))"
                  : "transparent",
              color:
                mode === "edit"
                  ? "hsl(var(--primary))"
                  : "hsl(var(--text-muted))",
            }}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            id="md-preview-btn"
            onClick={() => setMode("preview")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background:
                mode === "preview"
                  ? "hsl(var(--primary-muted))"
                  : "transparent",
              color:
                mode === "preview"
                  ? "hsl(var(--primary))"
                  : "hsl(var(--text-muted))",
            }}
          >
            <Eye size={12} /> Preview
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Paste-image hint */}
          <span
            className="hidden sm:flex items-center gap-1 text-xs"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            <ImageIcon size={11} />
            Paste image to upload
          </span>

          {/* Word count */}
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: "hsl(var(--text-muted))" }}
          >
            <Type size={11} />
            {wordCount} words
          </span>

          {/* Save status */}
          {uploading && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--accent))" }}>
              <Loader2 size={11} className="animate-spin" /> Uploading…
            </span>
          )}
          {saving && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
              <Save size={11} className="animate-pulse" /> Saving…
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--success))" }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* ── Edit mode ── */}
      {mode === "edit" && (
        <div onPaste={handlePaste} data-color-mode="dark">
          <MDEditor
            value={value}
            onChange={handleChange}
            height={400}
            preview="edit"
            hideToolbar={false}
            style={{ borderRadius: 0, border: "none" }}
          />
        </div>
      )}

      {/* ── Preview mode ── */}
      {mode === "preview" && (
        <div
          className="prose prose-invert max-w-none px-6 py-5 min-h-48"
          style={{
            background: "hsl(var(--surface))",
            color: "hsl(var(--text-primary))",
          }}
        >
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p style={{ color: "hsl(var(--text-muted))" }} className="italic">
              No notes yet. Switch to Edit mode to start writing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
