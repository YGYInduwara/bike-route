"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { renewReminder, updateRenewalDetails } from "@/lib/actions/documents";
import type { RenewalReminder } from "@prisma/client";

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

function expiryStatus(expiryDate: Date) {
  const days = Math.round((expiryDate.getTime() - Date.now()) / 86400000);
  if (days < 0)
    return { label: `Expired ${Math.abs(days)}d ago`, color: "text-red-500", badge: "bg-red-100 text-red-600" };
  if (days === 0)
    return { label: "Expires today", color: "text-red-500", badge: "bg-red-100 text-red-600" };
  if (days <= 7)
    return { label: `${days}d left`, color: "text-red-500", badge: "bg-red-100 text-red-600" };
  if (days <= 30)
    return { label: `${days}d left`, color: "text-amber-500", badge: "bg-amber-100 text-amber-600" };
  return { label: `${days}d left`, color: "text-green-600", badge: "bg-green-100 text-green-600" };
}

function typeIcon(type: string) {
  if (type === "INSURANCE") return "🛡️";
  if (type === "REVENUE_LICENSE") return "📋";
  if (type === "EMISSION_TEST") return "🌿";
  return "📄";
}

export function RenewalCard({ reminder }: { reminder: RenewalReminder }) {
  const [mode, setMode] = useState<"view" | "renew" | "edit">("view");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const status = expiryStatus(new Date(reminder.currentExpiryDate));
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split("T")[0];
  const expiryStr = new Date(reminder.currentExpiryDate).toISOString().split("T")[0];

  function handleRenew(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await renewReminder(reminder.id, formData);
        setMode("view");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed.");
      }
    });
  }

  function handleEdit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateRenewalDetails(reminder.id, formData);
        setMode("view");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed.");
      }
    });
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-4", mode !== "view" && "border-primary/30")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcon(reminder.type)}</span>
          <div>
            <p className="text-sm font-medium">{reminder.label}</p>
            {reminder.provider && (
              <p className="text-xs text-muted-foreground">{reminder.provider}</p>
            )}
          </div>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", status.badge)}>
          {status.label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Expires:{" "}
        {new Date(reminder.currentExpiryDate).toLocaleDateString("en-LK", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {reminder.policyNo && ` · #${reminder.policyNo}`}
      </p>

      {/* Action buttons */}
      {mode === "view" && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setMode("renew")}
            className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
          >
            Renew
          </button>
          <button
            onClick={() => setMode("edit")}
            className="flex-1 rounded-xl border py-2 text-xs font-semibold text-foreground"
          >
            Edit Details
          </button>
        </div>
      )}

      {/* Renew form */}
      {mode === "renew" && (
        <form action={handleRenew} className="space-y-3 pt-3 border-t mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Renewed on</label>
              <input name="renewedDate" type="date" defaultValue={today} className={cn(inputCls, "mt-1")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">New expiry</label>
              <input name="expiryDate" type="date" defaultValue={nextYearStr} className={cn(inputCls, "mt-1")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Cost (LKR)</label>
            <input name="cost" type="text" inputMode="decimal" placeholder="0.00" className={cn(inputCls, "mt-1")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input name="notes" type="text" placeholder="e.g. Renewed via agent" className={cn(inputCls, "mt-1")} />
          </div>
          {message && <p className="text-xs text-destructive">{message}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("view")} className="flex-1 rounded-xl border py-2.5 text-xs font-semibold">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {isPending ? "Saving…" : "Save Renewal"}
            </button>
          </div>
        </form>
      )}

      {/* Edit details form */}
      {mode === "edit" && (
        <form action={handleEdit} className="space-y-3 pt-3 border-t mt-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Label</label>
            <input name="label" type="text" defaultValue={reminder.label} className={cn(inputCls, "mt-1")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Provider</label>
              <input name="provider" type="text" defaultValue={reminder.provider ?? ""} placeholder="e.g. Ceylinco" className={cn(inputCls, "mt-1")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Policy No.</label>
              <input name="policyNo" type="text" defaultValue={reminder.policyNo ?? ""} className={cn(inputCls, "mt-1")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Current expiry</label>
            <input name="currentExpiryDate" type="date" defaultValue={expiryStr} className={cn(inputCls, "mt-1")} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input name="notes" type="text" defaultValue={reminder.notes ?? ""} className={cn(inputCls, "mt-1")} />
          </div>
          {message && <p className="text-xs text-destructive">{message}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("view")} className="flex-1 rounded-xl border py-2.5 text-xs font-semibold">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
