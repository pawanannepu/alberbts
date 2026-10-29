import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
      <div className="mt-8">
        <SignOutButton />
      </div>
    </>
  );
}
