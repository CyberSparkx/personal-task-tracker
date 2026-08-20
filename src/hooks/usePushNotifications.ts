"use client";

/**
 * usePushNotifications hook
 *
 * Handles:
 *  - Service worker registration
 *  - Checking permission state
 *  - Subscribing / unsubscribing to Web Push
 *  - Persisting subscription to the server
 */

import { useState, useEffect, useCallback } from "react";

type PushState = "unsupported" | "denied" | "default" | "subscribed" | "loading";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    (async () => {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setState("subscribed");
        return;
      }

      const perm = Notification.permission;
      if (perm === "denied") setState("denied");
      else setState("default");
    })();
  }, []);

  const subscribe = useCallback(async () => {
    setState("loading");
    setError(null);

    try {
      // Get VAPID public key from server
      const keyRes = await fetch("/api/notifications/subscribe");
      const { publicKey } = await keyRes.json();

      if (!publicKey) {
        setError("Push notifications not configured on server.");
        setState("default");
        return;
      }

      // Request notification permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState("denied");
        return;
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setState("subscribed");
    } catch (err: any) {
      setError(err.message);
      setState("default");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState("loading");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await fetch("/api/notifications/subscribe", { method: "DELETE" });
    setState("default");
  }, []);

  return { state, error, subscribe, unsubscribe };
}

/** Convert a base64 VAPID key to Uint8Array for the Push API */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
