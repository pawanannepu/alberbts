import { Suspense } from "react";

import { AdminProductForm } from "@/components/admin-product-form";
import { requireAdmin } from "@/lib/admin";
import { listAdminCategories } from "@/lib/admin-data";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={null}>
      <NewProductForm />
    </Suspense>
  );
}

async function NewProductForm() {
  await requireAdmin();
  const categories = await listAdminCategories();
  return (
    <>
      <h1 className="heading">New product</h1>
      <div className="mt-8">
        <AdminProductForm categories={categories} />
      </div>
    </>
  );
}
