"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { cancelOrder, createOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import { CHECKOUT_SESSION_MINUTES, SHIPPING_COUNTRIES, getStripe } from "@/lib/stripe";

// Holds the stock (pending order), then sends the shopper to Stripe's hosted checkout.
// Returns an error message to show; on success it redirects and never returns.
export async function startCheckout(): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/cart");
  // Each attempt creates an order and a Stripe session, so keep it modest.
  if (!(await rateLimit("checkout", 10, 60, session.user.id)).ok) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const result = await createOrder({ userId: session.user.id, email: session.user.email });
  if (!result.ok) {
    if (result.reason === "empty-cart") return { error: "Your bag is empty." };
    const names = result.items.join(", ");
    return {
      error: names
        ? `Not enough stock for: ${names}. Please adjust your bag.`
        : "Some items just sold out. Please review your bag.",
    };
  }

  let url: string;
  try {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, result.orderId));
    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      client_reference_id: result.orderId,
      metadata: { orderId: result.orderId },
      payment_intent_data: { metadata: { orderId: result.orderId } },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: { name: item.name, ...(item.imageUrl ? { images: [item.imageUrl] } : {}) },
        },
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_MINUTES * 60,
      success_url: `${siteUrl()}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/cart`,
    });
    if (!checkout.url) throw new Error("Stripe returned no checkout URL");
    await db.update(orders).set({ stripeSessionId: checkout.id }).where(eq(orders.id, result.orderId));
    url = checkout.url;
  } catch (error) {
    console.error("Could not start checkout", error);
    await cancelOrder(result.orderId); // give the held stock back
    return { error: "We couldn't start checkout. Please try again." };
  }

  redirect(url);
}
