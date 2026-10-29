import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { db } from "@/db";
import { formatPrice } from "@/lib/format";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-md">
        <h1 className="heading">Account</h1>
        <Suspense fallback={<p className="caption mt-2">Loading…</p>}>
          <AccountDetails />
        </Suspense>
      </div>
    </main>
  );
}

async function AccountDetails() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/account");

  const { user } = session;
  const paidOrders = await db.query.orders.findMany({
    where: (o, { and, eq }) => and(eq(o.userId, user.id), eq(o.status, "paid")),
    orderBy: (o, { desc }) => desc(o.createdAt),
  });
  return (
    <>
      <p className="caption mt-2">Signed in as {user.email}</p>
      <dl className="mt-8 border-t">
        <div className="flex justify-between gap-4 border-b py-4">
          <dt className="label text-muted">Name</dt>
          <dd className="text-body">{user.name}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b py-4">
          <dt className="label text-muted">Email</dt>
          <dd className="text-body">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b py-4">
          <dt className="label text-muted">Member since</dt>
          <dd className="text-body">
            {user.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" })}
          </dd>
        </div>
      </dl>
      <h2 className="label mt-12 text-muted">Orders</h2>
      {paidOrders.length === 0 ? (
        <p className="caption mt-3">No orders yet.</p>
      ) : (
        <ul className="mt-3 border-t">
          {paidOrders.map((order) => (
            <li key={order.id} className="border-b">
              <Link href={`/orders/${order.id}`} className="flex justify-between gap-4 py-4 text-body hover:underline">
                <span>
                  #{order.number}
                  <span className="caption ml-3">
                    {order.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                  </span>
                </span>
                <span>{formatPrice(order.subtotalCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <SignOutButton />
      </div>
    </>
  );
}
