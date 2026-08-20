/**
 * POST /api/calendar/import
 *
 * Imports a Google Calendar event as a new TaskFlow task.
 * The user picks an event from the calendar view and clicks "Import as Task".
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  googleEventId: z.string(),
  summary: z.string(),
  start: z.string(), // ISO datetime
  end: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { googleEventId, summary, start, end } = parsed.data;

  // Don't duplicate — check if we already have this event as a task
  const existing = await prisma.task.findFirst({
    where: { googleEventId, userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already imported", taskId: existing.id },
      { status: 409 }
    );
  }

  // Estimate duration in minutes from start→end
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const estimatedMins = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    : null;

  const task = await prisma.task.create({
    data: {
      title: summary,
      dueDate: startDate,
      estimatedMins,
      googleEventId,
      userId: session.user.id,
      status: "TODO",
      priority: "MEDIUM",
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
