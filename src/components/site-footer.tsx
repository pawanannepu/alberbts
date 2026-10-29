import Link from "next/link";

import { footerLinks } from "@/lib/store-data";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="page section grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-xl tracking-[0.32em] uppercase">Alberbts</p>
          <p className="caption mt-4 max-w-[28ch]">
            Considered essentials and statement pieces, made to last.
          </p>
        </div>
        {footerLinks.map((group) => (
          <div key={group.title}>
            <h2 className="label">{group.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {group.links.map((label) => (
                <li key={label}>
                  <Link href="#" className="link no-underline hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="page caption py-6">© 2026 Alberbts. Sample storefront.</p>
      </div>
    </footer>
  );
}
