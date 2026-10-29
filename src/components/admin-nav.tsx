"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-x-6 gap-y-2 border-b py-4">
      {links.map(({ href, label }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`label ${active ? "underline underline-offset-4" : "text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
      <Link href="/" className="label ml-auto text-muted hover:text-ink">
        View store
      </Link>
    </nav>
  );
}
