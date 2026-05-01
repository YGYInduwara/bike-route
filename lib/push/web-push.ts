import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
      { TTL: 86400 }
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    // 410 = subscription expired/unsubscribed — caller should delete it
    if (status === 410 || status === 404) return false;
    console.error("Push error:", err);
    return false;
  }
}
