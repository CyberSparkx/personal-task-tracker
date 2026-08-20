/**
 * POST /api/tasks/[id]/sync-calendar
 *
 * Manually trigger a Calendar sync for a specific task.
 * Called automatically by the task PATCH route when dueDate changes,
 * or manually from the UI "Sync to Calendar" button.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Load the task (must belong to current user)
  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Check user has a Google account linked
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Google account linked. Please sign in with Google." },
      { status: 400 }
    );
  }

  try {
    // ── DELETE path ─────────────────────────────────────────────────────────
    if (
      (task.status === "CANCELLED" || !task.dueDate) &&
      task.googleEventId
    ) {
      await deleteCalendarEvent(session.user.id, task.googleEventId);
      await prisma.task.update({
        where: { id },
        data: { googleEventId: null },
      });
      return NextResponse.json({ synced: false, action: "deleted" });
    }

    if (!task.dueDate) {
      return NextResponse.json({
        synced: false,
        action: "skipped",
        reason: "No due date set",
      });
    }

    // ── UPDATE path ─────────────────────────────────────────────────────────
    if (task.googleEventId) {
      await updateCalendarEvent(session.user.id, task.googleEventId, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        estimatedMins: task.estimatedMins,
        status: task.status,
      });
      return NextResponse.json({
        synced: true,
        action: "updated",
        googleEventId: task.googleEventId,
      });
    }

    // ── CREATE path ─────────────────────────────────────────────────────────
    const googleEventId = await createCalendarEvent(session.user.id, {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      estimatedMins: task.estimatedMins,
    });

    if (googleEventId) {
      await prisma.task.update({
        where: { id },
        data: { googleEventId },
      });
    }

    return NextResponse.json({
      synced: true,
      action: "created",
      googleEventId,
    });
  } catch (err: any) {
    console.error("[calendar-sync] error:", err);
    return NextResponse.json(
      { error: "Calendar sync failed", detail: err.message },
      { status: 500 }
    );
  }
}
