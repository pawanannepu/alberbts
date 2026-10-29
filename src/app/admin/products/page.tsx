import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { requireAdmin } from "@/lib/admin";
import { listAdminProducts } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";

import { deleteProduct, setStock } from "./actions";

export const metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsTable />
    </Suspense>
  );
}

async function ProductsTable() {
  await requireAdmin();
  const items = await listAdminProducts();

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1 className="heading">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>
      {items.length === 0 ? <p className="caption mt-8">No products yet.</p> : <ProductRows items={items} />}
    </>
  );
}

function ProductRows({ items }: { items: Awaited<ReturnType<typeof listAdminProducts>> }) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[44rem] border-t text-left text-body">
        <thead>
          <tr className="label text-muted">
            <th className="py-3 pr-4 font-normal">Product</th>
            <th className="py-3 pr-4 font-normal">Category</th>
            <th className="py-3 pr-4 font-normal">Price</th>
            <th className="py-3 pr-4 font-normal">In stock</th>
            <th className="py-3 font-normal" />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const cover = p.images[0];
            return (
              <tr key={p.id} className="border-t align-middle">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="media aspect-[4/5] w-12 shrink-0">
                      {cover && <Image src={cover.url} alt="" fill sizes="48px" />}
                    </div>
                    <div>
                      <Link href={`/admin/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                      {p.isNew && <span className="label ml-2 text-muted">New</span>}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">{p.category.name}</td>
                <td className="py-3 pr-4">{formatPrice(p.priceCents)}</td>
                <td className="py-3 pr-4">
                  <form action={setStock} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={0}
                      max={100000}
                      step={1}
                      defaultValue={p.inventory?.quantity ?? 0}
                      aria-label={`Stock for ${p.name}`}
                      className="field !min-h-10 !w-20 !px-3"
                    />
                    <button type="submit" className="caption underline underline-offset-4">
                      Save
                    </button>
                  </form>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/admin/products/${p.id}`} className="caption underline underline-offset-4">
                      Edit
                    </Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton
                        message={`Delete "${p.name}"? It will be removed from the store and from customers' bags. Past orders keep their details.`}
                        className="caption text-danger underline underline-offset-4"
                      >
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
