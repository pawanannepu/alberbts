# alberbts

Next.js (App Router) + TypeScript + Tailwind CSS + Better Auth + Drizzle ORM + Postgres on Neon.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

## Structure

- `src/db/` – Drizzle client (`index.ts`), tables (`schema/`), and demo seed (`seed.ts`)
- `src/lib/catalog.ts` – cached product queries used by the storefront
- `src/lib/auth.ts` – Better Auth server instance (Drizzle adapter, email/password enabled)
- `src/lib/auth-client.ts` – Better Auth React client
- `src/app/api/auth/[...all]/route.ts` – Better Auth route handler
- `drizzle.config.ts` – drizzle-kit config (reads `DATABASE_URL` from `.env.local`)

## Scripts

`dev`, `build`, `start`, `lint`, `typecheck`, `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`

## Next steps

Better Auth needs its tables (`user`, `session`, `account`, `verification`) before sign-in works:
run `npx auth generate` to produce the Drizzle schema, add it to `src/db/schema/`
(and pass `schema` to `drizzleAdapter` if needed), then `npm run db:push`.
