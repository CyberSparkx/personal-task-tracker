import type { Metadata } from "next";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "hsl(var(--text-primary))" }}
        >
          Calendar <span className="gradient-text">Sync</span>
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "hsl(var(--text-muted))" }}
        >
          Two-way sync between your tasks and Google Calendar.
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
