import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { cancelOrder, createOrder, markOrderPaid, releaseExpiredOrders } from "@/lib/orders";

import { cartQuantity, cleanup, createProduct, createUser, expireOrder, putInCart, skipReason, stockOf } from "./fixtures";

after(async () => {
  if (!skipReason) await cleanup();
});

const statusOf = async (orderId: string) =>
  (await db.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { status: true } }))?.status;

// Creates a signed-in shopper with `quantity` of a fresh product in their bag.
async function shopper(stock: number, quantity: number) {
  const buyer = await createUser("buyer");
  const product = await createProduct(stock);
  await putInCart(buyer.id, product.id, quantity);
  return { buyer, product };
}

describe("orders", { skip: skipReason }, () => {
  test("createOrder holds the stock and snapshots the bag", async () => {
    const { buyer, product } = await shopper(5, 2);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(result.ok);

    assert.equal(await stockOf(product.id), 3, "stock is held");
    const order = await db.query.orders.findFirst({ where: eq(orders.id, result.orderId) });
    assert.equal(order?.status, "pending");
    assert.equal(order?.subtotalCents, 2 * product.priceCents);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, result.orderId));
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 2);
    assert.equal(items[0].name, product.name);
  });

  test("refuses a bag that asks for more than is in stock", async () => {
    const { buyer, product } = await shopper(1, 3);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.deepEqual(result, { ok: false, reason: "insufficient-stock", items: [product.name] });
    assert.equal(await stockOf(product.id), 1, "stock untouched");
  });

  test("refuses an empty bag", async () => {
    const buyer = await createUser("empty");
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.deepEqual(result, { ok: false, reason: "empty-cart" });
  });

  test("two shoppers racing for the last unit: exactly one wins, stock never goes negative", async () => {
    const product = await createProduct(1);
    const [a, b] = await Promise.all([createUser("a"), createUser("b")]);
    await putInCart(a.id, product.id, 1);
    await putInCart(b.id, product.id, 1);

    const results = await Promise.all([
      createOrder({ userId: a.id, email: a.email }),
      createOrder({ userId: b.id, email: b.email }),
    ]);
    assert.equal(results.filter((r) => r.ok).length, 1);
    const loser = results.find((r) => !r.ok);
    assert.equal(loser && !loser.ok && loser.reason, "insufficient-stock");
    assert.equal(await stockOf(product.id), 0);
  });

  test("starting a new checkout releases the shopper's earlier pending order", async () => {
    const { buyer, product } = await shopper(5, 2);
    const first = await createOrder({ userId: buyer.id, email: buyer.email });
    const second = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(first.ok && second.ok);

    assert.equal(await statusOf(first.orderId), "cancelled");
    assert.equal(await statusOf(second.orderId), "pending");
    assert.equal(await stockOf(product.id), 3, "only the newest hold is kept");
  });

  test("cancelOrder returns the stock exactly once", async () => {
    const { buyer, product } = await shopper(5, 2);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(result.ok);

    assert.equal(await cancelOrder(result.orderId), true);
    assert.equal(await stockOf(product.id), 5);
    assert.equal(await cancelOrder(result.orderId), false, "already cancelled");
    assert.equal(await stockOf(product.id), 5, "no double restore");
  });

  test("releaseExpiredOrders frees holds whose time has run out", async () => {
    const { buyer, product } = await shopper(5, 2);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(result.ok);
    await expireOrder(result.orderId);

    assert.ok((await releaseExpiredOrders()) >= 1);
    assert.equal(await statusOf(result.orderId), "cancelled");
    assert.equal(await stockOf(product.id), 5);
  });

  test("markOrderPaid is idempotent, keeps the stock sold and clears purchased items from the bag", async () => {
    const { buyer, product } = await shopper(5, 2);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(result.ok);
    assert.equal(await cartQuantity(buyer.id, product.id), 2);

    const details = { paymentIntentId: "pi_test", shippingName: "Test Buyer", shippingAddress: { line1: "1 Main St", country: "US" } };
    assert.equal(await markOrderPaid(result.orderId, details), "paid");
    assert.equal(await markOrderPaid(result.orderId, details), "paid", "webhook retry is harmless");

    assert.equal(await statusOf(result.orderId), "paid");
    assert.equal(await stockOf(product.id), 3);
    assert.equal(await cartQuantity(buyer.id, product.id), 0);
    assert.equal(await cancelOrder(result.orderId), false, "a paid order can't be cancelled");
    assert.equal(await statusOf(result.orderId), "paid");
  });

  test("payment landing on a released order is reported so it can be refunded", async () => {
    const { buyer } = await shopper(5, 1);
    const result = await createOrder({ userId: buyer.id, email: buyer.email });
    assert.ok(result.ok);
    await cancelOrder(result.orderId);

    assert.equal(await markOrderPaid(result.orderId), "cancelled");
    assert.equal(await markOrderPaid("00000000-0000-4000-8000-000000000000"), "not-found");
  });
});
