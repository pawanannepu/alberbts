import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/product-card";
import { getCategories, SEARCH_MAX_LENGTH, searchProducts } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="page pb-(--spacing-section)">
      <h1 className="heading pt-8">Search</h1>
      <Suspense fallback={<SearchForm query="" />}>
        {searchParams.then(({ q }) => (
          <SearchResults query={(typeof q === "string" ? q : "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH)} />
        ))}
      </Suspense>
    </main>
  );
}

// A plain GET form, so search works without JavaScript and results are shareable links.
function SearchForm({ query }: { query: string }) {
  return (
    <form action="/search" role="search" className="mt-6 flex max-w-xl gap-2">
      <label htmlFor="q" className="sr-only">
        Search products
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder="Search pieces or categories"
        autoComplete="off"
        className="field"
      />
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </form>
  );
}

async function SearchResults({ query }: { query: string }) {
  // Search hits the database on every request, so cap it per visitor.
  const limited = query !== "" && !(await rateLimit("search", 30, 60)).ok;
  const [results, categories] = await Promise.all([
    limited ? Promise.resolve([]) : searchProducts(query),
    getCategories(),
  ]);

  return (
    <>
      <SearchForm query={query} />

      {limited ? (
        <p className="caption mt-8" role="status">
          You&apos;re searching a little fast. Please wait a moment and try again.
        </p>
      ) : query === "" ? (
        <p className="caption mt-8">Search by name, description or category, or browse below.</p>
      ) : (
        <p className="caption mt-8" role="status">
          {results.length === 0
            ? `No pieces match “${query}”.`
            : `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`}
        </p>
      )}

      {results.length > 0 ? (
        <div className="product-grid mt-6">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <h2 className="label text-muted">Browse</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <li>
              <Link href="/collections/all" className="link">
                Shop all
              </Link>
            </li>
            <li>
              <Link href="/collections/new-in" className="link">
                New in
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/collections/${category.slug}`} className="link">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
