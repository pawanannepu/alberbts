"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/db";
import { cartItems, carts, products } from "@/db/schema";
import { CART_COOKIE, findCartId, maxQuantity } from "@/lib/cart";
import { getSession } from "@/lib/session";

type CartResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): CartResult => ({ ok: false, error });

async function findProduct(slug: unknown) {
  if (typeof slug !== "string" || !slug || slug.length > 200) return null;
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
    with: { inventory: { columns: { quantity: true } } },
  });
  return product ? { id: product.id, stock: product.inventory?.quantity ?? 0 } : null;
}

// Returns the visitor's cart, creating it (and the guest cookie) on first use.
async function ensureCartId(): Promise<string> {
  const session = await getSession();
  if (session) {
    await db
      .insert(carts)
      .values({ userId: session.user.id })
      .onConflictDoNothing({ target: carts.userId });
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      columns: { id: true },
    });
    return cart!.id;
  }

  const existing = await findCartId();
  if (existing) return existing;

  const [cart] = await db.insert(carts).values({}).returning({ id: carts.id });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

const touch = (cartId: string) =>
  db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));

export async function addToCart(slug: string): Promise<CartResult> {
  const [product, cartId] = await Promise.all([findProduct(slug), ensureCartId()]);
  if (!product) return fail("This piece is no longer available.");

  const cap = maxQuantity(product.stock);
  if (cap === 0) return fail("This piece is currently unavailable.");

  const existing = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id)),
    columns: { quantity: true },
  });
  if ((existing?.quantity ?? 0) >= cap) {
    return fail(`Your bag already holds the most we can offer (${cap}).`);
  }

  await Promise.all([
    db
      .insert(cartItems)
      .values({ cartId, productId: product.id, quantity: 1 })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`least(${cartItems.quantity} + 1, ${cap})` },
      }),
    touch(cartId),
  ]);

  refresh();
  return { ok: true };
}

// Form action: sets a line to an exact quantity. Zero or less removes it.
export async function setCartQuantity(formData: FormData): Promise<void> {
  const quantity = Number(formData.get("quantity"));
  if (!Number.isInteger(quantity)) return;

  const [cartId, product] = await Promise.all([findCartId(), findProduct(formData.get("slug"))]);
  if (!cartId || !product) return;

  const line = and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id));
  if (quantity <= 0) {
    await Promise.all([db.delete(cartItems).where(line), touch(cartId)]);
  } else {
    const cap = maxQuantity(product.stock);
    if (cap === 0) return;
    await Promise.all([
      db.update(cartItems).set({ quantity: Math.min(quantity, cap) }).where(line),
      touch(cartId),
    ]);
  }

  refresh();
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const [cartId, product] = await Promise.all([findCartId(), findProduct(formData.get("slug"))]);
  if (!cartId || !product) return;

  await Promise.all([
    db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, product.id))),
    touch(cartId),
  ]);

  refresh();
}

// Call right after signing in or up: folds the guest cart into the account cart.
export async function mergeGuestCart(): Promise<void> {
  const session = await getSession();
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!session || !guestId) return;

  const guest = await db.query.carts.findFirst({
    where: and(eq(carts.id, guestId), isNull(carts.userId)),
    columns: { id: true },
    with: {
      items: {
        columns: { productId: true, quantity: true },
        with: { product: { with: { inventory: { columns: { quantity: true } } } } },
      },
    },
  });

  if (guest) {
    const cartId = await ensureCartId();
    for (const item of guest.items) {
      const cap = maxQuantity(item.product.inventory?.quantity ?? 0);
      if (cap === 0) continue;
      await db
        .insert(cartItems)
        .values({ cartId, productId: item.productId, quantity: Math.min(item.quantity, cap) })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId],
          set: { quantity: sql`least(${cartItems.quantity} + ${item.quantity}, ${cap})` },
        });
    }
    await touch(cartId);
    await db.delete(carts).where(eq(carts.id, guest.id));
  }

  jar.delete(CART_COOKIE);
}
