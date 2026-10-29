import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { cartItems, carts, productImages } from "@/db/schema";
import { getSession } from "@/lib/session";

// Cart reads and ownership. Everything here reads cookies/headers, so call it from a component
// wrapped in <Suspense> or from a Server Action. Writes live in src/app/cart/actions.ts.

export const CART_COOKIE = "cart";
export const MAX_PER_ITEM = 10;

// Most of one product a cart can hold: what's in stock, up to MAX_PER_ITEM.
export const maxQuantity = (stock: number) => Math.max(0, Math.min(stock, MAX_PER_ITEM));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The cart that belongs to this visitor, or null if they don't have one yet.
// Signed-in users get their account cart; guests get the one named by the cookie.
export async function findCartId(): Promise<string | null> {
  const session = await getSession();
  if (session) {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
      columns: { id: true },
    });
    return cart?.id ?? null;
  }

  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  const cart = await db.query.carts.findFirst({
    where: and(eq(carts.id, id), isNull(carts.userId)),
    columns: { id: true },
  });
  return cart?.id ?? null;
}

export async function getCartCount(): Promise<number> {
  const cartId = await findCartId();
  if (!cartId) return 0;
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row.count;
}

export async function getCart() {
  const cartId = await findCartId();
  const rows = cartId
    ? await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cartId),
        orderBy: asc(cartItems.createdAt),
        with: {
          product: {
            with: {
              category: true,
              images: { orderBy: asc(productImages.position), limit: 1 },
              inventory: true,
            },
          },
        },
      })
    : [];

  const lines = rows.map(({ product, quantity }) => {
    const stock = product.inventory?.quantity ?? 0;
    const image = product.images[0];
    return {
      slug: product.slug,
      name: product.name,
      category: product.category.name,
      image: image ? { src: image.url, alt: image.alt } : null,
      unitPriceCents: product.priceCents,
      lineTotalCents: product.priceCents * quantity,
      quantity,
      stock,
      maxQuantity: maxQuantity(stock),
      // True when the line can be ordered as it stands.
      available: stock >= quantity,
    };
  });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
    canCheckout: lines.length > 0 && lines.every((line) => line.available),
  };
}

export type Cart = Awaited<ReturnType<typeof getCart>>;
export type CartLine = Cart["lines"][number];
