"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { FuelType, VehicleType } from "@prisma/client";

const vehicleSchema = z.object({
  name: z.string().min(1, "Name required"),
  make: z.string().min(1, "Make required"),
  model: z.string().min(1, "Model required"),
  registrationNo: z.string().optional(),
  type: z.nativeEnum(VehicleType),
  fuelType: z.nativeEnum(FuelType),
  tankCapacityL: z.coerce.number().min(0.5).max(200),
  baselineKmpl: z.coerce.number().min(1).max(200),
  currentOdometerKm: z.coerce.number().min(0),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");
  return user;
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const user = await getDbUser();

  const parsed = vehicleSchema.safeParse({
    name: formData.get("name"),
    make: formData.get("make"),
    model: formData.get("model"),
    registrationNo: formData.get("registrationNo") || undefined,
    type: formData.get("type"),
    fuelType: formData.get("fuelType"),
    tankCapacityL: formData.get("tankCapacityL"),
    baselineKmpl: formData.get("baselineKmpl"),
    currentOdometerKm: formData.get("currentOdometerKm"),
    purchaseDate: formData.get("purchaseDate") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const { purchaseDate, ...rest } = parsed.data;

  await prisma.vehicle.update({
    where: { id: vehicleId, userId: user.id },
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createDefaultVehicle(userId: string) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.create({
      data: {
        userId,
        name: "My Dio",
        make: "Honda",
        model: "Dio",
        type: "SCOOTER",
        fuelType: "OCTANE_92",
        tankCapacityL: 5.3,
        baselineKmpl: 48,
        currentOdometerKm: 65279,
      },
    });

    await tx.odometerReading.create({
      data: {
        vehicleId: vehicle.id,
        date: new Date(),
        odometerKm: 65279,
        source: "MANUAL",
        notes: "Initial reading",
      },
    });

    await tx.maintenanceTask.createMany({
      data: [
        { vehicleId: vehicle.id, type: "oil_change", label: "Engine Oil Change", intervalKm: 3000, intervalMonths: 3, sortOrder: 1 },
        { vehicleId: vehicle.id, type: "full_service", label: "Full Service", intervalKm: 6000, intervalMonths: 6, sortOrder: 2 },
        { vehicleId: vehicle.id, type: "air_filter", label: "Air Filter Clean / Replace", intervalKm: 6000, intervalMonths: 6, sortOrder: 3 },
        { vehicleId: vehicle.id, type: "spark_plug", label: "Spark Plug Check", intervalKm: 12000, intervalMonths: 12, sortOrder: 4 },
        { vehicleId: vehicle.id, type: "front_tyre", label: "Front Tyre Replacement", intervalKm: 18000, intervalMonths: 36, sortOrder: 5 },
        { vehicleId: vehicle.id, type: "rear_tyre", label: "Rear Tyre Replacement", intervalKm: 13000, intervalMonths: 24, sortOrder: 6 },
        { vehicleId: vehicle.id, type: "brake_pad", label: "Brake Pad Inspection", intervalKm: 6000, intervalMonths: 6, sortOrder: 7 },
        { vehicleId: vehicle.id, type: "drive_belt", label: "Drive Belt (CVT)", intervalKm: 24000, intervalMonths: 24, sortOrder: 8 },
        { vehicleId: vehicle.id, type: "battery_check", label: "Battery Check", intervalMonths: 6, sortOrder: 9 },
      ],
    });

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await tx.renewalReminder.createMany({
      data: [
        { vehicleId: vehicle.id, type: "INSURANCE", label: "Vehicle Insurance", currentExpiryDate: nextYear },
        { vehicleId: vehicle.id, type: "REVENUE_LICENSE", label: "Revenue License", currentExpiryDate: nextYear },
        { vehicleId: vehicle.id, type: "EMISSION_TEST", label: "Emission Test", currentExpiryDate: nextYear },
      ],
    });

    await tx.priceHistory.upsert({
      where: { fuelType_effectiveDate: { fuelType: "OCTANE_92", effectiveDate: new Date("2025-10-31") } },
      create: { fuelType: "OCTANE_92", pricePerLiter: 294, effectiveDate: new Date("2025-10-31"), source: "CPC Gazette 2025-10-31" },
      update: {},
    });

    await tx.userSettings.upsert({
      where: { userId },
      create: { userId, defaultVehicleId: vehicle.id },
      update: { defaultVehicleId: vehicle.id },
    });

    return vehicle;
  });
}
