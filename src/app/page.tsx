import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { Rail } from "@/components/rail";
import { getFeaturedProducts, getNewArrivals } from "@/lib/catalog";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { collections, editorial, hero, services } from "@/lib/store-data";

export const metadata: Metadata = pageMetadata({
  title: "Alberbts | Considered essentials and statement pieces",
  absoluteTitle: true,
  path: "/",
  image: { src: hero.image, alt: hero.alt },
});

export default async function Home() {
  const [featured, newArrivals] = await Promise.all([getFeaturedProducts(8), getNewArrivals(6)]);

  return (
    <main>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      {/* Hero: full-bleed editorial image with text anchored bottom-left */}
      <section className="relative h-[calc(100svh-var(--header-h))] max-h-[60rem] min-h-[30rem] bg-surface text-paper">
        <Image
          src={hero.image}
          alt={hero.alt}
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
        <div className="page absolute inset-x-0 bottom-0 pb-10 md:pb-16">
          <p className="label">Autumn / Winter 2026</p>
          <h1 className="display mt-3 max-w-[14ch]">Considered pieces for colder days</h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/collections/new-in" className="btn btn-secondary">
              Shop new in
            </Link>
            <Link href="/collections/women" className="btn btn-text text-paper hover:text-paper/70">
              Explore women
            </Link>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="section">
        <div className="page-narrow text-center">
          <p className="label text-muted">The Edit</p>
          <h2 className="heading mt-4">Quiet tailoring, soft textures and a palette made for layering.</h2>
          <Link href="/collections/new-in" className="link mt-8 inline-block label">
            Discover the collection
          </Link>
        </div>
      </section>

      {/* Featured collections */}
      <section className="page pb-(--spacing-section)">
        <div className="grid gap-2 sm:grid-cols-2 md:gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="media media-product relative text-paper"
            >
              <Image
                src={collection.image}
                alt={collection.alt}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                <h2 className="heading">{collection.title}</h2>
                <span className="label mt-3 inline-block underline underline-offset-4">
                  Shop {collection.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="page pb-(--spacing-section)">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="heading">Featured</h2>
          <Link href="/collections/all" className="link label">
            View all
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      {/* Editorial split */}
      <section className="bg-surface">
        <div className="page grid items-center gap-8 py-10 md:grid-cols-2 md:gap-16 md:py-0">
          <div className="media aspect-[4/5] bg-line md:-my-0 md:aspect-auto md:h-[44rem]">
            <Image
              src={editorial.image}
              alt={editorial.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
          <div className="max-w-md md:py-16">
            <p className="label text-muted">Journal</p>
            <h2 className="heading mt-4">Layering, explained</h2>
            <p className="lead mt-4 text-muted">
              Start with soft knits, add a structured outer layer and finish with one considered
              accessory. Our stylists share how to build a wardrobe that works from morning to
              evening.
            </p>
            <Link href="/journal/layering-explained" className="btn btn-primary mt-8">
              Read the story
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals rail */}
      <section className="section overflow-hidden">
        <div className="page">
          <Rail
            title="New arrivals"
            action={
              <Link href="/collections/new-in" className="link label">
                Shop all new
              </Link>
            }
          >
            {newArrivals.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 42vw, 68vw"
              />
            ))}
          </Rail>
        </div>
      </section>

      {/* Services */}
      <section className="border-t">
        <div className="page grid grid-cols-2 gap-x-4 gap-y-10 py-12 lg:grid-cols-4">
          {services.map((service) => (
            <div key={service.title}>
              <h3 className="label">{service.title}</h3>
              <p className="caption mt-3 max-w-[30ch]">{service.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
