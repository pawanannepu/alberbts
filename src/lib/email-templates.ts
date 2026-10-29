import { formatPrice } from "@/lib/format";

// Plain HTML + text bodies. Tables and inline styles only, since email clients ignore most CSS.

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Email = { subject: string; html: string; text: string };

function layout(preheader: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#000000;">
<tr><td style="padding:32px 32px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:7px;text-transform:uppercase;">Alberbts</td></tr>
<tr><td style="padding:24px 32px 40px;font-size:14px;line-height:22px;">${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e3e3e3;font-size:12px;line-height:18px;color:#6f6f6f;">Alberbts. Considered essentials and statement pieces, made to last.</td></tr>
</table></td></tr></table></body></html>`;
}

const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;font-weight:400;">${esc(text)}</h1>`;

const button = (href: string, label: string) =>
  `<p style="margin:28px 0;"><a href="${esc(href)}" style="display:inline-block;background:#000000;color:#ffffff;padding:14px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${esc(label)}</a></p>`;

const fallbackLink = (href: string) =>
  `<p style="margin:0;font-size:12px;line-height:18px;color:#6f6f6f;">Button not working? Paste this link into your browser:<br><a href="${esc(href)}" style="color:#6f6f6f;word-break:break-all;">${esc(href)}</a></p>`;

export function verifyEmailMessage(input: { name: string; url: string }): Email {
  return {
    subject: "Verify your email address",
    text: `Hi ${input.name},\n\nConfirm your email address to finish creating your Alberbts account:\n${input.url}\n\nIf you didn't sign up, you can ignore this email.`,
    html: layout(
      "Confirm your email address to finish creating your account.",
      `${heading("Confirm your email")}
<p style="margin:0;">Hi ${esc(input.name)}, confirm your email address to finish creating your Alberbts account.</p>
${button(input.url, "Verify email")}${fallbackLink(input.url)}
<p style="margin:20px 0 0;color:#6f6f6f;">If you didn't sign up, you can ignore this email.</p>`,
    ),
  };
}

export function resetPasswordMessage(input: { name: string; url: string }): Email {
  return {
    subject: "Reset your password",
    text: `Hi ${input.name},\n\nUse this link to choose a new password (it expires in 1 hour):\n${input.url}\n\nIf you didn't ask for this, you can ignore this email; your password won't change.`,
    html: layout(
      "Choose a new password for your Alberbts account.",
      `${heading("Reset your password")}
<p style="margin:0;">Hi ${esc(input.name)}, we received a request to reset your password. The link below expires in 1 hour.</p>
${button(input.url, "Choose a new password")}${fallbackLink(input.url)}
<p style="margin:20px 0 0;color:#6f6f6f;">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`,
    ),
  };
}

export type OrderEmailData = {
  number: number;
  orderUrl: string;
  subtotalCents: number;
  items: { name: string; quantity: number; unitPriceCents: number }[];
  shippingName: string | null;
  shippingAddress: string[];
};

export function orderConfirmationMessage(order: OrderEmailData): Email {
  const rows = order.items
    .map(
      (item) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid #e3e3e3;">${esc(item.name)}<br><span style="font-size:12px;color:#6f6f6f;">Qty ${item.quantity} · ${formatPrice(item.unitPriceCents)}</span></td>
<td align="right" style="padding:12px 0;border-bottom:1px solid #e3e3e3;">${formatPrice(item.unitPriceCents * item.quantity)}</td></tr>`,
    )
    .join("");
  const address = [order.shippingName, ...order.shippingAddress].filter(Boolean) as string[];

  return {
    subject: `Order #${order.number} confirmed`,
    text: [
      `Thank you for your order. Your order #${order.number} is confirmed.`,
      "",
      ...order.items.map((i) => `${i.quantity} x ${i.name}  ${formatPrice(i.unitPriceCents * i.quantity)}`),
      "",
      `Total: ${formatPrice(order.subtotalCents)} (complimentary shipping)`,
      ...(address.length ? ["", "Shipping to:", ...address] : []),
      "",
      `View your order: ${order.orderUrl}`,
    ].join("\n"),
    html: layout(
      `Your order #${order.number} is confirmed.`,
      `${heading("Thank you for your order")}
<p style="margin:0;">Your order <strong>#${order.number}</strong> is confirmed.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-top:1px solid #e3e3e3;font-size:14px;">${rows}
<tr><td style="padding:16px 0 0;">Total <span style="font-size:12px;color:#6f6f6f;">(complimentary shipping)</span></td><td align="right" style="padding:16px 0 0;">${formatPrice(order.subtotalCents)}</td></tr></table>
${address.length ? `<p style="margin:28px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6f6f6f;">Shipping to</p><p style="margin:8px 0 0;">${address.map(esc).join("<br>")}</p>` : ""}
${button(order.orderUrl, "View order")}`,
    ),
  };
}
