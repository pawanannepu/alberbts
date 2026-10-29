<p align="center">
  <img src="src/app/icon.svg" alt="Alberbts logo" width="72" height="72">
</p>

<h1 align="center">Alberbts</h1>

<p align="center">
  A demo online store for a fashion label, built with Next.js, Stripe and Postgres.
</p>

<p align="center">
  <a href="https://alberbts.vercel.app">Live demo</a> ·
  <a href="#demo-video">Demo video</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#deployment">Deployment</a>
</p>

---

Alberbts lets shoppers browse and search a catalog, fill a bag, pay through Stripe and get an order confirmation by email. An admin area manages products, categories and stock.

> **Note:** this is a demo project. The 36 products, their Unsplash photos and the journal articles are sample content.

## Demo video

A 30-second walkthrough of the live site: the home page, a collection with sorting and stock badges, and the sign-in page.

[![Watch the demo video](media/demo.mp4)]

*Click the image to play the video.*

## Features

- **Catalog:** 36 products in 9 categories, collection pages (all, new in, women, men and one per category) with sorting, and whole-word search.
- **Bag and checkout:** guest bags that merge into the account on sign-in, quantities capped by stock, and Stripe-hosted checkout (test mode).
- **Safe stock handling:** stock is held for 35 minutes when an order starts and returned if it is cancelled or expires. The database refuses to oversell, even when two shoppers race for the last item.
- **Accounts:** email and password sign-in with email verification and password reset (Better Auth), plus an account page with order history.
- **Email:** verification, password reset and order confirmation through Resend. Each order is confirmed once.
- **Admin:** products, categories, stock and orders, available only to users with the admin role.
- **Journal:** static editorial articles.
- **SEO and security:** sitemap, robots, canonical URLs, structured data, a strict Content Security Policy, HSTS, rate limiting and a daily maintenance job.
- **Responsive design:** works from 320px phones to wide monitors. Product rows swipe on touch screens and have arrows and click-and-drag with a mouse.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Better Auth |
| Database | Postgres on Neon, Drizzle ORM |
| Payments and email | Stripe Checkout, Resend |
| Hosting | Vercel, with GitHub Actions for CI/CD |

## Getting started

**Prerequisites**

- Node.js 22 and npm
- A [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) account (test mode is enough)
- A [Resend](https://resend.com) API key (optional while developing, see `EMAIL_DRY_RUN` below)

**Set up and run**

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:migrate           # create the tables
npm run db:seed              # load the demo catalog (safe to run again)
npm run dev                  # http://localhost:3000
```

`next build` queries the database, so migrate and seed it before you build.

### Environment variables

Real values go in `.env.local`, which is never committed.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon connection string |
| `DATABASE_URL_UNPOOLED` | No | Direct connection for migrations, if you have one |
| `BETTER_AUTH_SECRET` | Yes | Secret that signs sessions (32 or more random characters) |
| `BETTER_AUTH_URL` | Yes | The site's own address, e.g. `http://localhost:3000`. In production, use your real `https://` address. |
| `STRIPE_SECRET_KEY` | Yes | Use an `sk_test_` key until you launch |
| `STRIPE_WEBHOOK_SECRET` | In production | Signing secret of your Stripe webhook endpoint |
| `RESEND_API_KEY` | In production | Sends email |
| `EMAIL_FROM` | No | `"Name <addr@your-domain>"`, once a domain is verified in Resend. Setting it also makes sign-in require a verified email. |
| `EMAIL_DRY_RUN` | No | Set to `1` to print emails in the server log instead of sending them |
| `CRON_SECRET` | In production | A long random string that protects `/api/maintenance`. Generate one with `openssl rand -base64 32`. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript (generates Next's route types first) |
| `npm test` | Run the unit tests (no database needed) |
| `npm run test:db` | Run the database tests against `DATABASE_URL` |
| `npm run test:smoke` | Run the end-to-end checks against a running server (needs `SMOKE_URL`) |
| `npm run db:generate` | Create a migration from schema changes (commit the files in `drizzle/`) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Load the demo catalog |
| `npm run db:admin -- <email>` | Give an existing user the admin role |
| `npm run db:studio` | Browse the database |

## Testing

- **Unit tests** (`tests/unit`) cover pure logic such as the open-redirect guard, price and form parsing, email and structured-data escaping, and the seed data. They run in CI.
- **Database tests** (`tests/db`) cover stock holds, oversell races, cancel and expiry, payment fulfilment, rate limits and the maintenance job. They create their own rows and remove them afterwards.
- **Smoke tests** (`tests/smoke`) check a running production build: every sitemap URL, security headers, protected pages, the Stripe webhook, the cron endpoint and the sign-in rate limit.

To run the smoke tests locally:

```bash
npm run build
BETTER_AUTH_URL=http://localhost:3100 CRON_SECRET=smoke-cron-secret STRIPE_WEBHOOK_SECRET=whsec_any npx next start -p 3100
```

Then, in a second terminal:

```bash
SMOKE_URL=http://localhost:3100 npm run test:smoke
```

## Project structure

```text
src/app/          Routes: storefront, account, bag, checkout, admin and the API
                  (auth, Stripe webhook, maintenance)
src/components/   UI components (rail.tsx is the scrollable product row)
src/db/           Drizzle client, table definitions and the demo catalog seed
src/lib/          Catalog, bag, orders and stock, Stripe, email, auth, SEO, rate limiting
tests/            Unit, database and smoke tests
drizzle/          Generated SQL migrations
media/            Demo video and poster image
```

[`AGENTS.md`](AGENTS.md) has a deeper tour of the code and the project's conventions.

## How orders work

1. Checkout turns the bag into a **pending order** and holds the stock for 35 minutes.
2. The shopper pays on Stripe's hosted page. The return page and the Stripe webhook both confirm the payment with Stripe, check the amount, mark the order paid and send the confirmation email once.
3. If the hold expired before the payment arrived, the payment is refunded automatically.
4. A daily job (`/api/maintenance`) releases expired holds and clears stale guest bags, old rate-limit rows and expired sessions.

## Deployment

The pipeline in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) does two things:

- **CI** runs on every push and pull request: lint, typecheck, unit tests, `npm audit`, and a production build when a `DATABASE_URL` secret exists.
- **CD** runs after CI passes. Pull requests get a Vercel preview, and pushes to `main` apply database migrations and deploy to production.

One-time setup:

1. Create the Vercel project and add the environment variables above to it.
2. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub repository secrets.
3. Turn off Vercel's own Git deployments, so each push deploys once.
4. After the first deploy, add a Stripe webhook at `/api/stripe/webhook` for these events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

Vercel Cron calls `/api/maintenance` once a day (see `vercel.json`).

## License

The code is open source under the [MIT License](LICENSE): you can use, copy, modify and distribute it, including commercially, as long as you keep the copyright notice.

The license covers the code only. The product and journal photos come from [Unsplash](https://unsplash.com) and stay under the [Unsplash License](https://unsplash.com/license), so check it before reusing them.
