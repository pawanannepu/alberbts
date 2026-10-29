import { z } from "zod";

import { isAllowedImageUrl, IMAGE_HOSTS } from "@/lib/image-hosts";

// Parses and validates the admin product form. Prices come in as dollars ("245" or "245.50")
// and leave as integer cents.

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const text = (field: string, max: number) =>
  z.string().trim().min(1, `${field} is required`).max(max, `${field} is too long`);

const productSchema = z.object({
  name: text("Name", 120),
  slug: z.string().trim().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: text("Description", 2000),
  details: z.array(z.string().trim().min(1).max(200, "Each detail must be under 200 characters")).max(12, "At most 12 details"),
  priceCents: z.number().int().min(0, "Price can't be negative").max(100_000_000, "Price is too high"),
  categoryId: z.number().int().positive("Choose a category"),
  audience: z.enum(["women", "men", "unisex"]),
  isNew: z.boolean(),
  stock: z.number().int().min(0, "Stock can't be negative").max(100_000, "Stock is too high"),
  images: z
    .array(
      z.object({
        url: z.string().refine(isAllowedImageUrl, `Image must be an https URL from: ${IMAGE_HOSTS.join(", ")}`),
        alt: text("Image description", 200),
      }),
    )
    .min(1, "Add at least one image")
    .max(8, "At most 8 images"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductFormState = { error?: string; fieldErrors?: Record<string, string> };

const str = (form: FormData, key: string) => String(form.get(key) ?? "");

export function parseProductForm(
  form: FormData,
): { ok: true; data: ProductInput } | { ok: false; state: ProductFormState } {
  const name = str(form, "name").trim();
  const priceText = str(form, "price").trim();
  const priceOk = /^\d+(\.\d{1,2})?$/.test(priceText);

  const images: { url: string; alt: string }[] = [];
  for (let i = 0; form.has(`imageUrl-${i}`); i++) {
    const url = str(form, `imageUrl-${i}`).trim();
    const alt = str(form, `imageAlt-${i}`).trim();
    if (url || alt) images.push({ url, alt }); // blank rows are ignored
  }

  const result = productSchema.safeParse({
    name,
    slug: str(form, "slug").trim().toLowerCase() || slugify(name),
    description: str(form, "description"),
    details: str(form, "details").split("\n").map((line) => line.trim()).filter(Boolean),
    priceCents: priceOk ? Math.round(Number(priceText) * 100) : Number.NaN,
    categoryId: Number(str(form, "categoryId")),
    audience: str(form, "audience"),
    isNew: form.get("isNew") === "on",
    stock: str(form, "stock").trim() === "" ? Number.NaN : Number(str(form, "stock")),
    images,
  });

  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] === "priceCents" ? "price" : String(issue.path[0]);
    fieldErrors[key] ??= issue.message.includes("expected number")
      ? key === "price"
        ? "Enter a price like 245 or 245.50"
        : "Enter a whole number"
      : issue.message;
  }
  if (!priceOk && !fieldErrors.price) fieldErrors.price = "Enter a price like 245 or 245.50";
  return { ok: false, state: { error: "Please fix the highlighted fields.", fieldErrors } };
}
