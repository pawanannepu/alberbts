import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import type Stripe from "stripe";

// These modules import the database client, which only needs a URL to exist (it connects lazily).
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";

let orderIdFromSession: typeof import("@/lib/checkout").orderIdFromSession;
let maxQuantity: typeof import("@/lib/cart").maxQuantity;
let MAX_PER_ITEM: number;
let parseSort: typeof import("@/lib/catalog").parseSort;

before(async () => {
  ({ orderIdFromSession } = await import("@/lib/checkout"));
  ({ maxQuantity, MAX_PER_ITEM } = await import("@/lib/cart"));
  ({ parseSort } = await import("@/lib/catalog"));
});

const ORDER_ID = "0b8e0c2e-6f55-4f0e-9a41-3c1f7d3a9b11";
const session = (fields: Partial<Stripe.Checkout.Session>) => fields as Stripe.Checkout.Session;

describe("orderIdFromSession", () => {
  test("reads the order id from metadata or client_reference_id", () => {
    assert.equal(orderIdFromSession(session({ metadata: { orderId: ORDER_ID } })), ORDER_ID);
    assert.equal(orderIdFromSession(session({ client_reference_id: ORDER_ID })), ORDER_ID);
  });

  test("rejects anything that isn't a UUID", () => {
    assert.equal(orderIdFromSession(session({ metadata: { orderId: "1; DROP TABLE orders" } })), null);
    assert.equal(orderIdFromSession(session({ client_reference_id: "123" })), null);
    assert.equal(orderIdFromSession(session({ metadata: null, client_reference_id: null })), null);
  });
});

describe("maxQuantity", () => {
  test("caps a cart line at stock, up to the per-item limit", () => {
    assert.equal(maxQuantity(0), 0);
    assert.equal(maxQuantity(-3), 0);
    assert.equal(maxQuantity(4), 4);
    assert.equal(maxQuantity(500), MAX_PER_ITEM);
  });
});

describe("parseSort", () => {
  test("accepts known sort keys and defaults otherwise", () => {
    assert.equal(parseSort("price-asc"), "price-asc");
    assert.equal(parseSort("newest"), "newest");
    assert.equal(parseSort("bogus"), "featured");
    assert.equal(parseSort(["price-asc"]), "featured");
    assert.equal(parseSort(undefined), "featured");
    assert.equal(parseSort("constructor"), "featured"); // not an own key of the options table
  });
});
