import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-narrow section text-center">
      <p className="label text-muted">404</p>
      <h1 className="heading mt-4">We couldn&apos;t find that page</h1>
      <Link href="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </main>
  );
}
