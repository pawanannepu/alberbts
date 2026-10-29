import Link from "next/link";

import { navLinks } from "@/lib/store-data";

import { CartLink } from "./cart-link";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center">
          <MobileMenu links={navLinks} />
          <nav aria-label="Main" className="hidden gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="font-display text-xl font-normal tracking-[0.32em] uppercase sm:text-2xl"
        >
          Alberbts
        </Link>

        <div className="flex items-center justify-end gap-5 sm:gap-8">
          <Link href="/search" className="nav-link hidden sm:inline">
            Search
          </Link>
          <Link href="/account" className="nav-link hidden sm:inline">
            Account
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
