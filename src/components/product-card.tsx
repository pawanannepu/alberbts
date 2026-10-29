import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/lib/catalog";
import { formatPrice, getStockState } from "@/lib/format";

type Props = { product: Product; sizes?: string };

export function ProductCard({
  product,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
}: Props) {
  const cover = product.gallery[0];
  const badge = getStockState(product.stock) === "out-of-stock" ? "Sold out" : product.isNew && "New";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="media media-product">
        {cover && <Image src={cover.src} alt={cover.alt} fill sizes={sizes} />}
        {badge && <span className="label absolute top-3 left-3 bg-paper px-2 py-1">{badge}</span>}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="caption">{product.category.name}</p>
        <h3 className="text-body group-hover:underline underline-offset-4">{product.name}</h3>
        <p className="text-body">{formatPrice(product.priceCents)}</p>
      </div>
    </Link>
  );
}
