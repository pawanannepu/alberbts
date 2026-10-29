import { relations, sql } from "drizzle-orm";
import { check, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products } from "./catalog";

// A cart belongs to a signed-in user (one per user) or to a guest, found via the `cart` cookie.
export const carts = pgTable("carts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cartItems = pgTable(
  "cart_items",
  {
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.cartId, t.productId] }),
    check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
  ],
);

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));
