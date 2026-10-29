"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-shared";

type Props = { mode: "sign-in" | "sign-up"; next: string };

export function AuthForm({ mode, next }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signUp = mode === "sign-up";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    setError(null);
    setPending(true);
    const { error } = signUp
      ? await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password })
      : await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setPending(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const otherHref = `${signUp ? "/sign-in" : "/sign-up"}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;

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

      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {error}
      </p>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Please wait…" : signUp ? "Create account" : "Sign in"}
      </button>

      <p className="caption text-center">
        {signUp ? "Already have an account? " : "New to Alberbts? "}
        <Link href={otherHref} className="underline underline-offset-4">
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
