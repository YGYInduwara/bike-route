"use client";

import { useTransition, useState } from "react";
import { exportExpensesCSV } from "@/lib/actions/export";

export function ExportButton({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const csv = await exportExpensesCSV(vehicleId);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `biketracker-expenses-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Export failed.");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isPending}
        className="w-full rounded-xl border py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Exporting…" : "⬇ Export CSV"}
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
