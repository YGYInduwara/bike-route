"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlySpend } from "@/lib/services/insights";

const COLORS = {
  fuel: "#2563eb",
  maintenance: "#f59e0b",
  renewal: "#10b981",
  other: "#94a3b8",
};

function fmt(v: number) {
  if (v >= 1000) return `Rs.${(v / 1000).toFixed(1)}k`;
  return `Rs.${v.toFixed(0)}`;
}

export function SpendChart({ data }: { data: MonthlySpend[] }) {
  if (data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No expense data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number) => `Rs. ${v.toLocaleString()}`}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="fuel" name="Fuel" stackId="a" fill={COLORS.fuel} radius={[0, 0, 0, 0]} />
        <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={COLORS.maintenance} />
        <Bar dataKey="renewal" name="Renewal" stackId="a" fill={COLORS.renewal} />
        <Bar dataKey="other" name="Other" stackId="a" fill={COLORS.other} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
