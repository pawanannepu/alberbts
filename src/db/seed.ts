import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });
config();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data with NODE_ENV=production");
  }

  // Imported after env is loaded: the db module reads DATABASE_URL at import time.
  const { db } = await import("./index");
  const { categories, inventory, productImages, products } = await import("./schema");
  const { categorySeeds, seedProducts } = await import("./seed-data");

  const categoryRows = await db
    .insert(categories)
    .values(categorySeeds)
    .onConflictDoUpdate({ target: categories.slug, set: { name: categories.name } })
    .returning({ id: categories.id, slug: categories.slug });
  const categoryId = new Map(categoryRows.map((c) => [c.slug, c.id]));

  for (const { categorySlug, stock, images, ...product } of seedProducts) {
    const values = { ...product, categoryId: categoryId.get(categorySlug)! };
    const [row] = await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({ target: products.slug, set: values })
      .returning({ id: products.id });

    // Neon's HTTP driver has no interactive transactions, so make each step idempotent.
    await db.delete(productImages).where(eq(productImages.productId, row.id));
    await db
      .insert(productImages)
      .values(images.map((image, position) => ({ ...image, position, productId: row.id })));
    await db
      .insert(inventory)
      .values({ productId: row.id, quantity: stock })
      .onConflictDoUpdate({ target: inventory.productId, set: { quantity: stock } });
  }

  console.log(`Seeded ${categoryRows.length} categories and ${seedProducts.length} products`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
