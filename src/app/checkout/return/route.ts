import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { fulfillCheckoutSession, orderIdFromSession } from "@/lib/checkout";
import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

// Stripe sends the shopper back here after paying. We confirm the payment with Stripe directly
// (rather than trusting the URL) and mark the order paid; the webhook may do the same, which is fine.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) redirect("/cart");

  const user = await getSession();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/return?session_id=${sessionId}`)}`);
  }

  const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = orderIdFromSession(checkout);
  const order = orderId
    ? await db.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { userId: true } })
    : null;
  if (!orderId || order?.userId !== user.user.id) redirect("/account");

  await fulfillCheckoutSession(checkout);
  redirect(`/orders/${orderId}`);
}
