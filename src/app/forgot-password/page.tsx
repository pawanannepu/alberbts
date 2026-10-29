import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="page-narrow section">
      <div className="mx-auto max-w-md">
        <h1 className="heading">Forgot your password?</h1>
        <p className="caption mt-2">Enter your email and we&apos;ll send you a link to choose a new one.</p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="caption mt-5 text-center">
          <Link href="/sign-in" className="tap underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
