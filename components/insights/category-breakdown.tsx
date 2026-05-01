import { formatLKR } from "@/lib/utils";
import type { InsightsData } from "@/lib/services/insights";

const COLORS: Record<string, string> = {
  Fuel: "bg-blue-500",
  Maintenance: "bg-amber-500",
  Renewal: "bg-emerald-500",
  Parking: "bg-purple-400",
  Washing: "bg-cyan-400",
  Accessories: "bg-pink-400",
  Toll: "bg-orange-400",
  Other: "bg-slate-400",
};

export function CategoryBreakdown({
  data,
}: {
  data: InsightsData["spendByCategory"];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No data yet
      </p>
    );
  }

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = total > 0 ? (d.amount / total) * 100 : 0;
        return (
          <div key={d.category}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{d.category}</span>
              <span className="text-muted-foreground">
                {formatLKR(d.amount)} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${COLORS[d.category] ?? "bg-slate-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
