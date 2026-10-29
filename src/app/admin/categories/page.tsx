import Link from "next/link";
import { Suspense } from "react";

import { CreateCategoryForm, DeleteCategoryForm } from "@/components/admin-category-forms";
import { requireAdmin } from "@/lib/admin";
import { listAdminCategories } from "@/lib/admin-data";

export const metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={null}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  await requireAdmin();
  const rows = await listAdminCategories();

  return (
    <>
      <h1 className="heading">Categories</h1>
      <div className="mt-8">
        <CreateCategoryForm />
      </div>
      <ul className="mt-6 max-w-2xl border-t">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 border-b py-3 text-body">
            <div>
              <Link href={`/collections/${c.slug}`} className="hover:underline">
                {c.name}
              </Link>
              <span className="caption ml-3">
                {c.products} {c.products === 1 ? "product" : "products"}
              </span>
            </div>
            {c.products === 0 && <DeleteCategoryForm id={c.id} name={c.name} />}
          </li>
        ))}
      </ul>
    </>
  );
}
