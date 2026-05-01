import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWorker } from "tesseract.js";

function parseReceiptText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const full = text.replace(/\s+/g, " ");

  // ── Date ──────────────────────────────────────────────────────────────────
  // Matches: 2025-10-31 | 31/10/2025 | 31-10-2025 | 31.10.2025
  let date: string | null = null;
  const datePatterns = [
    /(\d{4}[-\/\.]\d{2}[-\/\.]\d{2})/,
    /(\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/,
  ];
  for (const pat of datePatterns) {
    const m = full.match(pat);
    if (m) {
      const raw = m[1];
      // Normalise to YYYY-MM-DD
      if (raw.match(/^\d{4}/)) {
        date = raw.replace(/[\/\.]/g, "-");
      } else {
        const parts = raw.split(/[-\/\.]/);
        date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      break;
    }
  }

  // ── Liters ────────────────────────────────────────────────────────────────
  // Matches: 3.50 L | 3.50L | Qty: 3.50 | Volume 3.50 | Litres 3.50
  let litersFilled: number | null = null;
  const literPatterns = [
    /(?:qty|quantity|vol(?:ume)?|litres?|liters?)[:\s]*(\d+\.\d{1,3})/i,
    /(\d+\.\d{2,3})\s*[Ll]/,
  ];
  for (const pat of literPatterns) {
    const m = full.match(pat);
    if (m) { litersFilled = parseFloat(m[1]); break; }
  }

  // ── Price per liter ───────────────────────────────────────────────────────
  // Matches: Rs.294.00 | 294.00/L | Unit Price 294 | Rate 294.00
  let pricePerLiter: number | null = null;
  const pricePatterns = [
    /(?:unit\s*price|rate|price\/l|per\s*l(?:itre)?)[:\s]*(?:rs\.?\s*)?(\d{2,4}(?:\.\d{1,2})?)/i,
    /(\d{2,4}(?:\.\d{1,2})?)[\s]*[\/\\][\s]*[Ll]/,
    /(?:rs\.?\s*)(\d{2,4}\.\d{2})(?=\s*\/|\s*per)/i,
  ];
  for (const pat of pricePatterns) {
    const m = full.match(pat);
    if (m) {
      const v = parseFloat(m[1]);
      // Sanity check: LKR fuel price is between 100–500
      if (v >= 100 && v <= 500) { pricePerLiter = v; break; }
    }
  }

  // ── Total cost ────────────────────────────────────────────────────────────
  // Matches: Total Rs.1029.00 | Amount 1029.00 | TOTAL: 1,029.00
  let totalCost: number | null = null;
  const totalPatterns = [
    /(?:total|amount|amt)[:\s]*(?:rs\.?\s*)?([0-9,]+\.\d{2})/i,
    /(?:rs\.?\s*)([0-9,]{4,}\.\d{2})/i,
  ];
  for (const pat of totalPatterns) {
    const m = full.match(pat);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ""));
      if (v > 50) { totalCost = v; break; }
    }
  }

  // ── Station name ──────────────────────────────────────────────────────────
  // First non-empty line that looks like a station (contains LIOC/CPC/IOC/Ceypetco or is the first line)
  let station: string | null = null;
  const stationKeywords = /lioc|cpc|ioc|ceypetco|lanka|petrol|fuel|station|shed/i;
  for (const line of lines.slice(0, 6)) {
    if (stationKeywords.test(line) && line.length > 3 && line.length < 60) {
      station = line; break;
    }
  }
  // Fallback: first line if it looks like a name
  if (!station && lines[0]?.length > 3 && lines[0].length < 60) {
    station = lines[0];
  }

  return { date, litersFilled, pricePerLiter, totalCost, station };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("receipt") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, or WebP." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    const parsed = parseReceiptText(data.text);
    return NextResponse.json({ ok: true, data: parsed, rawText: data.text });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  } finally {
    await worker.terminate();
  }
}
