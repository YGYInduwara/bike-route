"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface ReceiptData {
  date: string | null;
  litersFilled: number | null;
  pricePerLiter: number | null;
  totalCost: number | null;
  station: string | null;
}

interface ReceiptScannerProps {
  onFill: (data: ReceiptData) => void;
}

export function ReceiptScanner({ onFill }: ReceiptScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleFile(file: File) {
    setStatus("idle");
    setMessage("");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("receipt", file);
      try {
        const res = await fetch("/api/ocr/receipt", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "OCR failed");
        onFill(json.data);
        setStatus("success");
        setMessage("Receipt scanned — fields pre-filled!");
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Scan failed.");
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "w-full rounded-xl border border-dashed py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
          status === "success" && "border-green-500 text-green-600",
          status === "error" && "border-destructive text-destructive",
          status === "idle" && "text-muted-foreground hover:border-primary hover:text-primary"
        )}
      >
        {isPending ? "Scanning receipt…" : "📷 Scan Receipt"}
      </button>
      {message && (
        <p className={cn(
          "mt-1 text-xs text-center",
          status === "success" ? "text-green-600" : "text-destructive"
        )}>
          {message}
        </p>
      )}
    </div>
  );
}
