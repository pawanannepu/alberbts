import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-md">
        <h1 className="heading">Choose a new password</h1>
        <div className="mt-8">
          <Suspense fallback={null}>
            {searchParams.then(({ token, error }) =>
              typeof token === "string" && token && !error ? (
                <ResetPasswordForm token={token} />
              ) : (
                <div role="alert">
                  <p className="lead">This link is invalid or has expired</p>
                  <Link href="/forgot-password" className="btn btn-primary mt-8">
                    Request a new link
                  </Link>
                </div>
              ),
            )}
          </Suspense>
        </div>
      </div>
    </main>
  );
}
