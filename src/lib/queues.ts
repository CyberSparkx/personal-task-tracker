/**
 * BullMQ Queue definitions
 *
 * All background job queues are defined here so both the API routes
 * (producers) and the worker process (consumers) import from one place.
 */

import { Queue } from "bullmq";
import { createRedisConnection } from "@/lib/redis";

const connection = createRedisConnection();

/** Fires when a task reminder is due */
export const reminderQueue = new Queue("reminders", { connection });

/** Fires daily at 8am for the digest email */
export const digestQueue = new Queue("daily-digest", { connection });

/** Fires when a task changes and needs calendar re-sync */
export const calendarSyncQueue = new Queue("calendar-sync", { connection });

/**
 * Add a reminder job for a specific task reminder record.
 * The job delay is computed from: dueDate - offsetMinutes - now
 */
export async function scheduleReminder(reminder: {
  id: string;
  taskId: string;
  taskTitle: string;
  dueDate: Date;
  offsetMinutes: number;
  channel: string;
  userId: string;
}) {
  const fireAt =
    reminder.dueDate.getTime() - reminder.offsetMinutes * 60 * 1000;
  const delayMs = Math.max(0, fireAt - Date.now());

  await reminderQueue.add(
    "send-reminder",
    {
      reminderId: reminder.id,
      taskId: reminder.taskId,
      taskTitle: reminder.taskTitle,
      userId: reminder.userId,
      channel: reminder.channel,
    },
    {
      delay: delayMs,
      jobId: `reminder-${reminder.id}`, // idempotent — won't duplicate
      removeOnComplete: true,
      removeOnFail: { count: 10 },
    }
  );
}

/** Queue a calendar sync for a task after save */
export async function queueCalendarSync(taskId: string, userId: string) {
  await calendarSyncQueue.add(
    "sync-task",
    { taskId, userId },
    {
      jobId: `cal-sync-${taskId}`,
      delay: 2000, // 2s debounce — coalesce rapid saves
      removeOnComplete: true,
    }
  );
}
