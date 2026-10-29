import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";
import { AuthGate } from "@/components/auth-gate";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/auth-shared";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-md">
        <h1 className="heading">Sign in</h1>
        <p className="caption mt-2">Welcome back. Sign in to view your account.</p>
        <div className="mt-8">
          <Suspense fallback={<AuthForm mode="sign-in" next={DEFAULT_AFTER_SIGN_IN} />}>
            <AuthGate mode="sign-in" searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
