"use client";

import { cn } from "@/lib/utils";
import type { FuelLevel } from "@/lib/services/fuel-estimator";

export function FuelGauge({ fuel }: { fuel: FuelLevel }) {
  const pct = fuel.pct;
  const color =
    fuel.status === "critical"
      ? "text-red-500"
      : fuel.status === "low"
      ? "text-amber-500"
      : "text-primary";

  const barColor =
    fuel.status === "critical"
      ? "bg-red-500"
      : fuel.status === "low"
      ? "bg-amber-500"
      : "bg-primary";

  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground text-center">
        Estimated fuel level
      </p>
      <p className={cn("text-5xl font-bold text-center mt-1", color)}>
        {pct}%
      </p>

      {/* Bar */}
      <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{fuel.liters.toFixed(1)} L left</span>
        <span>~{fuel.kmRemaining} km range</span>
        <span>{fuel.kmplUsed} km/L</span>
      </div>
    </div>
  );
}
