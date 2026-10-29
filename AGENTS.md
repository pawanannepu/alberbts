# alberbts

eCommerce app. Next.js (App Router, `src/`) · TypeScript · Tailwind v4 · Better Auth · Drizzle ORM · Postgres on Neon. Package manager: npm.

## Layout

- `src/db/index.ts` – Drizzle client (Neon HTTP driver); `src/db/schema/` – tables (`auth.ts`: Better Auth user/session/account/verification, generated; `catalog.ts`: categories, products (with `audience`: women/men/unisex), product_images, inventory)
- `src/lib/catalog.ts` – cached product + collection queries (`use cache`, tag `products`); the only place pages read products from
- `src/app/collections/[slug]` – collection pages: every category, plus `all`, `new-in`, `women`, `men` (defined in `catalog.ts`); `?sort=` via links
- `src/lib/format.ts` – `formatPrice` (cents → USD), `getStockState`; DB-free, safe anywhere
- `src/lib/store-data.ts` – static site content only (nav, hero, collection tiles, footer)
- `src/db/seed.ts` + `seed-data.ts` – demo catalog (`npm run db:seed`, idempotent, resets demo stock)
- `src/lib/auth.ts` – Better Auth server (email + password); `src/lib/auth-client.ts` – React client; `src/lib/auth-shared.ts` – client-safe constants + `safeNext`; `src/lib/session.ts` – `getSession()` (needs `<Suspense>`)
- `src/app/sign-in`, `sign-up`, `account` – auth pages; forms are client components (`auth-form.tsx`, `sign-out-button.tsx`); `account` redirects to `/sign-in?next=` when signed out
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
- Auth tables come from `npx auth@latest generate --output src/db/schema/auth.ts` (load `.env.local` first); don't hand-write them. Re-run after adding Better Auth plugins, then `db:generate` + `db:migrate`.
- `BETTER_AUTH_URL` must match the origin you browse (Better Auth rejects other origins with "Invalid origin"). Always pass `?next=` through `safeNext`.
- Run `npm run typecheck && npm run lint` before finishing a change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
