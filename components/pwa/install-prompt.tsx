"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
    else setDismissed(true);
  }

  return (
    <div className="mx-4 mb-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">Install BikeTracker</p>
        <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground border"
        >
          Later
        </button>
        <button
          onClick={install}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Install
        </button>
      </div>
    </div>
  );
}
