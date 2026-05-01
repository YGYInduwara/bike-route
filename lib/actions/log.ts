"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ExpenseCategory } from "@prisma/client";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");
  return user;
}

async function getVehicle(vehicleId: string, userId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, userId },
  });
  if (!vehicle) throw new Error("Vehicle not found");
  return vehicle;
}

// ─── Fuel Entry ───────────────────────────────────────────────────────────────

const fuelEntrySchema = z.object({
  date: z.string().min(1),
  odometerKm: z.coerce.number().min(0),
  litersFilled: z.coerce.number().min(0.01).max(100),
  pricePerLiter: z.coerce.number().min(1),
  totalCost: z.coerce.number().min(0),
  isFullTank: z.string().transform((v) => v === "true"),
  station: z.string().optional(),
  notes: z.string().optional(),
});

export async function createFuelEntry(vehicleId: string, formData: FormData) {
  const user = await getDbUser();
  const vehicle = await getVehicle(vehicleId, user.id);

  const parsed = fuelEntrySchema.safeParse({
    date: formData.get("date"),
    odometerKm: formData.get("odometerKm"),
    litersFilled: formData.get("litersFilled"),
    pricePerLiter: formData.get("pricePerLiter"),
    totalCost: formData.get("totalCost"),
    isFullTank: formData.get("isFullTank"),
    station: formData.get("station") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const {
    date,
    odometerKm,
    litersFilled,
    pricePerLiter,
    totalCost,
    isFullTank,
    station,
    notes,
  } = parsed.data;

  // Calculate kmpl for this fill-up if full tank
  let calculatedKmpl: number | null = null;
  if (isFullTank) {
    const prevFullTank = await prisma.fuelEntry.findFirst({
      where: { vehicleId, isFullTank: true },
      orderBy: { date: "desc" },
    });
    if (prevFullTank && odometerKm > prevFullTank.odometerKm) {
      calculatedKmpl = (odometerKm - prevFullTank.odometerKm) / litersFilled;
    }
  }

  await prisma.$transaction(async (tx) => {
    const entry = await tx.fuelEntry.create({
      data: {
        vehicleId,
        date: new Date(date),
        odometerKm,
        litersFilled,
        pricePerLiter,
        totalCost,
        isFullTank,
        fuelType: vehicle.fuelType,
        station: station || null,
        notes: notes || null,
        calculatedKmpl,
      },
    });

    await tx.odometerReading.create({
      data: {
        vehicleId,
        date: new Date(date),
        odometerKm,
        source: "FUEL_ENTRY",
        fuelEntryId: entry.id,
      },
    });

    await tx.expense.create({
      data: {
        vehicleId,
        date: new Date(date),
        category: "FUEL",
        amount: totalCost,
        description: `${litersFilled.toFixed(2)}L @ LKR ${pricePerLiter.toFixed(2)}/L`,
        fuelEntryId: entry.id,
      },
    });

    if (odometerKm > vehicle.currentOdometerKm) {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { currentOdometerKm: odometerKm },
      });
    }
  });

  revalidatePath("/log");
  revalidatePath("/");
}

// ─── Odometer Reading ─────────────────────────────────────────────────────────

const odometerSchema = z.object({
  date: z.string().min(1),
  odometerKm: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function createOdometerReading(
  vehicleId: string,
  formData: FormData
) {
  const user = await getDbUser();
  const vehicle = await getVehicle(vehicleId, user.id);

  const parsed = odometerSchema.safeParse({
    date: formData.get("date"),
    odometerKm: formData.get("odometerKm"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { date, odometerKm, notes } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.odometerReading.create({
      data: {
        vehicleId,
        date: new Date(date),
        odometerKm,
        source: "MANUAL",
        notes: notes || null,
      },
    });

    if (odometerKm > vehicle.currentOdometerKm) {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { currentOdometerKm: odometerKm },
      });
    }
  });

  revalidatePath("/log");
  revalidatePath("/");
}

// ─── Manual Expense ───────────────────────────────────────────────────────────

const expenseSchema = z.object({
  date: z.string().min(1),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.coerce.number().min(0.01),
  description: z.string().optional(),
});

export async function createExpense(vehicleId: string, formData: FormData) {
  const user = await getDbUser();
  await getVehicle(vehicleId, user.id);

  const parsed = expenseSchema.safeParse({
    date: formData.get("date"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { date, category, amount, description } = parsed.data;

  await prisma.expense.create({
    data: {
      vehicleId,
      date: new Date(date),
      category,
      amount,
      description: description || null,
    },
  });

  revalidatePath("/log");
  revalidatePath("/");
}
