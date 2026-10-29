import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { db } from "@/db";
import { formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<p className="caption">Loading your order…</p>}>
          {params.then(({ id }) => (
            <OrderDetails id={id} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}

async function OrderDetails({ id }: { id: string }) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/orders/${id}`)}`);
  if (!UUID.test(id)) notFound();

  const order = await db.query.orders.findFirst({
    where: (o, { and, eq }) => and(eq(o.id, id), eq(o.userId, session.user.id)),
    with: { items: { orderBy: (i, { asc }) => asc(i.id) } },
  });
  if (!order) notFound();

  const heading = {
    paid: "Thank you for your order",
    pending: "Awaiting payment",
    cancelled: "Order cancelled",
  }[order.status];
  const note = {
    paid: `Your order is confirmed and placed under ${order.email}.`,
    pending: "We haven't received your payment yet. If you've just paid, refresh in a moment.",
    cancelled: "This order is no longer active and any held items were released.",
  }[order.status];

  const address = order.shippingAddress;

  return (
    <>
      <p className="label text-muted">Order #{order.number}</p>
      <h1 className="heading mt-3">{heading}</h1>
      <p className="caption mt-2">{note}</p>

      <ul className="mt-8 border-t">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b py-5">
            <div className="media aspect-[4/5] w-20 shrink-0">
              {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill sizes="80px" />}
            </div>
            <div className="flex flex-1 justify-between gap-4 text-body">
              <div>
                <p>{item.name}</p>
                <p className="caption mt-1">
                  Qty {item.quantity} · {formatPrice(item.unitPriceCents)}
                </p>
              </div>
              <p>{formatPrice(item.unitPriceCents * item.quantity)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between text-body">
        <span>Total</span>
        <span>{formatPrice(order.subtotalCents)}</span>
      </div>

      {order.status === "paid" && address && (
        <div className="mt-8">
          <h2 className="label text-muted">Shipping to</h2>
          <p className="mt-3 text-body">
            {order.shippingName}
            <br />
            {[address.line1, address.line2].filter(Boolean).join(", ")}
            <br />
            {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
            <br />
            {address.country}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        {order.status === "pending" && (
          <Link href="/cart" className="btn btn-primary">
            Back to bag
          </Link>
        )}
        <Link href="/collections/all" className="btn btn-secondary">
          Continue shopping
        </Link>
      </div>
    </>
  );
}
