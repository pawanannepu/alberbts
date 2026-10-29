import assert from "node:assert/strict";
import { describe, test } from "node:test";

// End-to-end checks against a running production server (`npm run build && npm start`):
//   SMOKE_URL=http://localhost:3100 npm run test:smoke
// The server must have been started with BETTER_AUTH_URL set to that same origin, plus
// CRON_SECRET=<anything> and STRIPE_WEBHOOK_SECRET=<anything> (set SMOKE_CRON_SECRET to match).
// Read-only apart from a few failed sign-in attempts to prove the limiter kicks in.

const base = process.env.SMOKE_URL?.replace(/\/$/, "");
const skip = base ? false : "set SMOKE_URL to a running server to run smoke tests";
const cronSecret = process.env.SMOKE_CRON_SECRET ?? "smoke-cron-secret";

const get = (path: string, init: RequestInit = {}) => fetch(`${base}${path}`, { redirect: "manual", ...init });
const redirectTarget = (res: Response) => new URL(res.headers.get("location") ?? "", base).pathname + new URL(res.headers.get("location") ?? "", base).search;

describe("public pages", { skip }, () => {
  const pages = ["/", "/collections/all", "/collections/new-in", "/collections/women", "/collections/men", "/collections/bags", "/journal", "/search?q=ring", "/sign-in", "/sign-up", "/forgot-password", "/cart"];

  for (const path of pages) {
    test(`GET ${path} renders`, async () => {
      const res = await get(path);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes("<title>"), "has a title");
    });
  }

  test("every product in the sitemap renders", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const productPaths = urls.filter((p) => p.startsWith("/products/"));
    assert.ok(productPaths.length >= 30, `expected a full catalog, got ${productPaths.length}`);
    for (const path of productPaths) {
      const res = await get(path);
      assert.equal(res.status, 200, path);
      assert.ok((await res.text()).includes("application/ld+json"), `${path} has structured data`);
    }
  });

  test("every sitemap URL and every internal link on the main pages resolves", async () => {
    const xml = await (await get("/sitemap.xml")).text();
    const sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const links = new Set<string>(sitemapPaths);

    for (const page of ["/", "/collections/all", "/journal", sitemapPaths.find((p) => p.startsWith("/products/")) ?? "/", sitemapPaths.find((p) => p.startsWith("/journal/")) ?? "/journal"]) {
      const html = (await (await get(page)).text()).replace(/<script[\s\S]*?<\/script>/g, "");
      for (const [, href] of html.matchAll(/href="([^"#][^"]*)"/g)) {
        if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/_next") && !/\.(ico|png|jpg|svg|css|js|xml|txt)$/.test(href)) {
          links.add(href.replace(/&amp;/g, "&"));
        }
      }
    }

    const broken: string[] = [];
    for (const path of links) {
      const res = await get(path);
      if (res.status >= 400) broken.push(`${res.status} ${path}`);
    }
    assert.ok(links.size > 40, `crawled only ${links.size} URLs`);
    assert.deepEqual(broken, []);
  });

  test("sort values that aren't real options fall back instead of erroring", async () => {
    for (const sort of ["constructor", "toString", "__proto__", "price-asc"]) {
      assert.equal((await get(`/collections/all?sort=${sort}`)).status, 200, sort);
    }
  });

  test("robots.txt hides private areas and points at the sitemap", async () => {
    const text = await (await get("/robots.txt")).text();
    for (const path of ["/admin", "/api/", "/account", "/cart", "/checkout", "/orders"]) {
      assert.ok(text.includes(`Disallow: ${path}`), path);
    }
    assert.ok(/Sitemap: .+\/sitemap\.xml/.test(text));
  });

  test("an unknown path is a real 404 with the branded page", async () => {
    const res = await get("/definitely/not/a/page");
    assert.equal(res.status, 404);
    assert.ok((await res.text()).includes("find that page"));
  });
});

describe("security headers", { skip }, () => {
  test("are present on pages and API routes, and the server doesn't advertise itself", async () => {
    for (const path of ["/", "/api/auth/get-session"]) {
      const res = await get(path);
      assert.equal(res.headers.get("x-content-type-options"), "nosniff", path);
      assert.equal(res.headers.get("x-frame-options"), "DENY", path);
      assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin", path);
      assert.equal(res.headers.get("cross-origin-opener-policy"), "same-origin", path);
      assert.ok(res.headers.get("permissions-policy")?.includes("camera=()"), path);
      assert.equal(res.headers.get("x-powered-by"), null, path);
    }
  });

  test("production serves a strict CSP and HSTS", async () => {
    const res = await get("/");
    const csp = res.headers.get("content-security-policy") ?? "";
    for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "frame-src 'none'"]) {
      assert.ok(csp.includes(directive), directive);
    }
    assert.ok(!csp.includes("'unsafe-eval'"), "no eval");
    assert.ok(res.headers.get("strict-transport-security")?.includes("max-age="));
  });
});

describe("private pages require sign-in", { skip }, () => {
  for (const path of ["/account", "/admin", "/admin/products", "/admin/orders", "/orders/0b8e0c2e-6f55-4f0e-9a41-3c1f7d3a9b11"]) {
    test(`${path} sends visitors to sign-in`, async () => {
      const res = await get(path);
      // Streamed pages can answer 200 and redirect client-side; either way no private data may be present.
      const body = res.status === 200 ? await res.text() : "";
      if (res.status >= 300 && res.status < 400) {
        assert.match(redirectTarget(res), /^\/sign-in\?next=/);
      } else {
        assert.equal(res.status, 200);
        assert.ok(/NEXT_REDIRECT|\/sign-in/.test(body), "page redirects to sign-in");
        const visible = body.replace(/<head[\s\S]*?<\/head>/, "").replace(/<script[\s\S]*?<\/script>/g, "");
        assert.ok(!visible.includes('href="/admin'), "no admin links in the visible HTML");
        assert.ok(!/Inventory|Stock level|Customer/i.test(visible), "no admin data in the visible HTML");
      }
    });
  }

  test("checkout return rejects ids that aren't Stripe sessions", async () => {
    const res = await get("/checkout/return?session_id=not-a-session");
    assert.ok(res.status >= 300 && res.status < 400);
    assert.equal(redirectTarget(res), "/cart");
  });
});

describe("open redirects", { skip }, () => {
  test("a hostile ?next= never reaches the sign-in form", async () => {
    for (const next of ["//evil.example", "https://evil.example", "/%09/evil.example", "/\\evil.example"]) {
      const html = await (await get(`/sign-in?next=${next}`)).text();
      // Next echoes the requested URL in its router state, so look at what the page actually uses:
      // visible markup, and the `next` prop handed to the form.
      const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
      assert.ok(!visible.includes("evil.example"), `markup leaked ${next}`);
      for (const [, value] of html.matchAll(/\\"next\\":\\"([^"\\]*)\\"/g)) {
        assert.ok(value.startsWith("/") && !value.startsWith("//"), `form got unsafe next ${value} for ${next}`);
      }
    }
  });
});

describe("machine endpoints", { skip }, () => {
  test("Stripe webhook refuses unsigned and wrongly signed requests", async () => {
    const unsigned = await get("/api/stripe/webhook", { method: "POST", body: "{}" });
    assert.ok([400, 500].includes(unsigned.status), `unsigned got ${unsigned.status}`);
    const forged = await get("/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "checkout.session.completed" }),
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
    });
    assert.ok([400, 500].includes(forged.status), `forged got ${forged.status}`);
  });

  test("maintenance endpoint needs the cron secret", async () => {
    assert.equal((await get("/api/maintenance")).status, 401);
    assert.equal((await get("/api/maintenance", { headers: { authorization: "Bearer wrong" } })).status, 401);
    assert.equal((await get("/api/maintenance", { headers: { authorization: cronSecret } })).status, 401, "scheme required");

    const ok = await get("/api/maintenance", { headers: { authorization: `Bearer ${cronSecret}` } });
    assert.equal(ok.status, 200);
    const report = await ok.json();
    for (const key of ["releasedOrders", "guestCarts", "throttles", "authRateLimits", "sessions", "verifications"]) {
      assert.equal(typeof report[key], "number", key);
    }
  });

  test("repeated bad sign-ins get rate limited", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await get("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: base! },
        body: JSON.stringify({ email: "nobody@example.test", password: "wrong-password-123" }),
      });
      statuses.push(res.status);
    }
    assert.ok(statuses.includes(429), `expected a 429 among ${statuses.join(",")}`);
    assert.ok(!statuses.includes(200));
  });
});
