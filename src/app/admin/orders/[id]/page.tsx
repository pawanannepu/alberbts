import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireAdmin } from "@/lib/admin";
import { getAdminOrder } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Order" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={null}>
      {params.then(({ id }) => (
        <OrderDetail id={id} />
      ))}
    </Suspense>
  );
}

async function OrderDetail({ id }: { id: string }) {
  await requireAdmin();
  if (!UUID.test(id)) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const a = order.shippingAddress;
  const when = (d: Date | null) => (d ? d.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC" : "—");

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="caption underline underline-offset-4">
        All orders
      </Link>
      <h1 className="heading mt-4">Order #{order.number}</h1>
      <p className="caption mt-2 capitalize">
        {order.status} · placed {when(order.createdAt)}
      </p>

      <ul className="mt-8 border-t">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 border-b py-3 text-body">
            <span>
              {item.name} <span className="caption ml-2">× {item.quantity} at {formatPrice(item.unitPriceCents)}</span>
            </span>
            <span>{formatPrice(item.unitPriceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-body">
        <span>Total</span>
        <span>{formatPrice(order.subtotalCents)}</span>
      </p>

      <dl className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="label text-muted">Customer</dt>
          <dd className="mt-2 text-body">{order.email}</dd>
        </div>
        <div>
          <dt className="label text-muted">Shipping to</dt>
          <dd className="mt-2 text-body">
            {a ? (
              <>
                {order.shippingName}
                <br />
                {[a.line1, a.line2].filter(Boolean).join(", ")}
                <br />
                {[a.city, a.state, a.postal_code].filter(Boolean).join(", ")}
                <br />
                {a.country}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="label text-muted">Paid</dt>
          <dd className="mt-2 text-body">{when(order.paidAt)}</dd>
        </div>
        <div>
          <dt className="label text-muted">Stripe payment</dt>
          <dd className="mt-2 break-all text-body">{order.stripePaymentIntentId ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
