import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderToStaticMarkup } from "react-dom/server";

import { JsonLd } from "@/components/json-ld";
import { orderConfirmationMessage, resetPasswordMessage, verifyEmailMessage } from "@/lib/email-templates";

describe("JsonLd", () => {
  test("can't be broken out of its script tag", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    assert.equal(html.match(/<script/g)?.length, 1, "only the wrapper script tag may exist");
    assert.ok(!html.includes("</script><script>"));
    assert.ok(html.includes("\\u003c/script>"));
  });

  test("stays valid JSON for the crawler", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "Ring <3", price: 10 }} />);
    const body = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
    assert.deepEqual(JSON.parse(body), { name: "Ring <3", price: 10 });
  });
});

describe("email templates", () => {
  const evil = `<img src=x onerror=alert(1)> "quoted"`;

  test("escape user-controlled names and URLs in HTML", () => {
    const url = `https://shop.test/verify?token=abc&x="><script>alert(1)</script>`;
    for (const mail of [verifyEmailMessage({ name: evil, url }), resetPasswordMessage({ name: evil, url })]) {
      assert.ok(!mail.html.includes("<img"), "name must be escaped");
      assert.ok(!mail.html.includes("<script>"), "url must be escaped");
      assert.ok(mail.html.includes("&lt;img"));
      assert.ok(mail.text.includes(url), "plain text carries the raw link");
    }
  });

  test("order confirmation escapes item names and addresses and totals correctly", () => {
    const mail = orderConfirmationMessage({
      number: 1042,
      orderUrl: "https://shop.test/orders/1",
      subtotalCents: 30000,
      items: [
        { name: evil, quantity: 2, unitPriceCents: 10000 },
        { name: "Scarf", quantity: 1, unitPriceCents: 10000 },
      ],
      shippingName: "A <b>Buyer</b>",
      shippingAddress: ["1 Main St <script>", "Austin, TX"],
    });
    assert.equal(mail.subject, "Order #1042 confirmed");
    assert.ok(!mail.html.includes("<img"));
    assert.ok(!mail.html.includes("<b>Buyer"));
    assert.ok(!mail.html.includes("<script>"));
    assert.ok(mail.html.includes("$300"), "total shown");
    assert.ok(mail.html.includes("$200"), "line total = unit price x quantity");
  });
});

describe("error pages", () => {
  const noop = () => {};

  test("show a friendly message and the server digest, never the error text", async () => {
    const { default: ErrorPage } = await import("@/app/error");
    const { default: GlobalError } = await import("@/app/global-error");
    const error = Object.assign(new Error("db password is hunter2"), { digest: "123456" });

    for (const html of [
      renderToStaticMarkup(<ErrorPage error={error} retry={noop} />),
      renderToStaticMarkup(<GlobalError error={error} retry={noop} />),
    ]) {
      assert.ok(html.includes("Try again"));
      assert.ok(html.includes("Back to home"));
      assert.ok(html.includes("Reference: 123456"));
      assert.ok(!html.includes("hunter2"));
    }
  });

  test("cope with thrown values that aren't Errors", async () => {
    const { default: ErrorPage } = await import("@/app/error");
    for (const value of ["a string", null, undefined, 42, {}]) {
      const html = renderToStaticMarkup(<ErrorPage error={value} retry={noop} />);
      assert.ok(html.includes("Try again"));
      assert.ok(!html.includes("Reference"));
    }
  });

  test("the global page brings its own document", async () => {
    const { default: GlobalError } = await import("@/app/global-error");
    const html = renderToStaticMarkup(<GlobalError error={null} retry={noop} />);
    assert.ok(html.startsWith("<html"));
    assert.ok(html.includes("<body"));
  });
});
