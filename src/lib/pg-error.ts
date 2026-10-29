// Postgres error info from a thrown driver/Drizzle error (the real error may be in `cause`).
export function pgError(error: unknown): { code?: string; constraint?: string } {
  for (let e = error as { code?: string; constraint?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (typeof e.code === "string" && /^\d{5}$/.test(e.code)) return { code: e.code, constraint: e.constraint };
  }
  return {};
}
