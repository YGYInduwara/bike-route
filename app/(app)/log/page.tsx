import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { syncUser } from "@/lib/actions/user";
import { LogTabs } from "@/components/log/log-tabs";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0];
  if (!vehicle) redirect("/settings");

  const params = await searchParams;

  const [lastFuel, latestPrice] = await Promise.all([
    prisma.fuelEntry.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { date: "desc" },
    }),
    prisma.priceHistory.findFirst({
      where: { fuelType: vehicle.fuelType },
      orderBy: { effectiveDate: "desc" },
    }),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const fuelDefaults = {
    date: today,
    odometerKm: vehicle.currentOdometerKm,
    pricePerLiter: lastFuel?.pricePerLiter ?? latestPrice?.pricePerLiter ?? 294,
    station: lastFuel?.station ?? "",
  };

  const odometerDefaults = {
    date: today,
    odometerKm: vehicle.currentOdometerKm,
  };

  const activeTab =
    params.tab === "odometer"
      ? "odometer"
      : params.tab === "expense"
      ? "expense"
      : "fuel";

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Log</h1>
        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
      </div>
      <LogTabs
        vehicleId={vehicle.id}
        fuelDefaults={fuelDefaults}
        odometerDefaults={odometerDefaults}
        activeTab={activeTab as "fuel" | "odometer" | "expense"}
      />
    </div>
  );
}
