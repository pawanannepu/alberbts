import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Fixed-window request counters for src/lib/rate-limit.ts, keyed like "search:203.0.113.7".
export const throttles = pgTable("throttles", {
  key: text().primaryKey(),
  count: integer().notNull(),
  windowStart: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
