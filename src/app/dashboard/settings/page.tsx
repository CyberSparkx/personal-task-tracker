import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { provider: true, scope: true },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Manage your account, integrations, and notification preferences.
        </p>
      </div>
      <SettingsClient
        user={session.user as any}
        googleLinked={!!account}
        googleScopes={account?.scope ?? null}
        vapidPublicKey={process.env.VAPID_PUBLIC_KEY ? "configured" : null}
      />
    </div>
  );
}
