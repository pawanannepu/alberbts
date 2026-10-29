# alberbts

eCommerce app. Next.js (App Router, `src/`) · TypeScript · Tailwind v4 · Better Auth · Drizzle ORM · Postgres on Neon. Package manager: npm.

## Layout

- `src/db/index.ts` – Drizzle client (Neon HTTP driver); `src/db/schema.ts` – all tables
- `src/lib/auth.ts` – Better Auth server; `src/lib/auth-client.ts` – React client
- `src/app/api/auth/[...all]/route.ts` – Better Auth handler
- `drizzle.config.ts` – drizzle-kit; migrations go to `drizzle/`

## Commands

- `npm run dev` / `build` / `lint` / `typecheck`
- `npm run db:generate` · `db:migrate` · `db:push` · `db:studio`

## Conventions

- Env vars: see `.env.example`; real values live in `.env.local` (never commit). Add new vars to the example.
- Import via `@/*`. Server-only code (db, auth) must not be imported from client components; use `authClient` there.
- Schema changes: edit `src/db/schema.ts`, then `db:generate` + `db:migrate` (or `db:push` in dev only).
- Auth tables come from `npx auth generate`; don't hand-write them.
- Run `npm run typecheck && npm run lint` before finishing a change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
