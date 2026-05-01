"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  if (!supported) return null;

  async function toggle() {
    setMessage(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();

        if (existing) {
          await existing.unsubscribe();
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: existing.endpoint }),
          });
          setSubscribed(false);
          setMessage("Notifications disabled.");
        } else {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            setMessage("Permission denied. Enable notifications in browser settings.");
            return;
          }
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          const json = sub.toJSON();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json),
          });
          setSubscribed(true);
          setMessage("Notifications enabled!");
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Push notifications</p>
        <p className="text-xs text-muted-foreground">
          Maintenance & renewal reminders
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
          subscribed ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            subscribed ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      {message && (
        <p className="text-xs text-muted-foreground mt-1 absolute">{message}</p>
      )}
    </div>
  );
}
