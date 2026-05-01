"use client";

import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { createOdometerReading } from "@/lib/actions/log";

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

interface OdometerFormProps {
  vehicleId: string;
  defaults: {
    date: string;
    odometerKm: number;
  };
}

export function OdometerForm({ vehicleId, defaults }: OdometerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await createOdometerReading(vehicleId, formData);
        setMessage({ type: "success", text: "Reading saved!" });
        setFormKey((k) => k + 1);
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Failed to save.",
        });
      }
    });
  }

  return (
    <form key={formKey} action={handleSubmit}>
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <input
              name="date"
              type="date"
              defaultValue={defaults.date}
              className={cn(inputCls, "mt-1")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Odometer (km)
            </label>
            <input
              name="odometerKm"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={defaults.odometerKm}
              className={cn(inputCls, "mt-1 text-lg font-semibold")}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Notes (optional)
          </label>
          <input
            name="notes"
            type="text"
            placeholder="e.g. After long trip to Kandy"
            className={cn(inputCls, "mt-1")}
          />
        </div>
      </div>

      {message && (
        <p
          className={cn(
            "mt-3 text-xs text-center",
            message.type === "success" ? "text-green-600" : "text-destructive"
          )}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Saving…" : "📍 Save Reading"}
      </button>
    </form>
  );
}
