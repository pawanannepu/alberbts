# alberbts

eCommerce app. Next.js (App Router, `src/`) · TypeScript · Tailwind v4 · Better Auth · Drizzle ORM · Postgres on Neon. Package manager: npm.

## Layout

- `src/db/index.ts` – Drizzle client (Neon HTTP driver); `src/db/schema/` – tables (`auth.ts`: Better Auth user/session/account/verification, generated; `catalog.ts`: categories, products (with `audience`: women/men/unisex), product_images, inventory; `cart.ts`: carts, cart_items; `orders.ts`: orders, order_items)
- `src/lib/catalog.ts` – cached product + collection queries (`use cache`, tag `products`); the only place pages read products from
- `src/app/collections/[slug]` – collection pages: every category, plus `all`, `new-in`, `women`, `men` (defined in `catalog.ts`); `?sort=` via links
- `src/lib/format.ts` – `formatPrice` (cents → USD), `getStockState`; DB-free, safe anywhere
- `src/lib/store-data.ts` – static site content only (nav, hero, collection tiles, footer)
- `src/db/seed.ts` + `seed-data.ts` – demo catalog (`npm run db:seed`, idempotent, resets demo stock)
- `src/lib/auth.ts` – Better Auth server (email + password); `src/lib/auth-client.ts` – React client; `src/lib/auth-shared.ts` – client-safe constants + `safeNext`; `src/lib/session.ts` – `getSession()` (needs `<Suspense>`)
- `src/app/sign-in`, `sign-up`, `account` – auth pages; forms are client components (`auth-form.tsx`, `sign-out-button.tsx`); `account` redirects to `/sign-in?next=` when signed out
- `src/lib/cart.ts` – cart reads (`getCart`, `getCartCount`, `findCartId`); uncached, needs `<Suspense>`. `src/app/cart/actions.ts` – Server Actions (add / set quantity / remove / `mergeGuestCart`); `src/app/cart/page.tsx` – bag page
- `src/lib/orders.ts` – order lifecycle: `createOrder` (cart → pending order, holds stock), `cancelOrder`, `releaseExpiredOrders`, `markOrderPaid`; no request context, so webhooks/scripts can call it
- `src/lib/stripe.ts` (client, shipping countries, `siteUrl`), `src/lib/checkout.ts` (`fulfillCheckoutSession`, idempotent) – Stripe-hosted Checkout. Flow: cart `startCheckout` action (`src/app/checkout/actions.ts`) → pending order + Stripe session → pay → `/checkout/return` route confirms with Stripe and marks paid → `/orders/[id]`. `src/app/api/stripe/webhook` does the same server-to-server (needs `STRIPE_WEBHOOK_SECRET`)
- `src/app/api/auth/[...all]/route.ts` – Better Auth handler
- `drizzle.config.ts` – drizzle-kit; migrations go to `drizzle/`

## Commands

- `npm run dev` / `build` / `lint` / `typecheck`
- `npm run db:generate` · `db:migrate` · `db:push` · `db:studio` · `db:seed`

## Conventions

- Env vars: see `.env.example`; real values live in `.env.local` (never commit). Add new vars to the example.
- Import via `@/*`. Server-only code (db, auth) must not be imported from client components; use `authClient` there.
- Schema changes: edit `src/db/schema/`, then `db:generate` + `db:migrate` (or `db:push` in dev only). Commit the generated `drizzle/` files.
- Prices are integer cents. Stock lives in `inventory`; low-stock threshold is `LOW_STOCK_THRESHOLD` in `format.ts`.
- Product reads are cached for ~1 min. After any write that changes products or stock, call `updateTag("products")` (Server Action) or `revalidateTag`.
- `next build` queries the database (`generateStaticParams`), so it needs `DATABASE_URL` and a seeded DB.
- Carts live in Postgres: signed-in users have one cart (`carts.user_id`), guests are found via the httpOnly `cart` cookie. `mergeGuestCart()` runs after sign-in/up. Quantities are capped by `maxQuantity(stock)`; totals use live DB prices. Stale guest carts aren't purged yet.
- Stock is held when an order is created (pending, 30 min) and returned on cancel/expiry. Oversell is blocked by `inventory.quantity >= 0` plus `db.batch()` (one transaction); never decrement stock outside `orders.ts`. A payment for an already-cancelled order must be refunded. Nothing sweeps expired holds yet: call `releaseExpiredOrders()` on a schedule.
- Payment: only ever mark orders paid via `fulfillCheckoutSession` (it verifies the amount and refunds if the hold was already released). Use `sk_test_` keys until launch. `ORDER_HOLD_MINUTES` (35) must stay above `CHECKOUT_SESSION_MINUTES` (31). `BETTER_AUTH_URL` doubles as the site origin for Stripe return URLs.
- Auth tables come from `npx auth@latest generate --output src/db/schema/auth.ts` (load `.env.local` first); don't hand-write them. Re-run after adding Better Auth plugins, then `db:generate` + `db:migrate`.
- `BETTER_AUTH_URL` must match the origin you browse (Better Auth rejects other origins with "Invalid origin"). Always pass `?next=` through `safeNext`.
- Run `npm run typecheck && npm run lint` before finishing a change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
