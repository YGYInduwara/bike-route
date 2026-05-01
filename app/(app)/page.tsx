import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { syncUser } from "@/lib/actions/user";
import { getDashboardData } from "@/lib/services/dashboard";
import { FuelGauge } from "@/components/dashboard/fuel-gauge";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0];
  if (!vehicle) redirect("/settings");

  const settings = user.settings;

  const data = await getDashboardData(
    vehicle.id,
    settings?.lowFuelThresholdPct ?? 20,
    settings?.dueSoonKmThreshold ?? 500,
    settings?.dueSoonDayThreshold ?? 14
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">BikeTracker</h1>
          <p className="text-sm text-muted-foreground">{vehicle.name}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {vehicle.currentOdometerKm.toLocaleString()} km
        </p>
      </div>

      {/* Fuel gauge */}
      {data?.fuel ? (
        <FuelGauge fuel={data.fuel} />
      ) : (
        <div className="rounded-2xl border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Estimated fuel level</p>
          <p className="text-4xl font-bold text-muted-foreground mt-1">– %</p>
          <p className="text-xs text-muted-foreground mt-1">
            Log a fill-up to start tracking
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-2xl font-semibold mt-0.5">
            {data && data.todayKm > 0 ? `${data.todayKm} km` : "– km"}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">This month</p>
          <p className="text-2xl font-semibold mt-0.5">
            {data && data.monthKm > 0 ? `${data.monthKm} km` : "– km"}
          </p>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-sm font-medium mb-2">Alerts</p>
        {data && data.alerts.length > 0 ? (
          <ul className="space-y-2">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-2">
                <span className="mt-0.5 text-base leading-none">
                  {alert.severity === "error" ? "🔴" : "🟡"}
                </span>
                <div>
                  <p className="text-sm font-medium">{alert.label}</p>
                  <p className="text-xs text-muted-foreground">{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No pending alerts</p>
        )}
      </div>

      {/* Quick-add */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/log?tab=fuel"
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground h-14 font-medium text-sm"
        >
          ⛽ Log Fuel
        </Link>
        <Link
          href="/log?tab=odometer"
          className="flex items-center justify-center gap-2 rounded-2xl border bg-card h-14 font-medium text-sm"
        >
          📍 Odometer
        </Link>
      </div>
    </div>
  );
}
