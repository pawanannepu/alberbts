# alberbts

eCommerce app. Next.js (App Router, `src/`) · TypeScript · Tailwind v4 · Better Auth · Drizzle ORM · Postgres on Neon. Package manager: npm.

## Layout

- `src/db/index.ts` – Drizzle client (Neon HTTP driver); `src/db/schema/` – tables (`auth.ts`: Better Auth user/session/account/verification, generated; `catalog.ts`: categories, products (with `audience`: women/men/unisex), product_images, inventory; `cart.ts`: carts, cart_items; `orders.ts`: orders, order_items)
- `src/lib/catalog.ts` – cached product + collection queries (`use cache`, tag `products`); the only place pages read products from
- `src/app/collections/[slug]` – collection pages: every category, plus `all`, `new-in`, `women`, `men` (defined in `catalog.ts`); `?sort=` via links
- `src/lib/format.ts` – `formatPrice` (cents → USD), `getStockState`; DB-free, safe anywhere
- `src/lib/store-data.ts` – static site content only (nav, hero, collection tiles, footer)
- `src/app/sitemap.ts` / `robots.ts`, `src/lib/seo.ts` (`pageMetadata` for canonical/OpenGraph, JSON-LD builders), `src/lib/site.ts` (`siteUrl`), `src/components/json-ld.tsx`; `src/lib/rate-limit.ts` (`rateLimit(scope, limit, windowSec, identity?)`, Postgres `throttles` table)
- `src/app/search` (GET form, `searchProducts` in `catalog.ts`: uncached, all words must match name/description/category, whole-word name hits rank first); `src/app/journal` + `src/lib/journal-data.ts` – static editorial articles (demo copy)
- `src/db/seed.ts` + `seed-data.ts` – demo catalog: 36 products, 9 categories (`npm run db:seed`, idempotent, resets demo stock). Images are Unsplash photos; for wide photos set `main: [fx, fy, zoom]` to focal-crop the cover around the product, and keep brand marks/logos out of frame
- `src/lib/auth.ts` – Better Auth server (email + password, email verification, password reset); `src/lib/auth-client.ts` – React client; `src/lib/auth-shared.ts` – client-safe constants + `safeNext`; `src/lib/session.ts` – `getSession()` (needs `<Suspense>`)
- `src/app/sign-in`, `sign-up`, `forgot-password`, `reset-password`, `account` – auth pages; forms are client components (`auth-form.tsx`, `sign-out-button.tsx`); `account` redirects to `/sign-in?next=` when signed out
- `src/lib/cart.ts` – cart reads (`getCart`, `getCartCount`, `findCartId`); uncached, needs `<Suspense>`. `src/app/cart/actions.ts` – Server Actions (add / set quantity / remove / `mergeGuestCart`); `src/app/cart/page.tsx` – bag page
- `src/lib/orders.ts` – order lifecycle: `createOrder` (cart → pending order, holds stock), `cancelOrder`, `releaseExpiredOrders`, `markOrderPaid`; no request context, so webhooks/scripts can call it
- `src/lib/stripe.ts` (client, shipping countries, `siteUrl`), `src/lib/checkout.ts` (`fulfillCheckoutSession`, idempotent) – Stripe-hosted Checkout. Flow: cart `startCheckout` action (`src/app/checkout/actions.ts`) → pending order + Stripe session → pay → `/checkout/return` route confirms with Stripe and marks paid → `/orders/[id]`. `src/app/api/stripe/webhook` does the same server-to-server (needs `STRIPE_WEBHOOK_SECRET`)
- `src/lib/email.ts` (Resend sender), `email-templates.ts` (verify / reset / order HTML+text), `order-emails.ts` (`sendOrderConfirmation`, sent at most once via `orders.confirmation_sent_at`)
- `src/app/admin/**` – admin (products, categories, orders; stock editing). `src/lib/admin.ts` `requireAdmin()` (non-admins get 404); DB writes live in `src/lib/admin-products.ts`, form validation in `src/lib/product-input.ts`, reads in `src/lib/admin-data.ts`
- `src/app/api/auth/[...all]/route.ts` – Better Auth handler
- `src/app/error.tsx` (page errors, inside the layout) · `src/app/global-error.tsx` (root layout failures; own `<html>`, inline styles). This Next version passes `retry`, not `reset`, to error components
- `src/lib/maintenance.ts` – `runMaintenance()`: releases expired order holds, purges guest carts older than 30 days, old `throttles` / `rate_limit` rows, expired sessions and verifications. `src/app/api/maintenance/route.ts` exposes it; `vercel.json` runs it daily via Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET` (without `CRON_SECRET` the route refuses to run)
- `tests/unit` (pure, no DB; run in CI) · `tests/db` (real DB, opt-in, cleans up after itself) · `tests/smoke` (HTTP against a running production server). `.github/workflows/ci.yml` runs lint, typecheck, unit tests, `npm audit`, and a build when a `DATABASE_URL` secret exists
- `drizzle.config.ts` – drizzle-kit; migrations go to `drizzle/`

## Commands

- `npm run dev` / `build` / `lint` / `typecheck`
- `npm test` (unit) · `npm run test:db` (needs `.env.local`; sets `RUN_DB_TESTS=1`) · `SMOKE_URL=http://localhost:3100 npm run test:smoke` (server started with `BETTER_AUTH_URL` = that origin, `CRON_SECRET=smoke-cron-secret`, `STRIPE_WEBHOOK_SECRET=<any>`)
- `npm run db:generate` · `db:migrate` · `db:push` · `db:studio` · `db:seed` · `db:admin -- <email> [admin|user]`

## Conventions

- Env vars: see `.env.example`; real values live in `.env.local` (never commit). Add new vars to the example. `CRON_SECRET` (any long random string) is required in production for `/api/maintenance`.
- Import via `@/*`. Server-only code (db, auth) must not be imported from client components; use `authClient` there.
- Schema changes: edit `src/db/schema/`, then `db:generate` + `db:migrate` (or `db:push` in dev only). Commit the generated `drizzle/` files.
- Prices are integer cents. Stock lives in `inventory`; low-stock threshold is `LOW_STOCK_THRESHOLD` in `format.ts`.
- Product reads are cached for ~1 min. After any write that changes products or stock, call `updateTag("products")` (Server Action) or `revalidateTag`.
- `next build` queries the database (`generateStaticParams`), so it needs `DATABASE_URL` and a seeded DB.
- Carts live in Postgres: signed-in users have one cart (`carts.user_id`), guests are found via the httpOnly `cart` cookie. `mergeGuestCart()` runs after sign-in/up. Quantities are capped by `maxQuantity(stock)`; totals use live DB prices. Stale guest carts are purged by `runMaintenance()`.
- Stock is held when an order is created (pending, 35 min) and returned on cancel/expiry. Oversell is blocked by `inventory.quantity >= 0` plus `db.batch()` (one transaction); never decrement stock outside `orders.ts`. A payment for an already-cancelled order must be refunded. Expired holds are released by the daily maintenance cron (and by Stripe's `checkout.session.expired` webhook once configured); `createOrder` also releases any expired hold.
- Payment: only ever mark orders paid via `fulfillCheckoutSession` (it verifies the amount and refunds if the hold was already released). Use `sk_test_` keys until launch. `ORDER_HOLD_MINUTES` (35) must stay above `CHECKOUT_SESSION_MINUTES` (31). `BETTER_AUTH_URL` doubles as the site origin for Stripe return URLs.
- Email: needs `RESEND_API_KEY`. `EMAIL_FROM` ("Name <addr@verified-domain>") is optional until you verify a domain in Resend; setting it also makes sign-in require a verified email. Without it the sandbox sender only reaches your own Resend account email. `EMAIL_DRY_RUN=1` prints emails to the server log instead of sending. Test addresses: `delivered+anything@resend.dev`.
- In Drizzle relational queries (`db.query.*`), raw `sql` subqueries must use unqualified column names: qualified ones get re-aliased to the outer table.
- SEO: new public pages need `pageMetadata({ path })` (child `openGraph` replaces the layout's, so always go through it), an entry in `sitemap.ts`, and JSON-LD where it fits; private pages get `robots: { index: false }` and a `Disallow` in `robots.ts`.
- Security: `next.config.ts` sets the headers and a static CSP (production only; `'unsafe-inline'` scripts because a nonce CSP would force dynamic rendering). New third-party origins (scripts, images, frames, form targets) must be added to that CSP. Rate limits: auth endpoints via Better Auth (`rateLimit` in `auth.ts`, DB storage); everything else via `rateLimit()`. `x-forwarded-for` is only trustworthy behind a proxy that overwrites it. Set `BETTER_AUTH_URL` to the real https domain in production (secure cookies, canonical URLs, sitemap).
- Admin: role lives on `user.role` (Better Auth admin plugin). Grant it with `npm run db:admin -- <email>`, never from the UI. Every admin page's data component AND every admin Server Action must call `requireAdmin()` (layout checks don't re-run on client navigation) and keep page content inside the guarded component. Admin writes call `updateTag("products")`. Product images must come from `IMAGE_HOSTS` (`src/lib/image-hosts.ts`, also feeds `next.config.ts`); add a host there before using it.
- Auth tables come from `npx auth@latest generate --output src/db/schema/auth.ts` (load `.env.local` first); don't hand-write them. Re-run after adding Better Auth plugins, then `db:generate` + `db:migrate`.
- `BETTER_AUTH_URL` must match the origin you browse (Better Auth rejects other origins with "Invalid origin"). Always pass `?next=` through `safeNext` (it rejects control characters and backslashes because browsers turn `/<TAB>/evil.com` into `//evil.com`). Validate user-supplied keys with `Object.hasOwn`, not `in`.
- Run `npm run typecheck && npm run lint` before finishing a change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
