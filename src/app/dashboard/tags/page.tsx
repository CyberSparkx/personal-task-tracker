import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TagsClient } from "@/components/tags/TagsClient";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          <span className="gradient-text">Tags</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Organize tasks with color-coded tags.
        </p>
      </div>
      <TagsClient initialTags={tags as any} />
    </div>
  );
}
