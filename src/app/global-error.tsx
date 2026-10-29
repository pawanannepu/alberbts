"use client";

// Server errors carry a `digest` that matches the server log; client-side throws can be any value.
function errorDigest(error: unknown): string | undefined {
  const digest = typeof error === "object" && error !== null ? (error as { digest?: unknown }).digest : undefined;
  return typeof digest === "string" && digest ? digest : undefined;
}

// Last resort: replaces the whole document when the root layout itself fails, so it can't rely on
// the app's stylesheet or fonts. Styling is inline and mirrors the site's black-on-white look.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = errorDigest(error);
  const button = {
    display: "inline-block",
    padding: "0.875rem 1.75rem",
    border: "1px solid #000",
    background: "#000",
    color: "#fff",
    font: "inherit",
    fontSize: "0.75rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textDecoration: "none",
    cursor: "pointer",
  } as const;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#fff",
          color: "#000",
          fontFamily: "system-ui, -apple-system, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong | Alberbts</title>
        <main style={{ maxWidth: "32rem" }}>
          <p style={{ fontSize: "0.6875rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6f6f6f" }}>
            Something went wrong
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "2rem", margin: "1rem 0" }}>
            We&apos;re having trouble right now
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6f6f6f" }}>Please try again in a moment.</p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" style={button} onClick={() => retry()}>
              Try again
            </button>
            {/* A plain link on purpose: next/link needs the router, which may be what broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, background: "#fff", color: "#000" }}>
              Back to home
            </a>
          </div>
          {digest ? (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#6f6f6f" }}>Reference: {digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
