import type { Metadata } from "next";

import type { Product } from "@/lib/catalog";
import { getStockState } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// Next replaces (not merges) nested metadata like openGraph, so pages build theirs through this
// helper to keep siteName, canonical URL and the social image consistent.

const clip = (text: string, max = 160) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

// Social previews want roughly 1200x630. Unsplash can crop to that on request.
export function ogImage(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname !== "images.unsplash.com") return url;
    u.searchParams.set("w", "1200");
    u.searchParams.set("h", "630");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return url;
  }
}

export function pageMetadata(input: {
  title: string;
  description?: string;
  path: string; // canonical path, e.g. "/products/halo-diamond-ring" (no query string)
  image?: { src: string; alt: string };
  type?: "website" | "article";
  publishedTime?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const description = clip(input.description ?? SITE_DESCRIPTION);
  const images = input.image ? [{ url: ogImage(input.image.src), width: 1200, height: 630, alt: input.image.alt }] : undefined;
  const fullTitle = input.absoluteTitle ? input.title : `${input.title} | ${SITE_NAME}`;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: input.path,
      title: fullTitle,
      description,
      ...(input.type === "article" && input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(images ? { images } : {}),
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: fullTitle, description, ...(images ? { images: [images[0].url] } : {}) },
  };
}

const abs = (path: string) => `${siteUrl()}${path}`;

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: siteUrl(),
  description: SITE_DESCRIPTION,
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: siteUrl(),
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

const availability = {
  "in-stock": "https://schema.org/InStock",
  "low-stock": "https://schema.org/LimitedAvailability",
  "out-of-stock": "https://schema.org/OutOfStock",
} as const;

export const productJsonLd = (product: Product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  sku: product.slug,
  category: product.category.name,
  brand: { "@type": "Brand", name: SITE_NAME },
  image: product.gallery.map((image) => image.src),
  url: abs(`/products/${product.slug}`),
  offers: {
    "@type": "Offer",
    url: abs(`/products/${product.slug}`),
    priceCurrency: "USD",
    price: (product.priceCents / 100).toFixed(2),
    availability: availability[getStockState(product.stock)],
    itemCondition: "https://schema.org/NewCondition",
  },
});

export const breadcrumbJsonLd = (crumbs: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.name,
    item: abs(crumb.path),
  })),
});

export const articleJsonLd = (article: { slug: string; title: string; excerpt: string; date: string; image: { src: string } }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.excerpt,
  datePublished: article.date,
  image: [article.image.src],
  mainEntityOfPage: abs(`/journal/${article.slug}`),
  author: { "@type": "Organization", name: SITE_NAME },
  publisher: { "@type": "Organization", name: SITE_NAME },
});
