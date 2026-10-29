import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

// Nothing (not even the nav) renders for non-admins. Pages re-check too, since layouts
// don't re-run on client-side navigation.
async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <main className="page pb-(--spacing-section)">
      <AdminNav />
      <div className="pt-8">{children}</div>
    </main>
  );
}
