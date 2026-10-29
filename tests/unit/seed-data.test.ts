import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { categorySeeds, seedProducts } from "@/db/seed-data";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { journalArticles } from "@/lib/journal-data";
import { collections, navLinks } from "@/lib/store-data";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("demo catalog data", () => {
  test("slugs are unique and URL-safe", () => {
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    assert.ok(unique(seedProducts.map((p) => p.slug)), "duplicate product slug");
    assert.ok(unique(categorySeeds.map((c) => c.slug)), "duplicate category slug");
    for (const { slug } of [...seedProducts, ...categorySeeds]) assert.match(slug, slugPattern);
  });

  test("every product points at a real category", () => {
    const categories = new Set(categorySeeds.map((c) => c.slug));
    for (const product of seedProducts) {
      assert.ok(categories.has(product.categorySlug), `${product.slug}: unknown category ${product.categorySlug}`);
    }
  });

  test("prices, stock and audience are sane", () => {
    for (const p of seedProducts) {
      assert.ok(Number.isInteger(p.priceCents) && p.priceCents > 0, `${p.slug}: price`);
      assert.ok(Number.isInteger(p.stock) && p.stock >= 0, `${p.slug}: stock`);
      assert.ok(["women", "men", "unisex"].includes(p.audience), `${p.slug}: audience`);
      assert.ok(p.name.length > 0 && p.description.length > 0 && p.details.length > 0, `${p.slug}: copy`);
    }
  });

  test("every product has allowed images with alt text", () => {
    for (const p of seedProducts) {
      assert.equal(p.images.length, 3, `${p.slug}: image count`);
      for (const image of p.images) {
        assert.ok(isAllowedImageUrl(image.url), `${p.slug}: image host`);
        assert.ok(image.alt.length > 0, `${p.slug}: alt text`);
      }
    }
  });

  test("creation dates are strictly increasing, so the last entry is the newest", () => {
    const times = seedProducts.map((p) => p.createdAt.getTime());
    assert.deepEqual(times, [...times].sort((a, b) => a - b));
    assert.ok(unique(times.map(String)));
  });
});

describe("static site content", () => {
  test("journal articles have unique slugs, ISO dates and content", () => {
    assert.ok(unique(journalArticles.map((a) => a.slug)));
    for (const article of journalArticles) {
      assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(!Number.isNaN(Date.parse(article.date)), article.slug);
      assert.ok(article.sections.length > 0, article.slug);
    }
  });

  test("header links and home tiles go to collections that exist", () => {
    const known = new Set(["all", "new-in", "women", "men", ...categorySeeds.map((c) => c.slug)]);
    for (const link of navLinks) {
      assert.match(link.href, /^\/collections\/[a-z-]+$/);
      assert.ok(known.has(link.href.split("/").pop()!), `nav ${link.href}`);
    }
    for (const tile of collections) assert.ok(known.has(tile.slug), `tile ${tile.slug}`);
  });
});
