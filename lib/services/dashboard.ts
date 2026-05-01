import { prisma } from "@/lib/db/prisma";
import { getFuelLevel } from "./fuel-estimator";

export interface DashboardData {
  vehicle: {
    id: string;
    name: string;
    currentOdometerKm: number;
  };
  fuel: Awaited<ReturnType<typeof getFuelLevel>>;
  todayKm: number;
  monthKm: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: "maintenance" | "renewal" | "low_fuel";
  severity: "warning" | "error";
  label: string;
  detail: string;
}

export async function getDashboardData(
  vehicleId: string,
  lowFuelThresholdPct: number,
  dueSoonKmThreshold: number,
  dueSoonDayThreshold: number
): Promise<DashboardData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });
  if (!vehicle) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [fuel, odometerReadings, maintenanceTasks, renewals] =
    await Promise.all([
      getFuelLevel(vehicleId, lowFuelThresholdPct),
      prisma.odometerReading.findMany({
        where: { vehicleId, date: { gte: monthStart } },
        orderBy: { date: "asc" },
      }),
      prisma.maintenanceTask.findMany({
        where: {
          vehicleId,
          isActive: true,
          status: { in: ["DUE_SOON", "OVERDUE"] },
        },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
      prisma.renewalReminder.findMany({
        where: { vehicleId, isActive: true },
        orderBy: { currentExpiryDate: "asc" },
        take: 3,
      }),
    ]);

  // km today: difference between first and last odometer reading today
  const todayReadings = odometerReadings.filter(
    (r) => r.date >= todayStart
  );
  let todayKm = 0;
  if (todayReadings.length >= 2) {
    todayKm =
      todayReadings[todayReadings.length - 1].odometerKm -
      todayReadings[0].odometerKm;
  }

  // km this month: latest odometer - first odometer this month
  let monthKm = 0;
  if (odometerReadings.length >= 2) {
    monthKm =
      odometerReadings[odometerReadings.length - 1].odometerKm -
      odometerReadings[0].odometerKm;
  }

  // Build alerts
  const alerts: Alert[] = [];

  // Low fuel alert
  if (fuel && (fuel.status === "low" || fuel.status === "critical")) {
    alerts.push({
      id: "low_fuel",
      type: "low_fuel",
      severity: fuel.status === "critical" ? "error" : "warning",
      label: "Low fuel",
      detail: `~${fuel.pct}% · ${fuel.kmRemaining} km remaining`,
    });
  }

  // Maintenance alerts
  for (const task of maintenanceTasks) {
    const isOverdue = task.status === "OVERDUE";
    let detail = "";
    if (task.nextDueKm) {
      const diff = task.nextDueKm - vehicle.currentOdometerKm;
      detail =
        diff <= 0
          ? `${Math.abs(Math.round(diff))} km overdue`
          : `in ${Math.round(diff)} km`;
    } else if (task.nextDueDate) {
      const days = Math.round(
        (task.nextDueDate.getTime() - now.getTime()) / 86400000
      );
      detail =
        days < 0
          ? `${Math.abs(days)} days overdue`
          : `in ${days} day${days === 1 ? "" : "s"}`;
    }
    alerts.push({
      id: task.id,
      type: "maintenance",
      severity: isOverdue ? "error" : "warning",
      label: task.label,
      detail,
    });
  }

  // Renewal alerts
  for (const renewal of renewals) {
    const daysLeft = Math.round(
      (renewal.currentExpiryDate.getTime() - now.getTime()) / 86400000
    );
    if (daysLeft <= dueSoonDayThreshold) {
      alerts.push({
        id: renewal.id,
        type: "renewal",
        severity: daysLeft <= 7 ? "error" : "warning",
        label: renewal.label,
        detail:
          daysLeft < 0
            ? `Expired ${Math.abs(daysLeft)} days ago`
            : daysLeft === 0
            ? "Expires today"
            : `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      });
    }
  }

  return {
    vehicle: {
      id: vehicle.id,
      name: vehicle.name,
      currentOdometerKm: vehicle.currentOdometerKm,
    },
    fuel,
    todayKm: Math.max(0, Math.round(todayKm)),
    monthKm: Math.max(0, Math.round(monthKm)),
    alerts: alerts.slice(0, 3),
  };
}
