/**
 * POST /api/notifications/subscribe
 * Saves a Web Push subscription for the current user.
 *
 * DELETE /api/notifications/subscribe
 * Removes the subscription (user opted out or uninstalled PWA).
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { vapidSubscription: subscription },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { vapidSubscription: null },
  });

  return NextResponse.json({ success: true });
}

// GET — returns the VAPID public key so the client can subscribe
export async function GET() {
  return NextResponse.json({
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  });
}
