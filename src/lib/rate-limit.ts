import { sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";

// Fixed-window rate limiting in Postgres (works across serverless instances). Sign-in/up and
// password endpoints are limited by Better Auth itself (see src/lib/auth.ts); this covers the rest.
// Needs request context (headers()), so call it from Server Actions, route handlers or components.

// Client IP as set by the hosting proxy. Only trust this behind a proxy that overwrites
// x-forwarded-for (Vercel does); otherwise a client can spoof it to dodge the limit.
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

// Counts a hit for `scope` + identity (default: client IP) and reports whether it's over the limit.
// If the caller can't be identified it allows the request rather than throttling everyone together.
export async function rateLimit(
  scope: string,
  limit: number,
  windowSeconds: number,
  identity?: string,
): Promise<RateLimitResult> {
  const who = identity ?? (await clientIp());
  if (!who) return { ok: true };
  const key = `${scope}:${who}`;

  // One atomic statement: start a fresh window if the old one expired, otherwise count up.
  const result = await db.execute<{ count: number; age: number }>(sql`
    INSERT INTO throttles (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN throttles.window_start < now() - make_interval(secs => ${windowSeconds}::int)
                   THEN 1 ELSE throttles.count + 1 END,
      window_start = CASE WHEN throttles.window_start < now() - make_interval(secs => ${windowSeconds}::int)
                          THEN now() ELSE throttles.window_start END
    RETURNING count, extract(epoch FROM now() - window_start)::int AS age`);
  const { count, age } = result.rows[0];

  // Housekeeping: now and then drop windows that ended long ago, so the table stays small.
  if (Math.random() < 0.01) {
    await db.execute(sql`DELETE FROM throttles WHERE window_start < now() - interval '1 day'`);
  }

  return count > limit ? { ok: false, retryAfterSeconds: Math.max(1, windowSeconds - age) } : { ok: true };
}
