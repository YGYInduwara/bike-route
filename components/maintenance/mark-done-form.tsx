"use client";

import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { markMaintenanceDone } from "@/lib/actions/maintenance";

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

interface MarkDoneFormProps {
  taskId: string;
  taskLabel: string;
  currentOdometer: number;
  onDone: () => void;
}

export function MarkDoneForm({
  taskId,
  taskLabel,
  currentOdometer,
  onDone,
}: MarkDoneFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await markMaintenanceDone(taskId, formData);
        onDone();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3 pt-3 border-t mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Date done
          </label>
          <input
            name="doneDate"
            type="date"
            defaultValue={today}
            className={cn(inputCls, "mt-1")}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Odometer (km)
          </label>
          <input
            name="doneAtKm"
            type="number"
            defaultValue={currentOdometer}
            className={cn(inputCls, "mt-1")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Cost (LKR)
          </label>
          <input
            name="cost"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className={cn(inputCls, "mt-1")}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Vendor
          </label>
          <input
            name="vendor"
            type="text"
            placeholder="e.g. Honda service"
            className={cn(inputCls, "mt-1")}
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
          placeholder={`e.g. Used Motul 10W-30`}
          className={cn(inputCls, "mt-1")}
        />
      </div>

      {message && (
        <p className="text-xs text-destructive">{message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Saving…" : `✓ Mark "${taskLabel}" Done`}
      </button>
    </form>
  );
}
