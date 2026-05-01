import { prisma } from "@/lib/db/prisma";
import { sendPushNotification } from "@/lib/push/web-push";

const THROTTLE_HOURS = 20; // don't re-send same reminder within 20 hours

async function alreadySent(
  userId: string,
  dueRefId: string,
  type: string
): Promise<boolean> {
  const cutoff = new Date(Date.now() - THROTTLE_HOURS * 3600000);
  const existing = await prisma.notification.findFirst({
    where: { userId, dueRefId, type: type as never, sentAt: { gte: cutoff } },
  });
  return !!existing;
}

async function notify(
  userId: string,
  vehicleId: string,
  type: string,
  title: string,
  body: string,
  dueRefId: string
) {
  if (await alreadySent(userId, dueRefId, type)) return;

  // Log in-app notification
  await prisma.notification.create({
    data: {
      userId,
      vehicleId,
      type: type as never,
      channel: "IN_APP",
      title,
      body,
      dueRefId,
    },
  });

  // Send Web Push to all active subscriptions
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const stale: string[] = [];

  for (const sub of subs) {
    const ok = await sendPushNotification(sub.endpoint, sub.p256dh, sub.auth, {
      title,
      body,
      url: "/",
    });
    if (!ok) stale.push(sub.endpoint);
  }

  if (stale.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: stale } },
    });
  }
}

export async function runReminderEngine() {
  const now = new Date();
  const users = await prisma.user.findMany({
    include: {
      settings: true,
      vehicles: { where: { isActive: true } },
    },
  });

  let sent = 0;

  for (const user of users) {
    const kmThreshold = user.settings?.dueSoonKmThreshold ?? 500;
    const dayThreshold = user.settings?.dueSoonDayThreshold ?? 14;

    for (const vehicle of user.vehicles) {
      // ── Maintenance reminders ──────────────────────────────────────────
      const tasks = await prisma.maintenanceTask.findMany({
        where: { vehicleId: vehicle.id, isActive: true },
      });

      for (const task of tasks) {
        const kmOverdue =
          task.nextDueKm !== null &&
          vehicle.currentOdometerKm >= task.nextDueKm;
        const kmDueSoon =
          task.nextDueKm !== null &&
          vehicle.currentOdometerKm >= task.nextDueKm - kmThreshold;
        const daysLeft = task.nextDueDate
          ? Math.round((task.nextDueDate.getTime() - now.getTime()) / 86400000)
          : null;
        const dateOverdue = daysLeft !== null && daysLeft < 0;
        const dateDueSoon = daysLeft !== null && daysLeft <= dayThreshold;

        if (kmOverdue || dateOverdue) {
          await notify(
            user.id,
            vehicle.id,
            "MAINTENANCE_OVERDUE",
            `${task.label} overdue`,
            `${vehicle.name}: ${task.label} is overdue. Schedule service now.`,
            task.id
          );
          sent++;
        } else if (kmDueSoon || dateDueSoon) {
          const detail = daysLeft !== null ? `in ${daysLeft} days` : `in ${Math.round(task.nextDueKm! - vehicle.currentOdometerKm)} km`;
          await notify(
            user.id,
            vehicle.id,
            "MAINTENANCE_DUE",
            `${task.label} due soon`,
            `${vehicle.name}: ${task.label} is due ${detail}.`,
            task.id
          );
          sent++;
        }
      }

      // ── Renewal reminders ──────────────────────────────────────────────
      const renewals = await prisma.renewalReminder.findMany({
        where: { vehicleId: vehicle.id, isActive: true },
      });

      for (const renewal of renewals) {
        const daysLeft = Math.round(
          (renewal.currentExpiryDate.getTime() - now.getTime()) / 86400000
        );
        const windows = [30, 14, 7, 1];

        for (const window of windows) {
          if (daysLeft <= window && daysLeft > window - 1) {
            await notify(
              user.id,
              vehicle.id,
              "RENEWAL_DUE",
              `${renewal.label} expires ${daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`}`,
              `${vehicle.name}: ${renewal.label} expires on ${renewal.currentExpiryDate.toLocaleDateString("en-LK")}.`,
              renewal.id
            );
            sent++;
          }
        }

        if (daysLeft < 0) {
          await notify(
            user.id,
            vehicle.id,
            "RENEWAL_DUE",
            `${renewal.label} has expired`,
            `${vehicle.name}: ${renewal.label} expired ${Math.abs(daysLeft)} days ago. Renew immediately.`,
            renewal.id
          );
          sent++;
        }
      }
    }
  }

  return { sent };
}
