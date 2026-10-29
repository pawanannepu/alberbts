import Image from "next/image";
import Link from "next/link";

import { formatPrice, getStockState, type Product } from "@/lib/store-data";

type Props = { product: Product; sizes?: string };

export function ProductCard({
  product,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
}: Props) {
  const badge = getStockState(product.stock) === "out-of-stock" ? "Sold out" : product.isNew && "New";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="media media-product">
        <Image src={product.image} alt={product.alt} fill sizes={sizes} />
        {badge && <span className="label absolute top-3 left-3 bg-paper px-2 py-1">{badge}</span>}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="caption">{product.category}</p>
        <h3 className="text-body group-hover:underline underline-offset-4">{product.name}</h3>
        <p className="text-body">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
