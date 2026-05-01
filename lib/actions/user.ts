"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { createDefaultVehicle } from "./vehicle";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      email,
      name,
      settings: { create: {} },
    },
    update: { email, name },
    include: {
      settings: true,
      vehicles: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  // First-time sign-in: auto-create Honda Dio defaults
  if (user.vehicles.length === 0) {
    await createDefaultVehicle(user.id);
    return prisma.user.findUnique({
      where: { id: user.id },
      include: {
        settings: true,
        vehicles: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  return user;
}
