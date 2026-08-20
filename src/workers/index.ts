/**
 * BullMQ Worker — runs as a separate process via Dockerfile.worker
 *
 * Processes three queues:
 *  1. reminders     → sends Web Push and/or email for task reminders
 *  2. daily-digest  → sends the 8am overdue/due-soon email to every user
 *  3. calendar-sync → syncs a task change to Google Calendar
 *
 * Usage: ts-node src/workers/index.ts
 */

import { Worker, Queue } from "bullmq";
import { PrismaClient, Prisma } from "@prisma/client";
import { createRedisConnection } from "@/lib/redis";
import { sendReminderEmail, sendDailyDigestEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/web-push";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

const prisma = new PrismaClient();
const connection = createRedisConnection();

// ─── 1. Reminder Worker ───────────────────────────────────────────────────────

const reminderWorker = new Worker(
  "reminders",
  async (job) => {
    const { reminderId, taskId, taskTitle, userId, channel } = job.data;

    console.log(`[reminder] Processing: ${taskTitle} (${channel})`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Mark as sent first (idempotent)
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { sentAt: new Date() },
    });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.status === "DONE" || task.status === "CANCELLED") return;

    // ── Push notification ──
    if ((channel === "PUSH" || channel === "BOTH") && user.vapidSubscription) {
      const result = await sendPushNotification(
        user.vapidSubscription as any,
        {
          title: "⏰ Task Reminder",
          body: taskTitle,
          url: `/dashboard/tasks/${taskId}`,
          tag: `reminder-${reminderId}`,
        }
      );
      // Clean up expired subscription
      if (result === "expired") {
        await prisma.user.update({
          where: { id: userId },
          data: { vapidSubscription: Prisma.DbNull },
        });
      }
    }

    // ── Email ──
    if ((channel === "EMAIL" || channel === "BOTH") && user.email) {
      await sendReminderEmail({
        to: user.email,
        taskTitle,
        taskId,
        dueDate: task.dueDate ?? new Date(),
      });
    }
  },
  { connection, concurrency: 5 }
);

// ─── 2. Daily Digest Worker ───────────────────────────────────────────────────

const digestWorker = new Worker(
  "daily-digest",
  async (_job) => {
    console.log("[digest] Sending daily digest to all users");

    const users = await prisma.user.findMany({
      where: { email: { not: "" } },
      select: { id: true, email: true, name: true },
    });

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await Promise.allSettled(
      users.map(async (user) => {
        const [overdue, dueSoon] = await Promise.all([
          prisma.task.findMany({
            where: {
              userId: user.id,
              status: { in: ["TODO", "IN_PROGRESS"] },
              dueDate: { lt: now },
            },
            select: { id: true, title: true, dueDate: true },
            take: 10,
          }),
          prisma.task.findMany({
            where: {
              userId: user.id,
              status: { in: ["TODO", "IN_PROGRESS"] },
              dueDate: { gte: now, lte: tomorrow },
            },
            select: { id: true, title: true, dueDate: true },
            take: 10,
          }),
        ]);

        if (overdue.length === 0 && dueSoon.length === 0) return;

        await sendDailyDigestEmail({
          to: user.email!,
          name: user.name?.split(" ")[0] ?? "there",
          overdue: overdue as any,
          dueSoon: dueSoon as any,
        });
      })
    );
  },
  { connection }
);

// ─── 3. Calendar Sync Worker ──────────────────────────────────────────────────

const calendarWorker = new Worker(
  "calendar-sync",
  async (job) => {
    const { taskId, userId } = job.data;

    console.log(`[cal-sync] Syncing task ${taskId}`);

    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) return;

    const account = await prisma.account.findFirst({
      where: { userId, provider: "google" },
    });
    if (!account?.access_token) return;

    try {
      if (
        (task.status === "CANCELLED" || !task.dueDate) &&
        task.googleEventId
      ) {
        await deleteCalendarEvent(userId, task.googleEventId);
        await prisma.task.update({
          where: { id: taskId },
          data: { googleEventId: null },
        });
        return;
      }

      if (!task.dueDate) return;

      if (task.googleEventId) {
        await updateCalendarEvent(userId, task.googleEventId, {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          estimatedMins: task.estimatedMins,
          status: task.status,
        });
      } else {
        const googleEventId = await createCalendarEvent(userId, {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          estimatedMins: task.estimatedMins,
        });
        if (googleEventId) {
          await prisma.task.update({
            where: { id: taskId },
            data: { googleEventId },
          });
        }
      }
    } catch (err) {
      console.error(`[cal-sync] Error for task ${taskId}:`, err);
    }
  },
  { connection }
);

// ─── Schedule daily digest at 8:00 AM UTC ────────────────────────────────────

const digestQueue = new Queue("daily-digest", { connection: createRedisConnection() });

async function scheduleDailyDigest() {
  try {
    const q = digestQueue as any;
    if (typeof q.getRepeatableJobs === "function") {
      const repeatableJobs = await q.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await q.removeRepeatableByKey(job.key);
      }
    }
    await digestQueue.add(
      "daily",
      {},
      {
        repeat: { pattern: "0 8 * * *" },
        removeOnComplete: true,
      } as any
    );
    console.log("[worker] Daily digest scheduled at 8:00 AM UTC");
  } catch (err: any) {
    console.warn("[worker] Could not schedule repeatable daily digest:", err.message);
  }
}

// ─── Error handlers ───────────────────────────────────────────────────────────

reminderWorker.on("failed", (job, err) => {
  console.error(`[reminder] Job ${job?.id} failed:`, err.message);
});
digestWorker.on("failed", (job, err) => {
  console.error(`[digest] Job ${job?.id} failed:`, err.message);
});
calendarWorker.on("failed", (job, err) => {
  console.error(`[cal-sync] Job ${job?.id} failed:`, err.message);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

scheduleDailyDigest().then(() => {
  console.log("[worker] TaskFlow background worker started");
  console.log("[worker] Listening: reminders, daily-digest, calendar-sync");
});
