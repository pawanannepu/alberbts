"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { mergeGuestCart } from "@/app/cart/actions";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-shared";

type Props = { mode: "sign-in" | "sign-up"; next: string };

export function AuthForm({ mode, next }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);
  const signUp = mode === "sign-up";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    setError(null);
    setPending(true);
    // Absolute URL: where the verification link lands the shopper after confirming.
    const callbackURL = new URL(next, window.location.origin).toString();
    const { data, error } = signUp
      ? await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password, callbackURL })
      : await authClient.signIn.email({ email, password, callbackURL });

    if (error) {
      setError(
        error.status === 403
          ? "Please verify your email first. We've just sent you a new verification link."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      setPending(false);
      return;
    }
    // No session yet means the account needs its email verified before sign-in.
    if (signUp && data && !data.token) {
      setCheckEmail(email);
      return;
    }
    await mergeGuestCart();
    router.push(next);
    router.refresh();
  }

  const otherHref = `${signUp ? "/sign-in" : "/sign-up"}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;

  if (checkEmail) {
    return (
      <div role="status">
        <p className="lead">Check your inbox</p>
        <p className="caption mt-2">
          We&apos;ve sent a verification link to {checkEmail}. Open it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {signUp && (
        <Field label="Name" name="name" type="text" autoComplete="name" required />
      )}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={signUp ? "new-password" : "current-password"}
        minLength={signUp ? MIN_PASSWORD_LENGTH : undefined}
        hint={signUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        required
      />
      {!signUp && (
        <Link href="/forgot-password" className="tap caption -mt-2 self-start underline underline-offset-4">
          Forgot your password?
        </Link>
      )}

      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {error}
      </p>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Please wait…" : signUp ? "Create account" : "Sign in"}
      </button>

      <p className="caption text-center">
        {signUp ? "Already have an account? " : "New to Alberbts? "}
        <Link href={otherHref} className="tap underline underline-offset-4">
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
};

function Field({ label, name, hint, ...input }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className="field" {...input} />
      {hint && <p className="caption text-muted">{hint}</p>}
    </div>
  );
}
