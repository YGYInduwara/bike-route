"use client";

import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { createExpense } from "@/lib/actions/log";

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

const CATEGORIES = [
  { value: "PARKING", label: "Parking" },
  { value: "WASHING", label: "Washing" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "TOLL", label: "Toll" },
  { value: "OTHER", label: "Other" },
] as const;

export function ExpenseForm({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await createExpense(vehicleId, formData);
        setMessage({ type: "success", text: "Expense logged!" });
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
              defaultValue={today}
              className={cn(inputCls, "mt-1")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              name="category"
              defaultValue="OTHER"
              className={cn(inputCls, "mt-1")}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Amount (LKR)
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className={cn(inputCls, "mt-1 text-lg font-semibold")}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Description (optional)
          </label>
          <input
            name="description"
            type="text"
            placeholder="e.g. Monthly parking"
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
        {isPending ? "Saving…" : "💸 Log Expense"}
      </button>
    </form>
  );
}
