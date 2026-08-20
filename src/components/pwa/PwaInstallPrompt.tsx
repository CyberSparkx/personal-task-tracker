"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously in this session
      const dismissed = sessionStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 max-w-sm w-full glass-elevated rounded-2xl p-4 shadow-2xl animate-slide-up border"
      style={{ borderColor: "hsl(var(--primary) / 0.4)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white flex-shrink-0"
            style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.4)" }}
          >
            <Download size={18} />
          </div>
          <div>
            <h4
              className="text-sm font-semibold"
              style={{ color: "hsl(var(--text-primary))" }}
            >
              Install TaskFlow App
            </h4>
            <p
              className="text-xs"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Install on your device for standalone access & instant push notifications.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg cursor-pointer"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold gradient-primary text-white cursor-pointer"
        >
          Install Now
        </button>
        <button
          onClick={handleDismiss}
          className="py-2 px-3 rounded-xl text-xs font-medium cursor-pointer"
          style={{
            background: "hsl(var(--surface))",
            color: "hsl(var(--text-muted))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
