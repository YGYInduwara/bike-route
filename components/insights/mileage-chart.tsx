"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MileagePoint } from "@/lib/services/insights";

export function MileageChart({
  data,
  baseline,
}: {
  data: MileagePoint[];
  baseline: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Log 2+ full-tank fill-ups to see mileage trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${v}`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v: number) => [`${v} km/L`, "Mileage"]} />
        <ReferenceLine
          y={baseline}
          stroke="#94a3b8"
          strokeDasharray="4 4"
          label={{ value: `Baseline ${baseline}`, fontSize: 10, fill: "#94a3b8" }}
        />
        <Line
          type="monotone"
          dataKey="kmpl"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 4, fill: "#2563eb" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
