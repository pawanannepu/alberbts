import type Stripe from "stripe";

import { fulfillCheckoutSession, orderIdFromSession } from "@/lib/checkout";
import { cancelOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Stripe -> us. Point a webhook endpoint at /api/stripe/webhook (events: checkout.session.completed,
// checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
// checkout.session.expired) and put its signing secret in STRIPE_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Returning an error makes Stripe retry, so only let genuine failures escape.
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckoutSession(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const orderId = orderIdFromSession(event.data.object);
      if (orderId) await cancelOrder(orderId);
      break;
    }
  }

  return new Response(null, { status: 200 });
}
