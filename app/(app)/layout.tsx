import { BottomNav } from "@/components/layout/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main content — pb-16 leaves room for bottom nav (h-16) */}
      <main className="flex-1 overflow-y-auto pb-16">
        <InstallPrompt />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
