import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminProductForm } from "@/components/admin-product-form";
import { requireAdmin } from "@/lib/admin";
import { getAdminProduct, listAdminCategories } from "@/lib/admin-data";

export const metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ id }) => (
        <EditProductForm id={id} />
      ))}
    </Suspense>
  );
}

async function EditProductForm({ id }: { id: string }) {
  await requireAdmin();
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const [product, categories] = await Promise.all([getAdminProduct(productId), listAdminCategories()]);
  if (!product) notFound();

  return (
    <>
      <h1 className="heading">Edit product</h1>
      <div className="mt-8">
        <AdminProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            details: product.details,
            priceCents: product.priceCents,
            categoryId: product.categoryId,
            audience: product.audience,
            isNew: product.isNew,
            stock: product.inventory?.quantity ?? 0,
            images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
          }}
        />
      </div>
    </>
  );
}
