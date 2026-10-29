export const SITE_NAME = "Alberbts";
export const SITE_DESCRIPTION =
  "Considered essentials and statement pieces, made to last. Shop eyewear, bags, knitwear, tailoring and fine jewelry.";

// Absolute site origin (no trailing slash). The same value Better Auth uses; set it to your real
// https domain in production. Used for Stripe return URLs, email links, canonical URLs and the sitemap.
export function siteUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
