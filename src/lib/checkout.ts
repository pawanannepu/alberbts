import type Stripe from "stripe";

import { db } from "@/db";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Turns a completed Stripe Checkout session into a paid order. Called both when the shopper
// returns from Stripe and from the webhook; whichever arrives first wins and the other is a
// harmless repeat, so it must stay idempotent.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function orderIdFromSession(session: Stripe.Checkout.Session): string | null {
  const id = session.metadata?.orderId ?? session.client_reference_id;
  return id && UUID.test(id) ? id : null;
}

export type FulfillOutcome = "paid" | "refunded" | "unpaid" | "unknown-order";

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<FulfillOutcome> {
  const orderId = orderIdFromSession(session);
  if (!orderId) return "unknown-order";
  if (session.payment_status === "unpaid") return "unpaid";

  const order = await db.query.orders.findFirst({
    where: (o, { eq }) => eq(o.id, orderId),
    columns: { subtotalCents: true },
  });
  if (!order) return "unknown-order";
  if (session.amount_total !== order.subtotalCents) {
    throw new Error(`Amount mismatch on order ${orderId}: Stripe ${session.amount_total}, order ${order.subtotalCents}`);
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const shipping = session.collected_information?.shipping_details;

  const result = await markOrderPaid(orderId, {
    paymentIntentId,
    shippingName: shipping?.name ?? null,
    shippingAddress: shipping?.address ?? null,
  });
  if (result === "paid") return "paid";
  if (result === "not-found") return "unknown-order";

  // The hold was released before payment landed, so the stock may be gone: give the money back.
  if (paymentIntentId) {
    await getStripe().refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `refund-${session.id}` });
  }
  return "refunded";
}
