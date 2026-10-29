import type { MetadataRoute } from "next";

import { getCollectionSlugs, getProductSitemapEntries } from "@/lib/catalog";
import { journalArticles } from "@/lib/journal-data";
import { siteUrl } from "@/lib/site";

// Public, indexable pages only (account, cart, checkout, admin and search are excluded).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [collections, products] = await Promise.all([getCollectionSlugs(), getProductSitemapEntries()]);

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...collections.map((slug) => ({
      url: `${base}/collections/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${base}/journal`, changeFrequency: "weekly", priority: 0.5 },
    ...journalArticles.map((article) => ({
      url: `${base}/journal/${article.slug}`,
      lastModified: new Date(`${article.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
