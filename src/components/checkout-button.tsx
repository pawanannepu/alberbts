"use client";

import { useState, useTransition } from "react";

import { startCheckout } from "@/app/checkout/actions";

export function CheckoutButton({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function checkout() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout();
      if (result) setError(result.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={disabled || pending}
        onClick={checkout}
      >
        {pending ? "Redirecting to payment…" : "Checkout"}
      </button>
      <p role="alert" className="caption mt-3 text-danger">
        {error}
      </p>
    </div>
  );
}
