"use client";

import { useTransition, useState } from "react";
import { type Vehicle } from "@prisma/client";
import { updateVehicle } from "@/lib/actions/vehicle";

const inputCls =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function VehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateVehicle(vehicle.id, formData);
        setMessage({ type: "success", text: "Vehicle saved." });
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Failed to save.",
        });
      }
    });
  }

  const purchaseDateStr = vehicle.purchaseDate
    ? new Date(vehicle.purchaseDate).toISOString().split("T")[0]
    : "";

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Nickname — full width */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Nickname
          </label>
          <input name="name" defaultValue={vehicle.name} className={inputCls} />
        </div>

        {/* Make / Model */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Make
          </label>
          <input name="make" defaultValue={vehicle.make} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            name="model"
            defaultValue={vehicle.model}
            className={inputCls}
          />
        </div>

        {/* Registration */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Registration No.
          </label>
          <input
            name="registrationNo"
            defaultValue={vehicle.registrationNo ?? ""}
            placeholder="e.g. WP CAA 1234"
            className={inputCls}
          />
        </div>

        {/* Type / Fuel type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Type
          </label>
          <select
            name="type"
            defaultValue={vehicle.type}
            className={inputCls}
          >
            <option value="SCOOTER">Scooter</option>
            <option value="BIKE">Bike</option>
            <option value="CAR">Car</option>
            <option value="THREE_WHEELER">Three Wheeler</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Fuel
          </label>
          <select
            name="fuelType"
            defaultValue={vehicle.fuelType}
            className={inputCls}
          >
            <option value="OCTANE_92">Octane 92</option>
            <option value="OCTANE_95">Octane 95</option>
            <option value="DIESEL">Diesel</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>

        {/* Tank / Baseline */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Tank (L)
          </label>
          <input
            name="tankCapacityL"
            type="number"
            step="0.1"
            defaultValue={vehicle.tankCapacityL}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Baseline km/L
          </label>
          <input
            name="baselineKmpl"
            type="number"
            step="0.1"
            defaultValue={vehicle.baselineKmpl}
            className={inputCls}
          />
        </div>

        {/* Odometer / Purchase date */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Odometer (km)
          </label>
          <input
            name="currentOdometerKm"
            type="number"
            step="1"
            defaultValue={vehicle.currentOdometerKm}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Purchase Date
          </label>
          <input
            name="purchaseDate"
            type="date"
            defaultValue={purchaseDateStr}
            className={inputCls}
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save Vehicle"}
      </button>
    </form>
  );
}
