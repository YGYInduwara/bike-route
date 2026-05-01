"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FuelForm } from "./fuel-form";
import { OdometerForm } from "./odometer-form";
import { ExpenseForm } from "./expense-form";

type Tab = "fuel" | "odometer" | "expense";

interface LogTabsProps {
  vehicleId: string;
  fuelDefaults: {
    date: string;
    odometerKm: number;
    pricePerLiter: number;
    station: string;
  };
  odometerDefaults: {
    date: string;
    odometerKm: number;
  };
  activeTab: Tab;
}

export function LogTabs({
  vehicleId,
  fuelDefaults,
  odometerDefaults,
  activeTab: initialTab,
}: LogTabsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex rounded-xl border bg-muted p-1">
        {(["fuel", "odometer", "expense"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "fuel"
              ? "⛽ Fuel"
              : t === "odometer"
              ? "📍 Odometer"
              : "💸 Expense"}
          </button>
        ))}
      </div>

      {tab === "fuel" && (
        <FuelForm vehicleId={vehicleId} defaults={fuelDefaults} />
      )}
      {tab === "odometer" && (
        <OdometerForm vehicleId={vehicleId} defaults={odometerDefaults} />
      )}
      {tab === "expense" && <ExpenseForm vehicleId={vehicleId} />}
    </div>
  );
}
