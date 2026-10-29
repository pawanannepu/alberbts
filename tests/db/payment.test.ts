import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { fulfillCheckoutSession } from "@/lib/checkout";
import { cancelOrder, createOrder } from "@/lib/orders";

import { cartQuantity, cleanup, createProduct, createUser, putInCart, skipReason, stockOf } from "./fixtures";

// Exercises what the Stripe webhook and the /checkout/return page both call, using Stripe-shaped
// session objects instead of a live Stripe account. (EMAIL_DRY_RUN=1 keeps the confirmation email local.)

after(async () => {
  if (!skipReason) await cleanup();
});

const row = async (orderId: string) => db.query.orders.findFirst({ where: eq(orders.id, orderId) });

async function pendingOrder(stock: number, quantity: number) {
  const buyer = await createUser("payer");
  const product = await createProduct(stock);
  await putInCart(buyer.id, product.id, quantity);
  const result = await createOrder({ userId: buyer.id, email: buyer.email });
  assert.ok(result.ok);
  const order = (await row(result.orderId))!;
  return { buyer, product, order };
}

const session = (orderId: string, amountTotal: number, extra: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: `cs_test_${orderId.slice(0, 8)}`,
    metadata: { orderId },
    client_reference_id: orderId,
    payment_status: "paid",
    amount_total: amountTotal,
    payment_intent: `pi_test_${orderId.slice(0, 8)}`,
    collected_information: {
      shipping_details: { name: "Pay Tester", address: { line1: "354 Oyster Point Blvd", city: "South San Francisco", state: "CA", postal_code: "94080", country: "US" } },
    },
    ...extra,
  }) as unknown as Stripe.Checkout.Session;

describe("fulfilling a Stripe checkout session", { skip: skipReason }, () => {
  test("marks the order paid, stores shipping, empties the bag and emails exactly once", async () => {
    const { buyer, product, order } = await pendingOrder(5, 2);
    const paid = session(order.id, order.subtotalCents);

    assert.equal(await fulfillCheckoutSession(paid), "paid");
    const after1 = (await row(order.id))!;
    assert.equal(after1.status, "paid");
    assert.equal(after1.stripePaymentIntentId, paid.payment_intent);
    assert.equal(after1.shippingName, "Pay Tester");
    assert.equal(after1.shippingAddress?.postal_code, "94080");
    assert.ok(after1.confirmationSentAt, "confirmation email was claimed and sent");
    assert.equal(await stockOf(product.id), 3);
    assert.equal(await cartQuantity(buyer.id, product.id), 0);

    // Return page and webhook both fire: the repeat must change nothing.
    const sentAt = after1.confirmationSentAt!.getTime();
    assert.equal(await fulfillCheckoutSession(paid), "paid");
    const after2 = (await row(order.id))!;
    assert.equal(after2.confirmationSentAt!.getTime(), sentAt, "no second email");
    assert.equal(await stockOf(product.id), 3, "stock not touched again");
  });

  test("refuses a payment whose amount doesn't match the order", async () => {
    const { order } = await pendingOrder(5, 1);
    await assert.rejects(fulfillCheckoutSession(session(order.id, order.subtotalCents - 1)), /Amount mismatch/);
    assert.equal((await row(order.id))!.status, "pending", "order stays unpaid");
  });

  test("ignores unpaid sessions and ids that aren't orders", async () => {
    const { order } = await pendingOrder(5, 1);
    assert.equal(await fulfillCheckoutSession(session(order.id, order.subtotalCents, { payment_status: "unpaid" })), "unpaid");
    assert.equal((await row(order.id))!.status, "pending");
    assert.equal(await fulfillCheckoutSession(session("00000000-0000-4000-8000-000000000000", 100)), "unknown-order");
    assert.equal(await fulfillCheckoutSession(session("not-a-uuid", 100)), "unknown-order");
  });

  test("a payment for an already-released hold is flagged for refund and never marks the order paid", async () => {
    const { product, order } = await pendingOrder(5, 2);
    await cancelOrder(order.id);

    // No payment_intent here, so the Stripe refund call is skipped; the outcome is what matters.
    const outcome = await fulfillCheckoutSession(session(order.id, order.subtotalCents, { payment_intent: null }));
    assert.equal(outcome, "refunded");
    assert.equal((await row(order.id))!.status, "cancelled");
    assert.equal(await stockOf(product.id), 5, "released stock isn't taken twice");
  });
});
