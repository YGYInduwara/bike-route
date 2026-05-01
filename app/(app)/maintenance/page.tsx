import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/user";
import { prisma } from "@/lib/db/prisma";
import { refreshMaintenanceStatuses } from "@/lib/services/maintenance-status";
import { TaskCard } from "@/components/maintenance/task-card";

export default async function MaintenancePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0];
  if (!vehicle) redirect("/settings");

  // Refresh statuses on every page load
  await refreshMaintenanceStatuses(vehicle.id);

  const tasks = await prisma.maintenanceTask.findMany({
    where: { vehicleId: vehicle.id, isActive: true },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
  });

  const overdue = tasks.filter((t) => t.status === "OVERDUE");
  const dueSoon = tasks.filter((t) => t.status === "DUE_SOON");
  const ok = tasks.filter((t) => t.status === "OK");

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Maintenance</h1>
        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
            Overdue
          </h2>
          <div className="space-y-2">
            {overdue.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                currentOdometer={vehicle.currentOdometerKm}
              />
            ))}
          </div>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
            Due Soon
          </h2>
          <div className="space-y-2">
            {dueSoon.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                currentOdometer={vehicle.currentOdometerKm}
              />
            ))}
          </div>
        </section>
      )}

      {ok.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
            Upcoming
          </h2>
          <div className="space-y-2">
            {ok.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                currentOdometer={vehicle.currentOdometerKm}
              />
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center pt-8">
          No maintenance tasks found.
        </p>
      )}
    </div>
  );
}
