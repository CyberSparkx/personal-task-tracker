/**
 * Google Calendar API helper
 *
 * Provides typed wrappers around the googleapis Calendar client.
 * OAuth tokens are fetched from the database Account record so we
 * never have to ask the user to re-authenticate.
 */

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/** Build an authenticated OAuth2 client for a given user */
export async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) {
    throw new Error(`No Google account linked for user ${userId}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Auto-refresh: persist new token back to DB after refresh
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : account.expires_at,
      },
    });
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/** Create a Calendar event for a task */
export async function createCalendarEvent(
  userId: string,
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate: Date;
    estimatedMins?: number | null;
  }
) {
  const calendar = await getCalendarClient(userId);

  const start = new Date(task.dueDate);
  const end = new Date(
    start.getTime() + (task.estimatedMins ?? 30) * 60 * 1000
  );

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: task.title,
      description: task.description ?? "",
      start: { dateTime: start.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      // Tag it so we can identify TaskFlow events later
      extendedProperties: {
        private: { taskflowId: task.id },
      },
    },
  });

  return event.data.id ?? null;
}

/** Update an existing Calendar event when a task changes */
export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  task: {
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    estimatedMins?: number | null;
    status?: string;
  }
) {
  const calendar = await getCalendarClient(userId);

  const patch: Record<string, unknown> = {
    summary: task.title,
    description: task.description ?? "",
  };

  if (task.dueDate) {
    const start = new Date(task.dueDate);
    const end = new Date(
      start.getTime() + (task.estimatedMins ?? 30) * 60 * 1000
    );
    patch.start = { dateTime: start.toISOString(), timeZone: "UTC" };
    patch.end = { dateTime: end.toISOString(), timeZone: "UTC" };
  }

  // Mark done tasks with a strikethrough in Calendar
  if (task.status === "DONE" || task.status === "CANCELLED") {
    patch.summary = `✓ ${task.title}`;
  }

  await calendar.events.patch({
    calendarId: "primary",
    eventId: googleEventId,
    requestBody: patch,
  });
}

/** Delete a Calendar event when a task is deleted */
export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string
) {
  const calendar = await getCalendarClient(userId);
  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
  } catch (err: any) {
    // 410 = already deleted in Calendar — that's fine
    if (err?.code !== 410) throw err;
  }
}

/** List upcoming Calendar events not yet in TaskFlow */
export async function listCalendarEvents(
  userId: string,
  timeMin: Date = new Date()
) {
  const calendar = await getCalendarClient(userId);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items ?? [];
}
