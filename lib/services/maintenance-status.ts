import { prisma } from "@/lib/db/prisma";

// Plain async function — no "use server", safe to call during page render
export async function refreshMaintenanceStatuses(vehicleId: string) {
  const [tasks, vehicle] = await Promise.all([
    prisma.maintenanceTask.findMany({ where: { vehicleId, isActive: true } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!vehicle) return;

  const now = new Date();

  for (const task of tasks) {
    let status: "OK" | "DUE_SOON" | "OVERDUE" = "OK";

    const kmOverdue =
      task.nextDueKm !== null && vehicle.currentOdometerKm >= task.nextDueKm;
    const kmDueSoon =
      task.nextDueKm !== null &&
      vehicle.currentOdometerKm >= task.nextDueKm - 500;
    const dateOverdue = task.nextDueDate !== null && task.nextDueDate < now;
    const dateDueSoon =
      task.nextDueDate !== null &&
      task.nextDueDate.getTime() - now.getTime() <= 14 * 86400000;

    if (kmOverdue || dateOverdue) status = "OVERDUE";
    else if (kmDueSoon || dateDueSoon) status = "DUE_SOON";

    if (status !== task.status) {
      await prisma.maintenanceTask.update({
        where: { id: task.id },
        data: { status },
      });
    }
  }
}
