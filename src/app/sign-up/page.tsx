import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";
import { AuthGate } from "@/components/auth-gate";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/auth-shared";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-md">
        <h1 className="heading">Create account</h1>
        <p className="caption mt-2">Save your details for a faster checkout.</p>
        <div className="mt-8">
          <Suspense fallback={<AuthForm mode="sign-up" next={DEFAULT_AFTER_SIGN_IN} />}>
            <AuthGate mode="sign-up" searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
