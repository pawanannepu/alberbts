import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductCard } from "@/components/product-card";
import { pageMetadata } from "@/lib/seo";
import {
  getCollection,
  getCollectionSlugs,
  parseSort,
  SORT_OPTIONS,
  type Product,
  type SortKey,
} from "@/lib/catalog";

type Props = PageProps<"/collections/[slug]">;

export async function generateStaticParams() {
  const slugs = await getCollectionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return pageMetadata({
    title: collection.title,
    description: `Shop ${collection.title.toLowerCase()} at Alberbts: ${collection.products.length} pieces, delivered with complimentary shipping.`,
    path: `/collections/${slug}`, // canonical ignores ?sort=
    image: collection.products[0]?.gallery[0],
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const count = collection.products.length;

  return (
    <main>
      <nav aria-label="Breadcrumb" className="page caption flex gap-2 pt-6 pb-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span aria-current="page">{collection.title}</span>
      </nav>

      <header className="page flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-8">
        <div>
          <h1 className="heading">{collection.title}</h1>
          <p className="caption mt-2">
            {count} {count === 1 ? "piece" : "pieces"}
          </p>
        </div>
        {count > 1 && (
          // searchParams is request-time data: reading it behind Suspense keeps the header static.
          <Suspense fallback={<SortLinks slug={slug} active="featured" />}>
            {searchParams.then((query) => (
              <SortLinks slug={slug} active={parseSort(query.sort)} />
            ))}
          </Suspense>
        )}
      </header>

      <section className="page pb-(--spacing-section)">
        {count === 0 ? (
          <div className="py-16 text-center">
            <p className="lead text-muted">Nothing here yet.</p>
            <Link href="/collections/all" className="btn btn-primary mt-8">
              Shop all
            </Link>
          </div>
        ) : (
          <Suspense fallback={<ProductGrid products={collection.products} />}>
            {searchParams.then((query) => (
              <SortedGrid slug={slug} sort={parseSort(query.sort)} />
            ))}
          </Suspense>
        )}
      </section>
    </main>
  );
}

async function SortedGrid({ slug, sort }: { slug: string; sort: SortKey }) {
  const collection = await getCollection(slug, sort);
  if (!collection) notFound();
  return <ProductGrid products={collection.products} />;
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}

function SortLinks({ slug, active }: { slug: string; active: SortKey }) {
  return (
    <nav aria-label="Sort" className="flex flex-wrap gap-x-5 gap-y-2">
      {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
        <Link
          key={key}
          href={key === "featured" ? `/collections/${slug}` : `/collections/${slug}?sort=${key}`}
          aria-current={key === active ? "true" : undefined}
          scroll={false}
          className={`label ${key === active ? "underline underline-offset-4" : "text-muted hover:text-ink"}`}
        >
          {SORT_OPTIONS[key].label}
        </Link>
      ))}
    </nav>
  );
}
