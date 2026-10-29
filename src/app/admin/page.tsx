import Link from "next/link";
import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { getDashboard } from "@/lib/admin-data";
import { formatPrice, LOW_STOCK_THRESHOLD } from "@/lib/format";

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={null}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const { sales, productCount, lowStock, recent } = await getDashboard(LOW_STOCK_THRESHOLD);

  return (
    <>
      <h1 className="heading">Overview</h1>

      <dl className="mt-8 grid gap-px border bg-line sm:grid-cols-3">
        <Stat label="Paid orders" value={String(sales.orders)} />
        <Stat label="Revenue" value={formatPrice(sales.revenueCents)} />
        <Stat label="Products" value={String(productCount)} />
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="label text-muted">Needs restocking</h2>
          {lowStock.length === 0 ? (
            <p className="caption mt-3">Everything is well stocked.</p>
          ) : (
            <ul className="mt-3 border-t">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-4 border-b py-3 text-body">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                  <span className={(p.quantity ?? 0) === 0 ? "text-danger" : "text-muted"}>
                    {(p.quantity ?? 0) === 0 ? "Out of stock" : `${p.quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="label text-muted">Recent orders</h2>
            <Link href="/admin/orders" className="tap caption underline underline-offset-4">
              All orders
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="caption mt-3">No paid orders yet.</p>
          ) : (
            <ul className="mt-3 border-t">
              {recent.map((o) => (
                <li key={o.id} className="border-b">
                  <Link href={`/admin/orders/${o.id}`} className="flex justify-between gap-4 py-3 text-body hover:underline">
                    <span>
                      #{o.number} <span className="caption ml-2">{o.email}</span>
                    </span>
                    <span>{formatPrice(o.subtotalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper p-6">
      <dt className="label text-muted">{label}</dt>
      <dd className="title mt-2">{value}</dd>
    </div>
  );
}
