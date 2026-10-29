"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { deleteProductRecord, saveProductRecord, setStockRecord } from "@/lib/admin-products";
import { parseProductForm, type ProductFormState } from "@/lib/product-input";

const toId = (value: FormDataEntryValue | null) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();

  const idField = formData.get("id");
  const id = idField ? toId(idField) : null;
  if (idField && !id) return { error: "Invalid product." };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.state;

  const result = await saveProductRecord(id, parsed.data);
  if (!result.ok) return result.state;

  updateTag("products");
  redirect("/admin/products");
}

// Sets how many are available right now (items held by pending orders are already excluded).
export async function setStock(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = toId(formData.get("id"));
  const quantity = Number(formData.get("quantity"));
  if (!id || !Number.isInteger(quantity) || quantity < 0 || quantity > 100_000) return;

  await setStockRecord(id, quantity);
  updateTag("products");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = toId(formData.get("id"));
  if (!id) return;

  await deleteProductRecord(id);
  updateTag("products");
  redirect("/admin/products");
}
