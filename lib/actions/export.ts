"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function exportExpensesCSV(vehicleId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId, userId: user.id },
  });
  if (!vehicle) throw new Error("Vehicle not found");

  const expenses = await prisma.expense.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });

  const rows = [
    ["Date", "Category", "Amount (LKR)", "Description"].join(","),
    ...expenses.map((e) =>
      [
        e.date.toISOString().split("T")[0],
        e.category,
        e.amount.toFixed(2),
        `"${(e.description ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ];

  return rows.join("\n");
}
