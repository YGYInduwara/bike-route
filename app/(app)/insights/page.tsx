import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/user";
import { getInsightsData } from "@/lib/services/insights";
import { KpiCards } from "@/components/insights/kpi-cards";
import { SpendChart } from "@/components/insights/spend-chart";
import { MileageChart } from "@/components/insights/mileage-chart";
import { CategoryBreakdown } from "@/components/insights/category-breakdown";
import { ExportButton } from "@/components/insights/export-button";

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0];
  if (!vehicle) redirect("/settings");

  const data = await getInsightsData(vehicle.id);

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
      </div>

      {/* KPI cards */}
      <KpiCards kpis={data.kpis} />

      {/* Monthly spend bar chart */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Monthly Spend (last 6 months)
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          <SpendChart data={data.monthlySpend} />
        </div>
      </section>

      {/* Mileage trend */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Mileage Trend
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          <MileageChart
            data={data.mileageTrend}
            baseline={vehicle.baselineKmpl}
          />
        </div>
      </section>

      {/* Spend by category */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Spend by Category
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          <CategoryBreakdown data={data.spendByCategory} />
        </div>
      </section>

      {/* Export */}
      <ExportButton vehicleId={vehicle.id} />
    </div>
  );
}
