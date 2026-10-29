import { eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { orders, type ShippingAddress } from "@/db/schema";

// Order lifecycle: pending (stock held) -> paid, or pending -> cancelled (stock released).
// Neon's HTTP driver has no interactive transactions, so every multi-step change is either a
// single SQL statement or a db.batch(), which Postgres runs as one transaction. Stock can't go
// negative because inventory has a CHECK (quantity >= 0): a short line aborts the whole batch.
// No request context needed, so webhooks and scripts can call these directly.

// Must outlast the Stripe Checkout session (src/lib/stripe.ts), so a payment never lands on a released order.
export const ORDER_HOLD_MINUTES = 35;

export type CreateOrderResult =
  | { ok: true; orderId: string; number: number }
  | { ok: false; reason: "empty-cart" }
  | { ok: false; reason: "insufficient-stock"; items: string[] };

// Turns the user's cart into a pending order and holds the stock. Any other pending order of
// theirs, and any expired hold, is released first (same transaction) so stock isn't held twice.
export async function createOrder(input: { userId: string; email: string }): Promise<CreateOrderResult> {
  const { userId, email } = input;

  // Friendly pre-check; the CHECK constraint below is what actually guards against races.
  const short = await db.execute<{ name: string; quantity: number; stock: number }>(sql`
    SELECT p.name, ci.quantity, coalesce(i.quantity, 0) AS stock
    FROM cart_items ci
    JOIN carts c ON c.id = ci.cart_id
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE c.user_id = ${userId}::text`);
  if (short.rows.length === 0) return { ok: false, reason: "empty-cart" };
  const lacking = short.rows.filter((row) => row.stock < row.quantity);
  if (lacking.length > 0) {
    return { ok: false, reason: "insufficient-stock", items: lacking.map((row) => row.name) };
  }

  const orderId = crypto.randomUUID();
  try {
    await db.batch([
      releaseSql(sql`o.user_id = ${userId}::text OR o.expires_at < now()`),
      db.execute(sql`
        INSERT INTO orders (id, user_id, email, subtotal_cents, expires_at)
        SELECT ${orderId}::uuid, ${userId}::text, ${email}::text,
               sum(p.price_cents * ci.quantity)::int,
               now() + make_interval(mins => ${ORDER_HOLD_MINUTES}::int)
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        JOIN products p ON p.id = ci.product_id
        WHERE c.user_id = ${userId}::text
        HAVING count(*) > 0`),
      db.execute(sql`
        INSERT INTO order_items (order_id, product_id, name, image_url, unit_price_cents, quantity)
        SELECT ${orderId}::uuid, p.id, p.name,
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1),
               p.price_cents, ci.quantity
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        JOIN products p ON p.id = ci.product_id
        WHERE c.user_id = ${userId}::text`),
      db.execute(sql`
        UPDATE inventory i
        SET quantity = i.quantity - ci.quantity, updated_at = now()
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        WHERE c.user_id = ${userId}::text AND i.product_id = ci.product_id`),
    ]);
  } catch (error) {
    if (isStockError(error)) return { ok: false, reason: "insufficient-stock", items: [] };
    throw error;
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { number: true } });
  if (!order) return { ok: false, reason: "empty-cart" };
  return { ok: true, orderId, number: order.number };
}

// Cancels a pending order and puts its stock back. Returns false if it wasn't pending.
export async function cancelOrder(orderId: string): Promise<boolean> {
  const result = await releaseSql(sql`o.id = ${orderId}::uuid`);
  return result.rows[0]?.cancelled === 1;
}

// Cancels every pending order whose hold has run out. Safe to run on a schedule.
export async function releaseExpiredOrders(): Promise<number> {
  const result = await releaseSql(sql`o.expires_at < now()`);
  return Number(result.rows[0]?.cancelled ?? 0);
}

// Marks a pending order paid and removes the purchased items from the customer's cart.
// A "cancelled" result means the hold expired and the stock was released before payment landed:
// the caller must refund, or re-run the purchase.
export type PaymentDetails = {
  paymentIntentId: string | null;
  shippingName: string | null;
  shippingAddress: ShippingAddress | null;
};

export async function markOrderPaid(
  orderId: string,
  details: PaymentDetails = { paymentIntentId: null, shippingName: null, shippingAddress: null },
): Promise<"paid" | "cancelled" | "not-found"> {
  await db.execute(sql`
    WITH paid AS (
      UPDATE orders o SET status = 'paid', paid_at = now(), updated_at = now(),
        stripe_payment_intent_id = ${details.paymentIntentId}::text,
        shipping_name = ${details.shippingName}::text,
        shipping_address = ${details.shippingAddress ? JSON.stringify(details.shippingAddress) : null}::jsonb
      WHERE o.id = ${orderId}::uuid AND o.status = 'pending'
      RETURNING o.id, o.user_id
    )
    DELETE FROM cart_items ci
    USING paid, carts c, order_items oi
    WHERE c.user_id = paid.user_id AND ci.cart_id = c.id
      AND oi.order_id = paid.id AND ci.product_id = oi.product_id`);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { status: true },
  });
  if (!order) return "not-found";
  // "paid" covers both just-paid and paid earlier, so webhook retries are harmless.
  return order.status === "paid" ? "paid" : "cancelled";
}

// One statement: cancel the matching pending orders and give their stock back. `o` is the orders table.
function releaseSql(condition: SQL) {
  return db.execute<{ cancelled: number }>(sql`
    WITH cancelled AS (
      UPDATE orders o SET status = 'cancelled', updated_at = now()
      WHERE o.status = 'pending' AND (${condition})
      RETURNING o.id
    ),
    restored AS (
      UPDATE inventory i SET quantity = i.quantity + oi.quantity, updated_at = now()
      FROM order_items oi
      JOIN cancelled c ON c.id = oi.order_id
      WHERE i.product_id = oi.product_id
      RETURNING i.product_id
    )
    SELECT (SELECT count(*) FROM cancelled)::int AS cancelled`);
}

function isStockError(error: unknown): boolean {
  for (let e = error as { cause?: unknown; message?: string; constraint?: string } | undefined; e; e = e.cause as typeof e) {
    if (e.constraint === "inventory_quantity_non_negative") return true;
    if (e.message?.includes("inventory_quantity_non_negative")) return true;
  }
  return false;
}
