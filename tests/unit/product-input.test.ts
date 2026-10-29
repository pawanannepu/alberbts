import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseProductForm, slugify } from "@/lib/product-input";

const IMAGE = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const fields: Record<string, string> = {
    name: "Round Metal Sunglasses",
    slug: "",
    description: "Thin metal frames.",
    details: "Metal frame\nUV400 lenses\n",
    price: "245",
    categoryId: "1",
    audience: "unisex",
    stock: "14",
    "imageUrl-0": IMAGE,
    "imageAlt-0": "Sunglasses on a table",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("slugify", () => {
  test("lowercases, strips accents and collapses separators", () => {
    assert.equal(slugify("  Crème Brûlée  Dress! "), "creme-brulee-dress");
    assert.equal(slugify("---A  B---"), "a-b");
  });
});

describe("parseProductForm", () => {
  test("parses a valid form into integer cents and a derived slug", () => {
    const result = parseProductForm(form());
    assert.ok(result.ok);
    assert.equal(result.data.priceCents, 24500);
    assert.equal(result.data.slug, "round-metal-sunglasses");
    assert.deepEqual(result.data.details, ["Metal frame", "UV400 lenses"]);
    assert.equal(result.data.isNew, false);
  });

  test("converts decimal prices without floating point drift", () => {
    for (const [price, cents] of [["245.50", 24550], ["1.15", 115], ["0.29", 29], ["0", 0]] as const) {
      const result = parseProductForm(form({ price }));
      assert.ok(result.ok, price);
      assert.equal(result.data.priceCents, cents, price);
    }
  });

  test("rejects malformed prices", () => {
    for (const price of ["", "abc", "-5", "1.234", "1e3", "12,5"]) {
      const result = parseProductForm(form({ price }));
      assert.ok(!result.ok, `price ${JSON.stringify(price)} should be rejected`);
      assert.ok(result.state.fieldErrors?.price);
    }
  });

  test("rejects images that aren't https from an allowed host", () => {
    for (const url of ["http://images.unsplash.com/p.jpg", "https://evil.com/p.jpg", "javascript:alert(1)"]) {
      const result = parseProductForm(form({ "imageUrl-0": url }));
      assert.ok(!result.ok, url);
    }
  });

  test("requires an image, a valid audience and non-negative whole stock", () => {
    assert.ok(!parseProductForm(form({ "imageUrl-0": "", "imageAlt-0": "" })).ok);
    assert.ok(!parseProductForm(form({ audience: "kids" })).ok);
    assert.ok(!parseProductForm(form({ stock: "-1" })).ok);
    assert.ok(!parseProductForm(form({ stock: "2.5" })).ok);
    assert.ok(!parseProductForm(form({ stock: "" })).ok);
  });

  test("rejects unusable slugs", () => {
    assert.ok(!parseProductForm(form({ slug: "Not A Slug" })).ok);
    assert.ok(!parseProductForm(form({ slug: "-leading" })).ok);
  });
});
