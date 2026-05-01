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

const renewSchema = z.object({
  renewedDate: z.string().min(1),
  expiryDate: z.string().min(1),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateRenewalSchema = z.object({
  label: z.string().min(1),
  provider: z.string().optional(),
  policyNo: z.string().optional(),
  currentExpiryDate: z.string().min(1),
  notes: z.string().optional(),
});

export async function renewReminder(reminderId: string, formData: FormData) {
  const user = await getDbUser();

  const reminder = await prisma.renewalReminder.findFirst({
    where: { id: reminderId, vehicle: { userId: user.id } },
  });
  if (!reminder) throw new Error("Reminder not found");

  const parsed = renewSchema.safeParse({
    renewedDate: formData.get("renewedDate"),
    expiryDate: formData.get("expiryDate"),
    cost: formData.get("cost") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { renewedDate, expiryDate, cost, notes } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const log = await tx.renewalLog.create({
      data: {
        reminderId,
        renewedDate: new Date(renewedDate),
        expiryDate: new Date(expiryDate),
        cost: cost ?? null,
        notes: notes || null,
      },
    });

    await tx.renewalReminder.update({
      where: { id: reminderId },
      data: {
        currentExpiryDate: new Date(expiryDate),
        lastRenewedDate: new Date(renewedDate),
        lastCost: cost ?? null,
      },
    });

    if (cost && cost > 0) {
      await tx.expense.create({
        data: {
          vehicleId: reminder.vehicleId,
          date: new Date(renewedDate),
          category: "RENEWAL",
          amount: cost,
          description: reminder.label,
          renewalLogId: log.id,
        },
      });
    }
  });

  revalidatePath("/documents");
  revalidatePath("/");
}

export async function updateRenewalDetails(
  reminderId: string,
  formData: FormData
) {
  const user = await getDbUser();

  const reminder = await prisma.renewalReminder.findFirst({
    where: { id: reminderId, vehicle: { userId: user.id } },
  });
  if (!reminder) throw new Error("Reminder not found");

  const parsed = updateRenewalSchema.safeParse({
    label: formData.get("label"),
    provider: formData.get("provider") || undefined,
    policyNo: formData.get("policyNo") || undefined,
    currentExpiryDate: formData.get("currentExpiryDate"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { label, provider, policyNo, currentExpiryDate, notes } = parsed.data;

  await prisma.renewalReminder.update({
    where: { id: reminderId },
    data: {
      label,
      provider: provider || null,
      policyNo: policyNo || null,
      currentExpiryDate: new Date(currentExpiryDate),
      notes: notes || null,
    },
  });

  revalidatePath("/documents");
}
