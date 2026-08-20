/**
 * GET  /api/calendar/events
 *
 * Fetches upcoming Google Calendar events for the logged-in user.
 * Used by the Calendar view to show events alongside tasks.
 */

import { auth } from "@/lib/auth";
import { listCalendarEvents } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify Google is linked
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });
  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Google account linked", events: [] },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const timeMin = from ? new Date(from) : new Date();

  try {
    const events = await listCalendarEvents(session.user.id, timeMin);

    // Annotate events with whether they are already TaskFlow tasks
    const taskflowIds = events
      .map((e) => e.extendedProperties?.private?.taskflowId)
      .filter(Boolean) as string[];

    const linkedTasks =
      taskflowIds.length > 0
        ? await prisma.task.findMany({
            where: { id: { in: taskflowIds } },
            select: { id: true, status: true },
          })
        : [];

    const linkedMap = new Map(linkedTasks.map((t) => [t.id, t.status]));

    const annotated = events.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      htmlLink: event.htmlLink,
      taskflowId: event.extendedProperties?.private?.taskflowId ?? null,
      taskStatus: event.extendedProperties?.private?.taskflowId
        ? linkedMap.get(event.extendedProperties.private.taskflowId) ?? null
        : null,
    }));

    return NextResponse.json({ events: annotated });
  } catch (err: any) {
    console.error("[calendar/events] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar events", detail: err.message },
      { status: 500 }
    );
  }
}
