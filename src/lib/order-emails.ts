import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { orderConfirmationMessage } from "@/lib/email-templates";
import { siteUrl } from "@/lib/site";

// Sends the confirmation for a paid order at most once. The send is claimed in the database first,
// so the return page and the webhook (which can both fire) never double-send. A failed send releases
// the claim so the next attempt can retry. Never throws: a mail problem must not undo a payment.
export async function sendOrderConfirmation(orderId: string): Promise<"sent" | "skipped" | "failed"> {
  const [claimed] = await db
    .update(orders)
    .set({ confirmationSentAt: sql`now()` })
    .where(and(eq(orders.id, orderId), eq(orders.status, "paid"), isNull(orders.confirmationSentAt)))
    .returning({ id: orders.id });
  if (!claimed) return "skipped";

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: { orderBy: (i, { asc }) => asc(i.id) } },
    });
    if (!order) throw new Error("order vanished");

    const address = order.shippingAddress;
    await sendEmail({
      to: order.email,
      ...orderConfirmationMessage({
        number: order.number,
        orderUrl: `${siteUrl()}/orders/${order.id}`,
        subtotalCents: order.subtotalCents,
        items: order.items,
        shippingName: order.shippingName,
        shippingAddress: address
          ? [
              [address.line1, address.line2].filter(Boolean).join(", "),
              [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
              address.country ?? "",
            ].filter(Boolean)
          : [],
      }),
    });
    return "sent";
  } catch (error) {
    console.error(`Order confirmation email failed for ${orderId}`, error);
    await db.update(orders).set({ confirmationSentAt: null }).where(eq(orders.id, orderId));
    return "failed";
  }
}
