import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { syncUser } from "@/lib/actions/user";
import { VehicleForm } from "@/components/settings/vehicle-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { PushToggle } from "@/components/pwa/push-toggle";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await syncUser();
  if (!user) redirect("/sign-in");

  const vehicle = user.vehicles[0] ?? null;
  const settings = user.settings;

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="pt-2">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* My Vehicle */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          My Vehicle
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          {vehicle ? (
            <VehicleForm vehicle={vehicle} />
          ) : (
            <p className="text-sm text-muted-foreground">No vehicle found.</p>
          )}
        </div>
      </section>

      {/* Preferences */}
      {settings && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Preferences
          </h2>
          <div className="rounded-2xl border bg-card p-4">
            <PreferencesForm settings={settings} />
          </div>
        </section>
      )}

      {/* Notifications */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Notifications
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          <PushToggle />
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Account
        </h2>
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <SignOutButton>
            <button className="w-full rounded-xl border border-destructive/30 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </section>
    </div>
  );
}
