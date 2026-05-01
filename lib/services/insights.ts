import { prisma } from "@/lib/db/prisma";

export interface MonthlySpend {
  month: string; // "Jan", "Feb" etc
  fuel: number;
  maintenance: number;
  renewal: number;
  other: number;
  total: number;
}

export interface MileagePoint {
  date: string;   // "DD MMM"
  kmpl: number;
}

export interface InsightsData {
  kpis: {
    totalSpendAllTime: number;
    totalSpendThisMonth: number;
    avgKmpl: number | null;
    lkrPerKm: number | null;
    totalKm: number | null;
  };
  monthlySpend: MonthlySpend[];
  mileageTrend: MileagePoint[];
  spendByCategory: { category: string; amount: number }[];
}

export async function getInsightsData(vehicleId: string): Promise<InsightsData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [allExpenses, mileageEntries, firstOdometer, lastOdometer] = await Promise.all([
    prisma.expense.findMany({
      where: { vehicleId, date: { gte: twelveMonthsAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.fuelEntry.findMany({
      where: { vehicleId, isFullTank: true, calculatedKmpl: { not: null } },
      orderBy: { date: "asc" },
      take: 20,
    }),
    prisma.odometerReading.findFirst({
      where: { vehicleId },
      orderBy: { date: "asc" },
    }),
    prisma.odometerReading.findFirst({
      where: { vehicleId },
      orderBy: { date: "desc" },
    }),
  ]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSpendAllTime = await prisma.expense.aggregate({
    where: { vehicleId },
    _sum: { amount: true },
  });

  const totalSpendThisMonth = allExpenses
    .filter((e) => e.date >= monthStart)
    .reduce((s, e) => s + e.amount, 0);

  const avgKmpl =
    mileageEntries.length > 0
      ? mileageEntries.reduce((s, e) => s + (e.calculatedKmpl ?? 0), 0) /
        mileageEntries.length
      : null;

  const totalKm =
    firstOdometer && lastOdometer && firstOdometer.id !== lastOdometer.id
      ? lastOdometer.odometerKm - firstOdometer.odometerKm
      : null;

  const totalFuelSpend = allExpenses
    .filter((e) => e.category === "FUEL")
    .reduce((s, e) => s + e.amount, 0);

  const lkrPerKm =
    totalKm && totalKm > 0 && totalFuelSpend > 0
      ? totalFuelSpend / totalKm
      : null;

  // ── Monthly spend (last 6 months) ────────────────────────────────────────
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentExpenses = allExpenses.filter((e) => e.date >= sixMonthsAgo);

  const monthMap: Record<string, MonthlySpend> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-LK", { month: "short" });
    monthMap[key] = { month: label, fuel: 0, maintenance: 0, renewal: 0, other: 0, total: 0 };
  }

  for (const e of recentExpenses) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) continue;
    const m = monthMap[key];
    if (e.category === "FUEL") m.fuel += e.amount;
    else if (e.category === "MAINTENANCE") m.maintenance += e.amount;
    else if (e.category === "RENEWAL") m.renewal += e.amount;
    else m.other += e.amount;
    m.total += e.amount;
  }
  const monthlySpend = Object.values(monthMap);

  // ── Mileage trend ─────────────────────────────────────────────────────────
  const mileageTrend: MileagePoint[] = mileageEntries
    .filter((e) => e.calculatedKmpl !== null)
    .map((e) => ({
      date: e.date.toLocaleDateString("en-LK", { day: "numeric", month: "short" }),
      kmpl: Math.round((e.calculatedKmpl ?? 0) * 10) / 10,
    }));

  // ── Spend by category ─────────────────────────────────────────────────────
  const catMap: Record<string, number> = {};
  for (const e of allExpenses) {
    catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;
  }
  const categoryLabels: Record<string, string> = {
    FUEL: "Fuel",
    MAINTENANCE: "Maintenance",
    RENEWAL: "Renewal",
    PARKING: "Parking",
    WASHING: "Washing",
    ACCESSORIES: "Accessories",
    TOLL: "Toll",
    OTHER: "Other",
  };
  const spendByCategory = Object.entries(catMap)
    .map(([category, amount]) => ({ category: categoryLabels[category] ?? category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    kpis: {
      totalSpendAllTime: totalSpendAllTime._sum.amount ?? 0,
      totalSpendThisMonth,
      avgKmpl: avgKmpl ? Math.round(avgKmpl * 10) / 10 : null,
      lkrPerKm: lkrPerKm ? Math.round(lkrPerKm * 100) / 100 : null,
      totalKm: totalKm ? Math.round(totalKm) : null,
    },
    monthlySpend,
    mileageTrend,
    spendByCategory,
  };
}
