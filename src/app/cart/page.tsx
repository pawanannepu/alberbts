import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { getCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

import { removeFromCart, setCartQuantity } from "./actions";

export const metadata: Metadata = { title: "Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <main className="page pb-(--spacing-section)">
      <h1 className="heading pt-8 pb-8">Bag</h1>
      <Suspense fallback={<p className="caption">Loading your bag…</p>}>
        <CartContent />
      </Suspense>
    </main>
  );
}

async function CartContent() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="lead text-muted">Your bag is empty.</p>
        <Link href="/collections/all" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="items-start lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <ul className="border-t">
        {cart.lines.map((line) => (
          <CartLineItem key={line.slug} line={line} />
        ))}
      </ul>

      <section
        aria-labelledby="summary-title"
        className="mt-10 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:mt-0"
      >
        <h2 id="summary-title" className="label text-muted">
          Summary
        </h2>
        <div className="mt-4 flex justify-between border-b pb-4 text-body">
          <span>
            Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
          </span>
          <span>{formatPrice(cart.subtotalCents)}</span>
        </div>
        <p className="caption mt-4">Shipping and taxes are calculated at checkout.</p>
        <button type="button" className="btn btn-primary btn-block mt-6" disabled>
          Checkout
        </button>
        <p className="caption mt-3">
          {cart.canCheckout
            ? "Checkout isn't available yet."
            : "Update the items marked above to continue."}
        </p>
      </section>
    </div>
  );
}

function CartLineItem({ line }: { line: CartLine }) {
  const href = `/products/${line.slug}`;
  return (
    <li className="flex gap-4 border-b py-6 sm:gap-6">
      <Link href={href} className="media aspect-[4/5] w-24 shrink-0 sm:w-32">
        {line.image && <Image src={line.image.src} alt={line.image.alt} fill sizes="128px" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <p className="caption">{line.category}</p>
            <Link href={href} className="text-body hover:underline underline-offset-4">
              {line.name}
            </Link>
            <p className="caption mt-1">{formatPrice(line.unitPriceCents)}</p>
          </div>
          <p className="text-body">{formatPrice(line.lineTotalCents)}</p>
        </div>

        {!line.available && (
          <p role="alert" className="caption mt-3 text-danger">
            {line.stock === 0 ? "No longer available." : `Only ${line.stock} left. Reduce the quantity.`}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <div className="inline-flex items-center border">
            <QuantityButton line={line} quantity={line.quantity - 1} label="Decrease quantity" symbol="−" />
            <span className="min-w-10 text-center text-body">{line.quantity}</span>
            <QuantityButton
              line={line}
              quantity={line.quantity + 1}
              label="Increase quantity"
              symbol="+"
              disabled={line.quantity >= line.maxQuantity}
            />
          </div>
          <form action={removeFromCart}>
            <input type="hidden" name="slug" value={line.slug} />
            <button type="submit" className="caption underline underline-offset-4">
              Remove
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function QuantityButton({
  line,
  quantity,
  label,
  symbol,
  disabled,
}: {
  line: CartLine;
  quantity: number;
  label: string;
  symbol: string;
  disabled?: boolean;
}) {
  return (
    <form action={setCartQuantity}>
      <input type="hidden" name="slug" value={line.slug} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={`${label} of ${line.name}`}
        disabled={disabled}
        className="size-11 text-lead disabled:text-muted/50"
      >
        {symbol}
      </button>
    </form>
  );
}
