import type { Metadata } from "next";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          Notifications & <span className="gradient-text">Reminders</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Manage push notifications and email reminders for your tasks.
        </p>
      </div>
      <NotificationsPanel />
    </div>
  );
}
