"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { FuelType } from "@prisma/client";

const settingsSchema = z.object({
  defaultFuelType: z.nativeEnum(FuelType),
  lowFuelThresholdPct: z.coerce.number().int().min(5).max(50),
  dueSoonKmThreshold: z.coerce.number().int().min(100).max(2000),
  dueSoonDayThreshold: z.coerce.number().int().min(1).max(60),
});

export async function updateUserSettings(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const parsed = settingsSchema.safeParse({
    defaultFuelType: formData.get("defaultFuelType"),
    lowFuelThresholdPct: formData.get("lowFuelThresholdPct"),
    dueSoonKmThreshold: formData.get("dueSoonKmThreshold"),
    dueSoonDayThreshold: formData.get("dueSoonDayThreshold"),
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings");
}
