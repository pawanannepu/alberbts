"use client";

import Link from "next/link";

// Server errors carry a `digest` that matches the server log; client-side throws can be any value.
function errorDigest(error: unknown): string | undefined {
  const digest = typeof error === "object" && error !== null ? (error as { digest?: unknown }).digest : undefined;
  return typeof digest === "string" && digest ? digest : undefined;
}

// Catches errors thrown while rendering any page below the root layout (the header and footer
// stay up). Server errors arrive with a generic message and a `digest` that matches the server log.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = errorDigest(error);

  return (
    <main className="page-narrow section text-center">
      <p className="label text-muted">Something went wrong</p>
      <h1 className="heading mt-4">We couldn&apos;t load this page</h1>
      <p className="caption mt-3">It&apos;s on our side. Please try again, or head back to the shop.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
      {digest ? <p className="caption mt-8 text-muted">Reference: {digest}</p> : null}
    </main>
  );
}
