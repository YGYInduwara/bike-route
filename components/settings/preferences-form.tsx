"use client";

import { useTransition, useState } from "react";
import { type UserSettings } from "@prisma/client";
import { updateUserSettings } from "@/lib/actions/settings";

const inputCls =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function PreferencesForm({ settings }: { settings: UserSettings }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateUserSettings(formData);
        setMessage({ type: "success", text: "Preferences saved." });
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Failed to save.",
        });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Default Fuel Type
          </label>
          <select
            name="defaultFuelType"
            defaultValue={settings.defaultFuelType}
            className={inputCls}
          >
            <option value="OCTANE_92">Octane 92</option>
            <option value="OCTANE_95">Octane 95</option>
            <option value="DIESEL">Diesel</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Low fuel alert (%)
          </label>
          <input
            name="lowFuelThresholdPct"
            type="number"
            min={5}
            max={50}
            defaultValue={settings.lowFuelThresholdPct}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Due soon (km)
            </label>
            <input
              name="dueSoonKmThreshold"
              type="number"
              min={100}
              max={2000}
              defaultValue={settings.dueSoonKmThreshold}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Due soon (days)
            </label>
            <input
              name="dueSoonDayThreshold"
              type="number"
              min={1}
              max={60}
              defaultValue={settings.dueSoonDayThreshold}
              className={inputCls}
            />
          </div>
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
        {isPending ? "Saving…" : "Save Preferences"}
      </button>
    </form>
  );
}
