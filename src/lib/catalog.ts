import { asc, desc, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";

// Query layer for the storefront. Returns plain view-models so components never see raw rows.
// Reads are cached and tagged "products"; call updateTag/revalidateTag("products") after writes.

const withRelations = {
  category: true,
  images: { orderBy: asc(productImages.position) },
  inventory: true,
} as const;

type ProductRow = NonNullable<Awaited<ReturnType<typeof findOne>>>;

const findOne = (slug: string) =>
  db.query.products.findFirst({ where: eq(products.slug, slug), with: withRelations });

const toProduct = (row: ProductRow) => ({
  slug: row.slug,
  name: row.name,
  description: row.description,
  details: row.details,
  priceCents: row.priceCents,
  isNew: row.isNew,
  categoryId: row.categoryId,
  category: { slug: row.category.slug, name: row.category.name },
  stock: row.inventory?.quantity ?? 0,
  gallery: row.images.map((image) => ({ src: image.url, alt: image.alt })),
});

export type Product = ReturnType<typeof toProduct>;

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const row = await findOne(slug);
  return row ? toProduct(row) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.query.products.findMany({
    with: withRelations,
    orderBy: asc(products.id),
    limit,
  });
  return rows.map(toProduct);
}

export async function getNewArrivals(limit = 6): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.query.products.findMany({
    with: withRelations,
    orderBy: desc(products.createdAt),
    limit,
  });
  return rows.map(toProduct);
}

// Same category first, then everything else.
export async function getRelatedProducts(
  slug: string,
  categoryId: number,
  limit = 6,
): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.query.products.findMany({
    with: withRelations,
    where: ne(products.slug, slug),
    orderBy: [desc(sql`${products.categoryId} = ${categoryId}`), asc(products.id)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((row) => row.slug);
}

export async function getCategories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  return db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.name));
}

// Collections are the browsable groupings behind /collections/[slug]: every category,
// plus a few curated ones that filter on product fields instead.
const curated = {
  all: { title: "Shop All" },
  "new-in": { title: "New In" },
  women: { title: "Women" },
  men: { title: "Men" },
} as const;

export const SORT_OPTIONS = {
  featured: { label: "Featured", orderBy: [asc(products.id)] },
  newest: { label: "Newest", orderBy: [desc(products.createdAt), desc(products.id)] },
  "price-asc": { label: "Price: low to high", orderBy: [asc(products.priceCents), asc(products.id)] },
  "price-desc": { label: "Price: high to low", orderBy: [desc(products.priceCents), asc(products.id)] },
} satisfies Record<string, { label: string; orderBy: SQL[] }>;

export type SortKey = keyof typeof SORT_OPTIONS;

export function parseSort(value: string | string[] | undefined): SortKey {
  return typeof value === "string" && value in SORT_OPTIONS ? (value as SortKey) : "featured";
}

function isCurated(slug: string): slug is keyof typeof curated {
  return Object.hasOwn(curated, slug);
}

export async function getCollectionSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await db.select({ slug: categories.slug }).from(categories);
  return [...Object.keys(curated), ...rows.map((row) => row.slug)];
}

export async function getCollection(slug: string, sort: SortKey = "featured") {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  let title: string;
  let where: SQL | undefined;

  if (isCurated(slug)) {
    title = curated[slug].title;
    if (slug === "new-in") where = eq(products.isNew, true);
    if (slug === "women") where = inArray(products.audience, ["women", "unisex"]);
    if (slug === "men") where = inArray(products.audience, ["men", "unisex"]);
  } else {
    const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
    if (!category) return null;
    title = category.name;
    where = eq(products.categoryId, category.id);
  }

  const rows = await db.query.products.findMany({
    with: withRelations,
    where,
    orderBy: SORT_OPTIONS[sort].orderBy,
  });
  return { slug, title, products: rows.map(toProduct) };
}
