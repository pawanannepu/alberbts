import Link from "next/link";
import { Suspense } from "react";

import { getCartCount } from "@/lib/cart";

// The count depends on the visitor's cookies, so it streams in behind Suspense and the
// rest of the header stays static.
export function CartLink() {
  return (
    <Suspense fallback={<BagLink />}>
      <CartCount />
    </Suspense>
  );
}

async function CartCount() {
  return <BagLink count={await getCartCount()} />;
}

function BagLink({ count }: { count?: number }) {
  return (
    <Link href="/cart" className="nav-link" aria-label={count ? `Bag, ${count} items` : "Bag"}>
      Bag{count !== undefined && ` (${count})`}
    </Link>
  );
}
