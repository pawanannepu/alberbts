"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { links: { label: string; href: string }[] };

export function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="label -ml-2 flex min-h-12 items-center px-2"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="fixed inset-x-0 top-header bottom-0 overflow-y-auto border-t bg-paper px-gutter py-8"
        >
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href} className="border-b">
                <Link
                  href={link.href}
                  className="heading block py-4"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-b">
              <Link href="/search" className="heading block py-4" onClick={() => setOpen(false)}>
                Search
              </Link>
            </li>
            <li className="border-b">
              <Link href="/account" className="heading block py-4" onClick={() => setOpen(false)}>
                Account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
