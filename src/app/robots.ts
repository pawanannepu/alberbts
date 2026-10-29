import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

// Keep crawlers out of private, per-user and utility pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/account",
        "/cart",
        "/checkout",
        "/orders",
        "/search",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
