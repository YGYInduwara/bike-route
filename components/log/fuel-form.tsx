"use client";

import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { createFuelEntry } from "@/lib/actions/log";
import { ReceiptScanner } from "./receipt-scanner";

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

interface FuelFormProps {
  vehicleId: string;
  defaults: {
    date: string;
    odometerKm: number;
    pricePerLiter: number;
    station: string;
  };
}

export function FuelForm({ vehicleId, defaults }: FuelFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [date, setDate] = useState(defaults.date);
  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState(defaults.pricePerLiter.toFixed(2));
  const [station, setStation] = useState(defaults.station);
  const [isFullTank, setIsFullTank] = useState(true);

  const totalCost =
    liters && price ? (parseFloat(liters) * parseFloat(price)).toFixed(2) : "";

  function handleOcrFill(data: {
    date: string | null;
    litersFilled: number | null;
    pricePerLiter: number | null;
    totalCost: number | null;
    station: string | null;
  }) {
    if (data.date) setDate(data.date);
    if (data.litersFilled) setLiters(String(data.litersFilled));
    if (data.pricePerLiter) setPrice(String(data.pricePerLiter));
    if (data.station) setStation(data.station);
  }

  function handleSubmit(formData: FormData) {
    formData.set("isFullTank", isFullTank ? "true" : "false");
    formData.set("totalCost", totalCost || "0");
    setMessage(null);
    startTransition(async () => {
      try {
        await createFuelEntry(vehicleId, formData);
        setMessage({ type: "success", text: "Fill-up logged!" });
        setLiters("");
        setFormKey((k) => k + 1);
      } catch (e) {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save." });
      }
    });
  }

  return (
    <form key={formKey} action={handleSubmit}>
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        {/* Receipt scanner */}
        <ReceiptScanner onFill={handleOcrFill} />

        {/* Date + Odometer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(inputCls, "mt-1")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Odometer (km)</label>
            <input
              name="odometerKm"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={defaults.odometerKm}
              className={cn(inputCls, "mt-1")}
            />
          </div>
        </div>

        {/* Liters */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Liters filled</label>
          <input
            name="litersFilled"
            type="text"
            inputMode="decimal"
            value={liters}
            onChange={(e) => setLiters(e.target.value)}
            placeholder="e.g. 3.50"
            className={cn(inputCls, "mt-1 text-lg font-semibold")}
          />
        </div>

        {/* Price + Auto total */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Price / L (LKR)</label>
            <input
              name="pricePerLiter"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={cn(inputCls, "mt-1")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Total (LKR)</label>
            <div className={cn(inputCls, "mt-1 bg-muted text-muted-foreground select-none")}>
              {totalCost ? `Rs. ${totalCost}` : "—"}
            </div>
          </div>
        </div>

        {/* Full tank toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Full tank</p>
            <p className="text-xs text-muted-foreground">Enables mileage calculation</p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullTank((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              isFullTank ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                isFullTank ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {/* Station */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Station (optional)</label>
          <input
            name="station"
            type="text"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="e.g. Lanka IOC Nugegoda"
            className={cn(inputCls, "mt-1")}
          />
        </div>
      </div>

      {message && (
        <p className={cn("mt-3 text-xs text-center", message.type === "success" ? "text-green-600" : "text-destructive")}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !liters}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Logging…" : "⛽ Log Fill-up"}
      </button>
    </form>
  );
}
