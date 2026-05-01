import { NextResponse } from "next/server";
import { runReminderEngine } from "@/lib/services/reminder-engine";

// Vercel Cron — runs daily at 7 AM Sri Lanka time (01:30 UTC)
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "30 1 * * *" }] }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReminderEngine();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
