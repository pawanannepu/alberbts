import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_AFTER_SIGN_IN, safeNext } from "@/lib/auth-shared";
import { formatPrice, getStockState, LOW_STOCK_THRESHOLD } from "@/lib/format";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { pgError } from "@/lib/pg-error";

describe("formatPrice", () => {
  test("turns integer cents into whole dollars", () => {
    assert.equal(formatPrice(24500), "$245");
    assert.equal(formatPrice(0), "$0");
    assert.equal(formatPrice(123456), "$1,235");
  });
});

describe("getStockState", () => {
  test("classifies by quantity", () => {
    assert.equal(getStockState(0), "out-of-stock");
    assert.equal(getStockState(-1), "out-of-stock");
    assert.equal(getStockState(1), "low-stock");
    assert.equal(getStockState(LOW_STOCK_THRESHOLD), "low-stock");
    assert.equal(getStockState(LOW_STOCK_THRESHOLD + 1), "in-stock");
  });
});

describe("safeNext (open-redirect guard)", () => {
  test("keeps same-site paths, including query strings", () => {
    assert.equal(safeNext("/cart"), "/cart");
    assert.equal(safeNext("/checkout/return?session_id=cs_test_1"), "/checkout/return?session_id=cs_test_1");
    assert.equal(safeNext("/orders/abc?x=%2F%2Fevil.com"), "/orders/abc?x=%2F%2Fevil.com");
  });

  test("falls back for missing or non-string input", () => {
    for (const value of [undefined, null, "", ["/cart"]]) {
      assert.equal(safeNext(value), DEFAULT_AFTER_SIGN_IN);
    }
  });

  test("rejects anything that can leave the site", () => {
    const attacks = [
      "https://evil.com",
      "http://evil.com/path",
      "//evil.com",
      "///evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "/\t/evil.com", // browsers drop the tab, leaving "//evil.com"
      "/\n/evil.com",
      "/\r/evil.com",
      "/ /evil.com",
      "/\u0000/evil.com",
      "javascript:alert(1)",
      "evil.com",
      "cart",
    ];
    for (const attack of attacks) {
      assert.equal(safeNext(attack), DEFAULT_AFTER_SIGN_IN, `should reject ${JSON.stringify(attack)}`);
    }
  });
});

describe("isAllowedImageUrl", () => {
  test("accepts https images from allowed hosts only", () => {
    assert.equal(isAllowedImageUrl("https://images.unsplash.com/photo-1?w=800"), true);
    assert.equal(isAllowedImageUrl("http://images.unsplash.com/photo-1"), false);
    assert.equal(isAllowedImageUrl("https://images.unsplash.com.evil.com/photo-1"), false);
    assert.equal(isAllowedImageUrl("https://images.unsplash.com@evil.com/photo-1"), false);
    assert.equal(isAllowedImageUrl("https://evil.com/images.unsplash.com"), false);
    assert.equal(isAllowedImageUrl("javascript:alert(1)"), false);
    assert.equal(isAllowedImageUrl("not a url"), false);
    assert.equal(isAllowedImageUrl(""), false);
  });
});

describe("pgError", () => {
  test("finds the Postgres code, even when wrapped in `cause`", () => {
    assert.deepEqual(pgError({ code: "23505", constraint: "products_slug_unique" }), {
      code: "23505",
      constraint: "products_slug_unique",
    });
    assert.deepEqual(pgError(new Error("wrapped", { cause: { code: "23001", constraint: "x" } })), {
      code: "23001",
      constraint: "x",
    });
  });

  test("ignores errors without a Postgres code", () => {
    assert.deepEqual(pgError(new Error("boom")), {});
    assert.deepEqual(pgError({ code: "ECONNRESET" }), {});
    assert.deepEqual(pgError(undefined), {});
  });
});
