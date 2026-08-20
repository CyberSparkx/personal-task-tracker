/**
 * GET /api/tasks/[id]/export-pdf
 *
 * Renders the task's markdown notes to a beautifully styled PDF using Puppeteer.
 * Returns the PDF as a binary download with the task title as the filename.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

type RouteParams = { params: Promise<{ id: string }> };

/** Convert markdown to styled HTML for PDF rendering */
function buildHtml(task: {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  markdownNotes: string | null;
  project: { name: string; color: string } | null;
  tags: { tag: { name: string; color: string } }[];
}) {
  // Basic markdown → HTML conversion (headings, bold, italic, code, lists, links)
  const md = task.markdownNotes ?? "*No notes added yet.*";

  const htmlContent = md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img alt="$1" src="$2" style="max-width:100%">')
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  const PRIORITY_COLOR: Record<string, string> = {
    URGENT: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#8b5cf6",
    LOW: "#22c55e",
  };
  const STATUS_COLOR: Record<string, string> = {
    TODO: "#64748b",
    IN_PROGRESS: "#38bdf8",
    DONE: "#22c55e",
    CANCELLED: "#475569",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${task.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.7; font-size: 14px; padding: 48px 56px; background: #fff; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 28px; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #8b5cf6; margin-bottom: 12px; }
    h1.title { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
    .description { margin: 20px 0; padding: 14px 18px; background: #f8fafc; border-left: 4px solid #8b5cf6; border-radius: 6px; font-size: 13px; color: #475569; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 28px 0 12px; }
    .notes { color: #1e293b; }
    .notes p { margin-bottom: 12px; }
    .notes h1, .notes h2, .notes h3 { color: #0f172a; font-weight: 700; margin: 20px 0 8px; }
    .notes h1 { font-size: 22px; } .notes h2 { font-size: 18px; } .notes h3 { font-size: 15px; }
    .notes code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; color: #7c3aed; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
    .notes blockquote { border-left: 3px solid #8b5cf6; padding-left: 14px; color: #64748b; font-style: italic; }
    .notes li { margin-left: 20px; margin-bottom: 4px; }
    .notes img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    .notes a { color: #8b5cf6; text-decoration: underline; }
    .notes hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">⚡ TaskFlow</div>
    <h1 class="title">${task.title}</h1>
    <div class="meta">
      <span class="badge" style="background:${PRIORITY_COLOR[task.priority]}18;color:${PRIORITY_COLOR[task.priority]};border:1px solid ${PRIORITY_COLOR[task.priority]}40">
        ${task.priority}
      </span>
      <span class="badge" style="background:${STATUS_COLOR[task.status]}18;color:${STATUS_COLOR[task.status]};border:1px solid ${STATUS_COLOR[task.status]}40">
        ${task.status.replace("_", " ")}
      </span>
      ${task.project ? `<span class="badge" style="background:${task.project.color}18;color:${task.project.color};border:1px solid ${task.project.color}40">${task.project.name}</span>` : ""}
      ${task.dueDate ? `<span class="badge" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0">📅 Due: ${task.dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>` : ""}
      ${task.tags.map((t) => `<span class="badge" style="background:${t.tag.color}18;color:${t.tag.color};border:1px solid ${t.tag.color}40">#${t.tag.name}</span>`).join("")}
    </div>
    ${task.description ? `<div class="description">${task.description}</div>` : ""}
  </div>

  <div class="section-title">Notes</div>
  <div class="notes"><p>${htmlContent}</p></div>

  <div class="footer">
    <span>Exported from TaskFlow</span>
    <span>${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</span>
  </div>
</body>
</html>`;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: {
      project: { select: { name: true, color: true } },
      tags: { include: { tag: { select: { name: true, color: true } } } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const html = buildHtml(task as any);

  // Launch Puppeteer, render HTML, print PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" as any });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${task.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
