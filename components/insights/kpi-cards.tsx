import { formatLKR } from "@/lib/utils";
import type { InsightsData } from "@/lib/services/insights";

export function KpiCards({ kpis }: { kpis: InsightsData["kpis"] }) {
  const cards = [
    {
      label: "This month",
      value: formatLKR(kpis.totalSpendThisMonth),
      sub: "total spend",
    },
    {
      label: "All time",
      value: formatLKR(kpis.totalSpendAllTime),
      sub: "total spend",
    },
    {
      label: "Avg mileage",
      value: kpis.avgKmpl ? `${kpis.avgKmpl} km/L` : "–",
      sub: "from fill-ups",
    },
    {
      label: "Cost per km",
      value: kpis.lkrPerKm ? `Rs. ${kpis.lkrPerKm}` : "–",
      sub: "fuel only",
    },
    {
      label: "Total distance",
      value: kpis.totalKm ? `${kpis.totalKm.toLocaleString()} km` : "–",
      sub: "tracked so far",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="text-lg font-bold mt-0.5 leading-tight">{c.value}</p>
          <p className="text-xs text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
