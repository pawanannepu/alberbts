import Stripe from "stripe";

// Stripe Checkout (hosted) is used for payment. Card details never touch our server.

let client: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return (client ??= new Stripe(key));
}

// Stripe requires a Checkout session to live at least 30 minutes. Keep this below ORDER_HOLD_MINUTES.
export const CHECKOUT_SESSION_MINUTES = 31;

// Countries we ship to (ISO 3166-1 alpha-2).
export const SHIPPING_COUNTRIES = ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "IN"] as const;

// Absolute site origin for Stripe return URLs. Same value Better Auth uses.
export function siteUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
