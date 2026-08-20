"use client";

/**
 * NotificationsPanel
 *
 * Lets the user:
 *  1. Enable / disable Web Push notifications
 *  2. See their push subscription status
 *  3. Test a push notification
 */

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, BellRing, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export function NotificationsPanel() {
  const { state, error, subscribe, unsubscribe } = usePushNotifications();

  const handleTest = async () => {
    // Trigger a local notification to test the service worker
    if (Notification.permission === "granted") {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("TaskFlow Test 🔔", {
        body: "Push notifications are working correctly!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Push Notifications Card */}
      <div
        className="glass rounded-2xl p-6"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                state === "subscribed"
                  ? "hsl(var(--success-muted))"
                  : "hsl(var(--primary-muted))",
            }}
          >
            {state === "subscribed" ? (
              <BellRing size={22} style={{ color: "hsl(var(--success))" }} />
            ) : (
              <Bell size={22} style={{ color: "hsl(var(--primary))" }} />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ color: "hsl(var(--text-primary))" }}>
              Push Notifications
            </h2>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
              Receive real-time task reminders on this device — even when the app is closed.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {state === "loading" && (
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "hsl(var(--text-muted))" }}>
            <Loader2 size={16} className="animate-spin" /> Checking status…
          </div>
        )}

        {state === "unsupported" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "hsl(var(--warning-muted))", color: "hsl(var(--warning))", border: "1px solid hsl(var(--warning) / 0.3)" }}>
            <AlertTriangle size={16} /> Push notifications are not supported in this browser.
          </div>
        )}

        {state === "denied" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "hsl(var(--danger-muted))", color: "hsl(var(--danger))", border: "1px solid hsl(var(--danger) / 0.3)" }}>
            <BellOff size={16} /> Notifications are blocked. Allow them in your browser settings.
          </div>
        )}

        {state === "subscribed" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "hsl(var(--success-muted))", color: "hsl(var(--success))", border: "1px solid hsl(var(--success) / 0.3)" }}>
            <CheckCircle2 size={16} /> Push notifications are active on this device.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "hsl(var(--danger-muted))", color: "hsl(var(--danger))", border: "1px solid hsl(var(--danger) / 0.3)" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {(state === "default" || state === "loading") && (
            <button
              id="enable-push-btn"
              onClick={subscribe}
              disabled={state === "loading"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-white cursor-pointer disabled:opacity-50"
            >
              {state === "loading" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Bell size={15} />
              )}
              Enable Push Notifications
            </button>
          )}

          {state === "subscribed" && (
            <>
              <button
                id="test-push-btn"
                onClick={handleTest}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  background: "hsl(var(--primary-muted))",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
              >
                <BellRing size={15} /> Send Test Notification
              </button>
              <button
                id="disable-push-btn"
                onClick={unsubscribe}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{
                  background: "hsl(var(--surface-elevated))",
                  color: "hsl(var(--text-muted))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <BellOff size={15} /> Disable
              </button>
            </>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div
        className="glass rounded-2xl p-6"
        style={{ border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} style={{ color: "hsl(var(--accent))" }} />
          <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--text-primary))" }}>
            How reminders work
          </h3>
        </div>
        <ul className="space-y-3 text-sm" style={{ color: "hsl(var(--text-muted))" }}>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-base">🔔</span>
            <span><strong style={{ color: "hsl(var(--text-secondary))" }}>Push reminders</strong> — set an offset (e.g. 60 min before due) on any task. The background worker fires the notification on time.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-base">📧</span>
            <span><strong style={{ color: "hsl(var(--text-secondary))" }}>Daily digest email</strong> — every morning at 8am you receive a summary of overdue and due-today tasks.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex-shrink-0 text-base">📱</span>
            <span><strong style={{ color: "hsl(var(--text-secondary))" }}>Install as PWA</strong> — tap "Add to Home Screen" on mobile to receive push notifications even when the app is fully closed.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
