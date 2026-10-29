import { eq } from "drizzle-orm";

import { db } from "@/db";
import { categories, inventory, productImages, products } from "@/db/schema";
import { pgError } from "@/lib/pg-error";
import type { ProductFormState, ProductInput } from "@/lib/product-input";

// Admin write operations. No auth or request context here: the Server Actions in
// src/app/admin/** check requireAdmin(), call these, then invalidate the "products" cache.

export type WriteResult = { ok: true } | { ok: false; state: ProductFormState };

const fieldError = (field: string, message: string): WriteResult => ({
  ok: false,
  state: { error: "Please fix the highlighted fields.", fieldErrors: { [field]: message } },
});

// Creates the product when `id` is null, otherwise replaces its fields, images and stock.
export async function saveProductRecord(id: number | null, input: ProductInput): Promise<WriteResult> {
  const { stock, images, ...fields } = input;
  const imageRows = (productId: number) => images.map((image, position) => ({ ...image, position, productId }));

  try {
    if (id) {
      const existing = await db.query.products.findFirst({ where: eq(products.id, id), columns: { id: true } });
      if (!existing) return { ok: false, state: { error: "This product no longer exists." } };
      // One transaction: a failure leaves the product exactly as it was.
      await db.batch([
        db.update(products).set(fields).where(eq(products.id, id)),
        db.delete(productImages).where(eq(productImages.productId, id)),
        db.insert(productImages).values(imageRows(id)),
        db
          .insert(inventory)
          .values({ productId: id, quantity: stock })
          .onConflictDoUpdate({ target: inventory.productId, set: { quantity: stock, updatedAt: new Date() } }),
      ]);
    } else {
      const [created] = await db.insert(products).values(fields).returning({ id: products.id });
      try {
        await db.batch([
          db.insert(productImages).values(imageRows(created.id)),
          db.insert(inventory).values({ productId: created.id, quantity: stock }),
        ]);
      } catch (error) {
        await db.delete(products).where(eq(products.id, created.id)); // don't leave a half-made product
        throw error;
      }
    }
  } catch (error) {
    const { code, constraint } = pgError(error);
    if (code === "23505" && constraint?.includes("slug")) {
      return fieldError("slug", "Another product already uses this URL name");
    }
    if (code === "23503") return fieldError("categoryId", "Choose a valid category");
    console.error("Saving product failed", error);
    return { ok: false, state: { error: "Couldn't save the product. Please try again." } };
  }
  return { ok: true };
}

export async function setStockRecord(productId: number, quantity: number): Promise<void> {
  await db
    .insert(inventory)
    .values({ productId, quantity })
    .onConflictDoUpdate({ target: inventory.productId, set: { quantity, updatedAt: new Date() } });
}

// Order history keeps its own copy of name/price/image; carts drop the item.
export async function deleteProductRecord(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

export async function createCategoryRecord(name: string, slug: string): Promise<{ error?: string }> {
  try {
    await db.insert(categories).values({ name, slug });
  } catch (error) {
    if (pgError(error).code === "23505") return { error: "A category with that name already exists." };
    console.error("Creating category failed", error);
    return { error: "Couldn't create the category. Please try again." };
  }
  return {};
}

export async function deleteCategoryRecord(id: number): Promise<{ error?: string }> {
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    // ON DELETE RESTRICT reports 23001 (restrict_violation); other FK failures report 23503.
    const { code } = pgError(error);
    if (code === "23001" || code === "23503") return { error: "Move or delete its products first." };
    console.error("Deleting category failed", error);
    return { error: "Couldn't delete the category." };
  }
  return {};
}
