import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { DragRow, Rail } from "@/components/rail";
import { StockStatus } from "@/components/stock-status";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/lib/catalog";
import { formatPrice, getStockState } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";
import { services } from "@/lib/store-data";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return pageMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${product.slug}`,
    image: product.gallery[0],
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const soldOut = getStockState(product.stock) === "out-of-stock";
  const related = await getRelatedProducts(product.slug, product.categoryId);

  return (
    <main>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: product.category.name, path: `/collections/${product.category.slug}` },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
      <nav aria-label="Breadcrumb" className="page caption flex gap-2 pt-6 pb-4">
        <Link href="/" className="tap hover:underline">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/collections/${product.category.slug}`}
          className="tap hover:underline"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="page items-start pb-(--spacing-section) lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_30rem]">
        <DragRow className="gallery">
          {product.gallery.map((image, i) => (
            <div key={image.src} className="media media-product">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={i === 0 ? "(min-width: 1024px) 60vw, 88vw" : "(min-width: 1024px) 30vw, 88vw"}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            </div>
          ))}
        </DragRow>

        <section
          aria-labelledby="product-title"
          className="pt-8 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:pt-0"
        >
          <p className="label text-muted">{product.category.name}</p>
          <h1 id="product-title" className="heading mt-3">
            {product.name}
          </h1>
          <p className="title mt-4">{formatPrice(product.priceCents)}</p>
          <div className="mt-4">
            <StockStatus stock={product.stock} />
          </div>

          <div className="mt-8">
            <AddToCartButton slug={product.slug} soldOut={soldOut} />
          </div>

          <p className="lead mt-8 text-muted">{product.description}</p>

          <div className="mt-8">
            <details className="disclosure" open>
              <summary>
                Details
              </summary>
              <div>
                <ul className="flex list-disc flex-col gap-2 pl-4">
                  {product.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </details>
            <details className="disclosure">
              <summary>
                Shipping &amp; returns
              </summary>
              <div>
                <ul className="flex flex-col gap-2">
                  {services.slice(0, 2).map((service) => (
                    <li key={service.title}>
                      {service.title}: {service.text}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </section>
      </div>

      <section className="section overflow-hidden border-t">
        <div className="page">
          <Rail title="You may also like">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 42vw, 68vw"
              />
            ))}
          </Rail>
        </div>
      </section>
    </main>
  );
}
