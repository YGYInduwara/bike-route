import { prisma } from "@/lib/db/prisma";

export interface FuelLevel {
  pct: number;
  liters: number;
  kmRemaining: number;
  kmplUsed: number;
  status: "ok" | "low" | "critical" | "unknown";
}

export async function getFuelLevel(
  vehicleId: string,
  lowThresholdPct: number = 20
): Promise<FuelLevel | null> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return null;

  // Last full-tank fill-up is the baseline
  const lastFull = await prisma.fuelEntry.findFirst({
    where: { vehicleId, isFullTank: true },
    orderBy: { date: "desc" },
  });

  if (!lastFull) return null;

  // Rolling mileage: last 5 full-tank pairs
  const fullTanks = await prisma.fuelEntry.findMany({
    where: { vehicleId, isFullTank: true, calculatedKmpl: { not: null } },
    orderBy: { date: "desc" },
    take: 5,
  });

  let kmpl = vehicle.baselineKmpl;
  if (fullTanks.length > 0) {
    // Weighted average — more recent = higher weight
    let weightedSum = 0;
    let totalWeight = 0;
    fullTanks.forEach((entry, i) => {
      const weight = fullTanks.length - i;
      weightedSum += (entry.calculatedKmpl ?? vehicle.baselineKmpl) * weight;
      totalWeight += weight;
    });
    kmpl = weightedSum / totalWeight;
  }

  const kmSince = vehicle.currentOdometerKm - lastFull.odometerKm;
  const consumed = kmSince / kmpl;
  const estimatedLiters = Math.max(0, lastFull.litersFilled - consumed);
  const pct = Math.min(100, (estimatedLiters / vehicle.tankCapacityL) * 100);
  const kmRemaining = estimatedLiters * kmpl;

  let status: FuelLevel["status"] = "ok";
  if (pct <= 10) status = "critical";
  else if (pct <= lowThresholdPct) status = "low";

  return {
    pct: Math.round(pct),
    liters: Math.round(estimatedLiters * 100) / 100,
    kmRemaining: Math.round(kmRemaining),
    kmplUsed: Math.round(kmpl * 10) / 10,
    status,
  };
}
