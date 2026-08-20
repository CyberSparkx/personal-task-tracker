"use client";

import { signOut } from "next-auth/react";
import { Search, Bell, LogOut, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { TaskModal } from "@/components/tasks/TaskModal";
import { CommandPalette } from "@/components/ui/CommandPalette";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function Topbar({ user }: { user?: User }) {
  const [showModal, setShowModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header
        className="flex items-center gap-4 px-6 py-4 border-b glass"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {/* Search — opens command palette */}
        <div className="flex-1 max-w-lg">
          <button
            id="open-search-btn"
            onClick={() => setShowPalette(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left cursor-pointer"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <Search size={16} style={{ color: "hsl(var(--text-muted))" }} />
            <span className="flex-1 text-sm" style={{ color: "hsl(var(--text-muted))" }}>Search tasks, projects…</span>
            <kbd
              className="hidden sm:block text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "hsl(var(--border))",
                color: "hsl(var(--text-muted))",
                fontFamily: "monospace",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* New task */}
          <button
            id="new-task-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white transition-all duration-200 cursor-pointer"
            style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}
          >
            <Plus size={16} />
            New Task
          </button>

          {/* Notifications */}
          <button
            id="notifications-btn"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--text-secondary))",
            }}
          >
            <Bell size={18} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--danger))" }}
            />
          </button>

          {/* Sign out */}
          <button
            id="signout-btn"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--text-secondary))",
            }}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}

      <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} />
    </>
  );
}
