"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addToCart } from "@/app/cart/actions";

type Props = { slug: string; soldOut: boolean };

export function AddToCartButton({ slug, soldOut }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function add() {
    setResult(null);
    startTransition(async () => {
      const res = await addToCart(slug);
      setResult(res.ok ? { ok: true, message: "Added to your bag." } : { ok: false, message: res.error });
    });
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={soldOut || pending}
        onClick={add}
      >
        {soldOut ? "Sold out" : pending ? "Adding…" : "Add to bag"}
      </button>
      <p role="status" className={`caption mt-3 ${result?.ok === false ? "text-danger" : ""}`}>
        {soldOut && "This piece is currently unavailable."}
        {result?.message}
        {result?.ok && (
          <>
            {" "}
            <Link href="/cart" className="tap underline underline-offset-4">
              View bag
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
