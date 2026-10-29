"use server";

import { updateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createCategoryRecord, deleteCategoryRecord } from "@/lib/admin-products";
import { slugify } from "@/lib/product-input";

export type CategoryState = { error?: string; ok?: boolean };

export async function createCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(name);
  if (!name || name.length > 60 || !slug) return { error: "Enter a name up to 60 characters." };

  const { error } = await createCategoryRecord(name, slug);
  if (error) return { error };
  updateTag("products");
  return { ok: true };
}

export async function deleteCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Invalid category." };

  const { error } = await deleteCategoryRecord(id);
  if (error) return { error };
  updateTag("products");
  return { ok: true };
}
