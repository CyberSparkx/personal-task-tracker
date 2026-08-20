/**
 * Web Push helper
 *
 * Wraps the `web-push` library with VAPID keys from env vars.
 * Used by the BullMQ worker to send push notifications to subscribed browsers/PWAs.
 */

import webpush from "web-push";

// Configure VAPID once at module load
webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? "mailto:admin@localhost",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Send a push notification to a stored subscription.
 * subscription is the JSON object stored in User.vapidSubscription
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    // 410 = subscription expired / user unsubscribed
    if (err.statusCode === 410) {
      return "expired";
    }
    throw err;
  }
}
