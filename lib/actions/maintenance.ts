"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");
  return user;
}

const markDoneSchema = z.object({
  doneDate: z.string().min(1),
  doneAtKm: z.coerce.number().optional(),
  cost: z.coerce.number().min(0).optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export async function markMaintenanceDone(taskId: string, formData: FormData) {
  const user = await getDbUser();

  // Verify ownership
  const task = await prisma.maintenanceTask.findFirst({
    where: { id: taskId, vehicle: { userId: user.id } },
    include: { vehicle: true },
  });
  if (!task) throw new Error("Task not found");

  const parsed = markDoneSchema.safeParse({
    doneDate: formData.get("doneDate"),
    doneAtKm: formData.get("doneAtKm") || undefined,
    cost: formData.get("cost") || undefined,
    vendor: formData.get("vendor") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { doneDate, doneAtKm, cost, vendor, notes } = parsed.data;
  const doneKm = doneAtKm ?? task.vehicle.currentOdometerKm;
  const doneDateObj = new Date(doneDate);

  // Compute next due
  const nextDueKm = task.intervalKm ? doneKm + task.intervalKm : null;
  const nextDueDate = task.intervalMonths
    ? (() => {
        const d = new Date(doneDateObj);
        d.setMonth(d.getMonth() + task.intervalMonths!);
        return d;
      })()
    : null;

  await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        taskId,
        doneDate: doneDateObj,
        doneAtKm: doneKm,
        cost: cost ?? null,
        vendor: vendor || null,
        notes: notes || null,
      },
    });

    await tx.maintenanceTask.update({
      where: { id: taskId },
      data: {
        lastDoneKm: doneKm,
        lastDoneDate: doneDateObj,
        nextDueKm,
        nextDueDate,
        status: "OK",
      },
    });

    if (cost && cost > 0) {
      await tx.expense.create({
        data: {
          vehicleId: task.vehicleId,
          date: doneDateObj,
          category: "MAINTENANCE",
          amount: cost,
          description: task.label,
          maintenanceLogId: log.id,
        },
      });
    }
  });

  revalidatePath("/maintenance");
  revalidatePath("/");
}

