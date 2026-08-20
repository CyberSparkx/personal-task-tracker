import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsClient } from "@/components/projects/ProjectsClient";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        where: { parentTaskId: null },
        select: { status: true },
        take: 100,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          <span className="gradient-text">Projects</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Organize your tasks into projects with color labels.
        </p>
      </div>
      <ProjectsClient initialProjects={projects as any} />
    </div>
  );
}
