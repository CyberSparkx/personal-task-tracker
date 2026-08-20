/**
 * Email helper using Nodemailer
 *
 * Sends transactional emails via SMTP (e.g. Gmail App Password).
 * Used by the BullMQ worker for reminders and the daily digest.
 */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReminderEmail({
  to,
  taskTitle,
  taskId,
  dueDate,
}: {
  to: string;
  taskTitle: string;
  taskId: string;
  dueDate: Date;
}) {
  const taskUrl = `${process.env.NEXTAUTH_URL}/dashboard/tasks/${taskId}`;

  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: `⏰ Reminder: "${taskTitle}"`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f0f1a;color:#e2e8f0;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-size:28px">⚡</span>
          <span style="font-size:18px;font-weight:700;background:linear-gradient(135deg,#8b5cf6,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent"> TaskFlow</span>
        </div>
        <h2 style="font-size:22px;margin:0 0 8px;color:#f8fafc">Task Reminder</h2>
        <p style="color:#94a3b8;margin:0 0 24px">You asked to be reminded about this task:</p>
        <div style="background:#1e1e2e;border:1px solid #2d2d44;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="font-size:18px;font-weight:600;color:#f8fafc;margin:0 0 8px">${taskTitle}</p>
          <p style="color:#64748b;font-size:13px;margin:0">Due: ${dueDate.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
        </div>
        <a href="${taskUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#38bdf8);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
          Open Task →
        </a>
        <p style="margin-top:32px;font-size:11px;color:#475569">Sent by TaskFlow · <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color:#64748b">Dashboard</a></p>
      </div>
    `,
  });
}

export async function sendDailyDigestEmail({
  to,
  name,
  overdue,
  dueSoon,
}: {
  to: string;
  name: string;
  overdue: { id: string; title: string; dueDate: Date | null }[];
  dueSoon: { id: string; title: string; dueDate: Date | null }[];
}) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const renderList = (
    tasks: { id: string; title: string; dueDate: Date | null }[],
    color: string
  ) =>
    tasks.length === 0
      ? `<p style="color:#64748b;font-size:13px;margin:8px 0">None! 🎉</p>`
      : tasks
          .map(
            (t) =>
              `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1e1e2e">
                <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>
                <a href="${baseUrl}/dashboard/tasks/${t.id}" style="color:#e2e8f0;text-decoration:none;font-size:14px;flex:1">${t.title}</a>
                ${t.dueDate ? `<span style="color:#64748b;font-size:12px">${t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>` : ""}
              </div>`
          )
          .join("");

  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: `📋 Your TaskFlow Daily Digest — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:540px;margin:auto;padding:32px;background:#0f0f1a;color:#e2e8f0;border-radius:16px">
        <div style="margin-bottom:20px">
          <span style="font-size:28px">⚡</span>
          <span style="font-size:18px;font-weight:700;background:linear-gradient(135deg,#8b5cf6,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent"> TaskFlow</span>
        </div>
        <h2 style="font-size:22px;margin:0 0 4px;color:#f8fafc">Good morning, ${name} 👋</h2>
        <p style="color:#94a3b8;margin:0 0 28px;font-size:14px">Here's your task summary for today.</p>

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#ef4444;margin:0 0 8px">🔴 Overdue (${overdue.length})</h3>
        ${renderList(overdue, "#ef4444")}

        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#f97316;margin:20px 0 8px">⏰ Due in 24h (${dueSoon.length})</h3>
        ${renderList(dueSoon, "#f97316")}

        <div style="margin-top:28px">
          <a href="${baseUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#38bdf8);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
            Open Dashboard →
          </a>
        </div>

        <p style="margin-top:32px;font-size:11px;color:#475569">TaskFlow Daily Digest · sent at 8:00 AM</p>
      </div>
    `,
  });
}
