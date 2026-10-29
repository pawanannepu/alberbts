import { randomUUID } from "node:crypto";

import { eq, like, sql } from "drizzle-orm";

import { db } from "@/db";
import { cartItems, carts, categories, inventory, orders, products, throttles, user } from "@/db/schema";

// Database tests run against whatever DATABASE_URL points at, so they are opt-in (RUN_DB_TESTS=1)
// and every row they create carries a unique tag that `cleanup()` removes again.
export const dbTestsEnabled = process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
export const skipReason = dbTestsEnabled ? false : "set RUN_DB_TESTS=1 and DATABASE_URL to run database tests";

export const tag = `zz-test-${randomUUID().slice(0, 8)}`;

let categoryId: number | undefined;
const guestCartIds: string[] = [];

export async function createUser(name = "u") {
  const id = `${tag}-${name}-${randomUUID().slice(0, 6)}`;
  const email = `${id}@example.test`;
  await db.insert(user).values({ id, name: `Test ${name}`, email });
  return { id, email };
}

export async function createProduct(stock: number, priceCents = 10000) {
  categoryId ??= (await db.insert(categories).values({ slug: tag, name: tag }).returning({ id: categories.id }))[0].id;
  const slug = `${tag}-${randomUUID().slice(0, 6)}`;
  const [row] = await db
    .insert(products)
    .values({ slug, name: `Test product ${slug}`, description: "test", priceCents, categoryId })
    .returning({ id: products.id, name: products.name });
  await db.insert(inventory).values({ productId: row.id, quantity: stock });
  return { id: row.id, name: row.name, priceCents };
}

export async function putInCart(userId: string, productId: number, quantity: number) {
  await db.insert(carts).values({ userId }).onConflictDoNothing({ target: carts.userId });
  const cart = await db.query.carts.findFirst({ where: eq(carts.userId, userId), columns: { id: true } });
  await db.insert(cartItems).values({ cartId: cart!.id, productId, quantity });
  return cart!.id;
}

export async function createGuestCart(updatedDaysAgo: number) {
  const [cart] = await db
    .insert(carts)
    .values({ updatedAt: sql`now() - make_interval(days => ${updatedDaysAgo}::int)` as unknown as Date })
    .returning({ id: carts.id });
  guestCartIds.push(cart.id);
  return cart.id;
}

export async function stockOf(productId: number) {
  const row = await db.query.inventory.findFirst({ where: eq(inventory.productId, productId) });
  return row!.quantity;
}

export async function cartQuantity(userId: string, productId: number) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
    with: { items: true },
  });
  return cart?.items.find((item) => item.productId === productId)?.quantity ?? 0;
}

export async function expireOrder(orderId: string) {
  await db.update(orders).set({ expiresAt: sql`now() - interval '1 minute'` as unknown as Date }).where(eq(orders.id, orderId));
}

export async function cleanup() {
  await db.delete(orders).where(like(orders.email, `${tag}%`)); // order_items cascade
  for (const id of guestCartIds) await db.delete(carts).where(eq(carts.id, id));
  await db.delete(throttles).where(like(throttles.key, `%${tag}%`));
  await db.delete(products).where(like(products.slug, `${tag}%`)); // images, inventory, cart items cascade
  await db.delete(categories).where(eq(categories.slug, tag));
  await db.delete(user).where(like(user.id, `${tag}%`)); // carts cascade
}
