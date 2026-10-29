import Link from "next/link";
import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { listAdminOrders, ORDER_FILTERS, type OrderFilter } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders" };

const label: Record<OrderFilter, string> = { paid: "Paid", pending: "Awaiting payment", cancelled: "Cancelled", all: "All" };

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={null}>
      {searchParams.then(({ status }) => (
        <Orders filter={ORDER_FILTERS.find((f) => f === status) ?? "paid"} />
      ))}
    </Suspense>
  );
}

async function Orders({ filter }: { filter: OrderFilter }) {
  await requireAdmin();
  const rows = await listAdminOrders(filter);

  return (
    <>
      <h1 className="heading">Orders</h1>
      <nav aria-label="Order status" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {ORDER_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "paid" ? "/admin/orders" : `/admin/orders?status=${f}`}
            aria-current={f === filter ? "true" : undefined}
            className={`label ${f === filter ? "underline underline-offset-4" : "text-muted hover:text-ink"}`}
          >
            {label[f]}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="caption mt-8">No orders here.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-t text-left text-body">
            <thead>
              <tr className="label text-muted">
                <th className="py-3 pr-4 font-normal">Order</th>
                <th className="py-3 pr-4 font-normal">Date</th>
                <th className="py-3 pr-4 font-normal">Customer</th>
                <th className="py-3 pr-4 font-normal">Items</th>
                <th className="py-3 pr-4 font-normal">Status</th>
                <th className="py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/orders/${o.id}`} className="underline underline-offset-4">
                      #{o.number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {o.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                  </td>
                  <td className="py-3 pr-4">{o.email}</td>
                  <td className="py-3 pr-4">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="py-3 pr-4 capitalize">{o.status}</td>
                  <td className="py-3 text-right">{formatPrice(o.subtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
