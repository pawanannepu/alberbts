"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setError(null);
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: new URL("/reset-password", window.location.origin).toString(),
    });
    setPending(false);
    if (error) return setError(error.message ?? "Something went wrong. Please try again.");
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div role="status">
        <p className="lead">Check your inbox</p>
        <p className="caption mt-2">
          If an account exists for {sentTo}, we&apos;ve sent a link to reset the password. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {error}
      </p>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Please wait…" : "Send reset link"}
      </button>
    </form>
  );
}
