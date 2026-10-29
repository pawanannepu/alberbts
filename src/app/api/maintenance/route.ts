import { createHash, timingSafeEqual } from "node:crypto";

import { runMaintenance } from "@/lib/maintenance";

// Called on a schedule by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
// Without CRON_SECRET the route refuses to run, so it can never be open to the public.
const digest = (value: string) => createHash("sha256").update(value).digest();

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set");
    return new Response("Maintenance not configured", { status: 500 });
  }

  const sent = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(sent), digest(`Bearer ${secret}`))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const report = await runMaintenance();
  return Response.json(report, { headers: { "Cache-Control": "no-store" } });
}
