"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type FormEvent } from "react";

import { saveProduct } from "@/app/admin/products/actions";
import { IMAGE_HOSTS } from "@/lib/image-hosts";
import type { ProductFormState } from "@/lib/product-input";

type Props = {
  categories: { id: number; name: string }[];
  product?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    details: string[];
    priceCents: number;
    categoryId: number;
    audience: "women" | "men" | "unisex";
    isNew: boolean;
    stock: number;
    images: { url: string; alt: string }[];
  };
};

const MAX_IMAGES = 8;

export function AdminProductForm({ categories, product }: Props) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState(product?.images.length ? product.images : [{ url: "", alt: "" }]);
  const errors = state.fieldErrors ?? {};

  // Submit via onSubmit (not the form's `action`) so React doesn't reset the fields on a validation error.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  const setImage = (index: number, patch: Partial<{ url: string; alt: string }>) =>
    setImages((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Name" error={errors.name}>
        <input name="name" defaultValue={product?.name} required maxLength={120} className="field" />
      </Field>

      <Field
        label="URL name"
        hint="Used in the product link. Leave blank to create it from the name."
        error={errors.slug}
      >
        <input name="slug" defaultValue={product?.slug} maxLength={120} className="field" />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          rows={4}
          maxLength={2000}
          className="field py-3"
        />
      </Field>

      <Field label="Details" hint="One per line (materials, fit, care)." error={errors.details}>
        <textarea name="details" defaultValue={product?.details.join("\n")} rows={4} className="field py-3" />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Price (USD)" error={errors.price}>
          <input
            name="price"
            inputMode="decimal"
            defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
            required
            className="field"
          />
        </Field>
        <Field
          label="In stock"
          hint={product ? "Available now. Items held by pending orders are already excluded." : undefined}
          error={errors.stock}
        >
          <input
            name="stock"
            type="number"
            min={0}
            max={100000}
            step={1}
            defaultValue={product?.stock ?? 0}
            required
            className="field"
          />
        </Field>
        <Field label="Category" error={errors.categoryId}>
          <select name="categoryId" defaultValue={product?.categoryId ?? ""} required className="field">
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="For" error={errors.audience}>
          <select name="audience" defaultValue={product?.audience ?? "unisex"} className="field">
            <option value="unisex">Everyone</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-3 text-body">
        <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="size-4 accent-black" />
        Show a &ldquo;New&rdquo; badge and list in New In
      </label>

      <fieldset className="flex flex-col gap-4">
        <legend className="label mb-1">Images</legend>
        <p className="caption text-muted">
          The first image is the cover. Images must be https links from: {IMAGE_HOSTS.join(", ")}.
        </p>
        {errors.images && <p className="caption text-danger">{errors.images}</p>}
        {images.map((row, i) => (
          <div key={i} className="grid gap-2 border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <input
              name={`imageUrl-${i}`}
              value={row.url}
              onChange={(e) => setImage(i, { url: e.target.value })}
              placeholder="https://…"
              aria-label={`Image ${i + 1} URL`}
              className="field"
            />
            <input
              name={`imageAlt-${i}`}
              value={row.alt}
              onChange={(e) => setImage(i, { alt: e.target.value })}
              placeholder="Describe the image"
              aria-label={`Image ${i + 1} description`}
              className="field"
            />
            <button
              type="button"
              className="caption px-2 underline underline-offset-4 disabled:opacity-40"
              disabled={images.length === 1}
              onClick={() => setImages((rows) => rows.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            className="btn btn-secondary self-start"
            onClick={() => setImages((rows) => [...rows, { url: "", alt: "" }])}
          >
            Add image
          </button>
        )}
      </fieldset>

      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {state.error}
      </p>

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link href="/admin/products" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="caption text-muted">{hint}</span>}
      {error && <span className="caption text-danger">{error}</span>}
    </label>
  );
}
