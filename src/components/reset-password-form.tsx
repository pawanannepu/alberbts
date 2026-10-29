"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-shared";

export function ResetPasswordForm({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = String(new FormData(event.currentTarget).get("password"));
    setError(null);
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) return setError(error.message ?? "Something went wrong. Please request a new link.");
    setDone(true);
  }

  if (done) {
    return (
      <div role="status">
        <p className="lead">Password updated</p>
        <p className="caption mt-2">You can now sign in with your new password.</p>
        <Link href="/sign-in" className="btn btn-primary mt-8">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className="field"
        />
        <p className="caption text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
      </div>
      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {error}
      </p>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Please wait…" : "Update password"}
      </button>
    </form>
  );
}
