import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/user";
import { prisma } from "@/lib/db/prisma";
import { RenewalCard } from "@/components/documents/renewal-card";

export default async function DocumentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0];
  if (!vehicle) redirect("/settings");

  const reminders = await prisma.renewalReminder.findMany({
    where: { vehicleId: vehicle.id, isActive: true },
    orderBy: { currentExpiryDate: "asc" },
  });

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
      </div>

      {reminders.length > 0 ? (
        <div className="space-y-3">
          {reminders.map((r) => (
            <RenewalCard key={r.id} reminder={r} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center pt-8">
          No documents found.
        </p>
      )}

      <div className="rounded-2xl border border-dashed bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Document file attachments coming in Phase 4
        </p>
      </div>
    </div>
  );
}
