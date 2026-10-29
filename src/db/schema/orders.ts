import { relations, sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products } from "./catalog";

// Mirrors Stripe's address object.
export type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

// pending: stock is held for the customer until `expiresAt`; paid: sold; cancelled: stock released.
export const orderStatus = pgEnum("order_status", ["pending", "paid", "cancelled"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Human-friendly reference shown to customers.
    number: integer().notNull().unique().generatedAlwaysAsIdentity({ startWith: 1001 }),
    // Kept (set null) if the account is deleted, so sales history survives.
    userId: text().references(() => user.id, { onDelete: "set null" }),
    email: text().notNull(),
    status: orderStatus().notNull().default("pending"),
    subtotalCents: integer().notNull(),
    stripeSessionId: text().unique(),
    stripePaymentIntentId: text(),
    shippingName: text(),
    shippingAddress: jsonb().$type<ShippingAddress>(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    paidAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    index("orders_status_expires_at_idx").on(t.status, t.expiresAt),
    check("orders_subtotal_non_negative", sql`${t.subtotalCents} >= 0`),
  ],
);

// Name, price and image are copied at purchase time so later catalog edits don't rewrite history.
export const orderItems = pgTable(
  "order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer().references(() => products.id, { onDelete: "set null" }),
    name: text().notNull(),
    imageUrl: text(),
    unitPriceCents: integer().notNull(),
    quantity: integer().notNull(),
  },
  (t) => [
    unique("order_items_order_product_unique").on(t.orderId, t.productId),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
    check("order_items_price_non_negative", sql`${t.unitPriceCents} >= 0`),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
