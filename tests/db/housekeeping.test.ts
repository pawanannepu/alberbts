import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { carts, throttles } from "@/db/schema";
import { runMaintenance } from "@/lib/maintenance";
import { rateLimit } from "@/lib/rate-limit";

import { cleanup, createGuestCart, createUser, skipReason, tag } from "./fixtures";

after(async () => {
  if (!skipReason) await cleanup();
});

describe("rateLimit", { skip: skipReason }, () => {
  test("allows up to the limit, then blocks with a retry hint", async () => {
    const who = `${tag}-limited`;
    for (let i = 1; i <= 3; i++) assert.deepEqual(await rateLimit(tag, 3, 60, who), { ok: true }, `hit ${i}`);

    const blocked = await rateLimit(tag, 3, 60, who);
    assert.ok(!blocked.ok);
    assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 60);
  });

  test("counts each identity and scope separately", async () => {
    assert.deepEqual(await rateLimit(tag, 1, 60, `${tag}-x`), { ok: true });
    assert.deepEqual(await rateLimit(tag, 1, 60, `${tag}-y`), { ok: true });
    assert.deepEqual(await rateLimit(`${tag}-other`, 1, 60, `${tag}-x`), { ok: true });
    assert.ok(!(await rateLimit(tag, 1, 60, `${tag}-x`)).ok);
  });

  test("starts a fresh window once the old one has expired", async () => {
    const who = `${tag}-window`;
    assert.deepEqual(await rateLimit(tag, 1, 60, who), { ok: true });
    assert.ok(!(await rateLimit(tag, 1, 60, who)).ok);

    await db.update(throttles).set({ windowStart: sql`now() - interval '2 minutes'` as unknown as Date }).where(eq(throttles.key, `${tag}:${who}`));
    assert.deepEqual(await rateLimit(tag, 1, 60, who), { ok: true });
  });
});

describe("runMaintenance", { skip: skipReason }, () => {
  test("purges stale guest carts and old counters but keeps live ones", async () => {
    const stale = await createGuestCart(45);
    const fresh = await createGuestCart(2);
    const owner = await createUser("owner");
    const [accountCart] = await db
      .insert(carts)
      .values({ userId: owner.id, updatedAt: sql`now() - interval '90 days'` as unknown as Date })
      .returning({ id: carts.id });

    const oldKey = `${tag}:old`;
    const newKey = `${tag}:new`;
    await db.insert(throttles).values([
      { key: oldKey, count: 1, windowStart: sql`now() - interval '3 days'` as unknown as Date },
      { key: newKey, count: 1 },
    ]);

    const report = await runMaintenance();
    assert.ok(report.guestCarts >= 1);
    assert.ok(report.throttles >= 1);

    const surviving = await db.select({ id: carts.id }).from(carts).where(inArray(carts.id, [stale, fresh, accountCart.id]));
    const ids = new Set(surviving.map((row) => row.id));
    assert.ok(!ids.has(stale), "stale guest cart is gone");
    assert.ok(ids.has(fresh), "recent guest cart stays");
    assert.ok(ids.has(accountCart.id), "a signed-in user's cart is never purged for age");

    const keys = new Set((await db.select({ key: throttles.key }).from(throttles).where(inArray(throttles.key, [oldKey, newKey]))).map((row) => row.key));
    assert.ok(!keys.has(oldKey) && keys.has(newKey));
  });
});
