import { asc, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, inventory, orders, products } from "@/db/schema";

// Uncached admin reads (the storefront's cached queries are in catalog.ts). Callers must have
// passed requireAdmin() first.

export async function listAdminProducts() {
  return db.query.products.findMany({
    with: { category: true, inventory: true, images: { limit: 1, orderBy: (i, { asc }) => asc(i.position) } },
    orderBy: asc(products.id),
  });
}

export async function getAdminProduct(id: number) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: { inventory: true, images: { orderBy: (i, { asc }) => asc(i.position) } },
  });
}

export async function listAdminCategories() {
  return db
    .select({ id: categories.id, slug: categories.slug, name: categories.name, products: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export const ORDER_FILTERS = ["paid", "pending", "cancelled", "all"] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];

export async function listAdminOrders(filter: OrderFilter, limit = 100) {
  return db.query.orders.findMany({
    where: filter === "all" ? undefined : eq(orders.status, filter),
    orderBy: desc(orders.createdAt),
    limit,
    with: { items: { columns: { quantity: true } } },
  });
}

export async function getAdminOrder(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { orderBy: (i, { asc }) => asc(i.id) } },
  });
}

export async function getDashboard(lowStockAt: number) {
  const [sales] = await db
    .select({
      orders: count(),
      revenueCents: sql<number>`coalesce(sum(${orders.subtotalCents}), 0)::int`,
    })
    .from(orders)
    .where(eq(orders.status, "paid"));
  const [productCount] = await db.select({ n: count() }).from(products);
  const lowStock = await db
    .select({ id: products.id, name: products.name, quantity: inventory.quantity })
    .from(products)
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(sql`coalesce(${inventory.quantity}, 0) <= ${lowStockAt}`)
    .orderBy(asc(inventory.quantity), asc(products.name));
  const recent = await listAdminOrders("paid", 5);
  return { sales, productCount: productCount.n, lowStock, recent };
}
