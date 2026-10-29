import { sql } from "drizzle-orm";

import { db } from "@/db";
import { releaseExpiredOrders } from "@/lib/orders";

// Housekeeping that nothing else does. Safe to run as often as you like; each step is one statement.
// No request context needed, so a cron route or a script can call it.

// Guest cart cookies last 30 days (see src/app/cart/actions.ts), so older guest carts are unreachable.
const GUEST_CART_DAYS = 30;

const count = async (query: ReturnType<typeof sql>) => {
  const result = await db.execute<{ n: number }>(query);
  return Number(result.rows[0]?.n ?? 0);
};

export type MaintenanceReport = {
  releasedOrders: number;
  guestCarts: number;
  throttles: number;
  authRateLimits: number;
  sessions: number;
  verifications: number;
};

export async function runMaintenance(): Promise<MaintenanceReport> {
  return {
    // Pending orders past their hold go back on the shelf.
    releasedOrders: await releaseExpiredOrders(),
    guestCarts: await count(sql`
      WITH gone AS (
        DELETE FROM carts WHERE user_id IS NULL AND updated_at < now() - make_interval(days => ${GUEST_CART_DAYS}::int)
        RETURNING 1)
      SELECT count(*)::int AS n FROM gone`),
    // Counter windows are at most minutes long; a day-old row is dead weight.
    throttles: await count(sql`
      WITH gone AS (DELETE FROM throttles WHERE window_start < now() - interval '1 day' RETURNING 1)
      SELECT count(*)::int AS n FROM gone`),
    // Better Auth's own limiter stores last_request as epoch milliseconds.
    authRateLimits: await count(sql`
      WITH gone AS (
        DELETE FROM rate_limit WHERE last_request < (extract(epoch FROM now() - interval '1 day') * 1000)::bigint
        RETURNING 1)
      SELECT count(*)::int AS n FROM gone`),
    sessions: await count(sql`
      WITH gone AS (DELETE FROM session WHERE expires_at < now() RETURNING 1)
      SELECT count(*)::int AS n FROM gone`),
    verifications: await count(sql`
      WITH gone AS (DELETE FROM verification WHERE expires_at < now() RETURNING 1)
      SELECT count(*)::int AS n FROM gone`),
  };
}
