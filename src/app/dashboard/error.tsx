"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-fade-in">
      <div
        className="glass rounded-2xl max-w-md w-full p-8 text-center"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: "hsl(var(--danger-muted))" }}
        >
          <AlertCircle size={28} style={{ color: "hsl(var(--danger))" }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--text-primary))" }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-6" style={{ color: "hsl(var(--text-muted))" }}>
          An error occurred while loading this section.
        </p>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    </div>
  );
}
