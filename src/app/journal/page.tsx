import type { Metadata } from "next";

import { JournalCard } from "@/components/journal-card";
import { journalArticles } from "@/lib/journal-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Journal",
  description: "Styling notes, care guides and stories from the Alberbts team.",
  path: "/journal",
  image: journalArticles[0].image,
});

export default function JournalPage() {
  return (
    <main className="page pb-(--spacing-section)">
      <header className="pt-8 pb-10">
        <p className="label text-muted">The Journal</p>
        <h1 className="heading mt-3">Notes on how to wear and care for what you own</h1>
      </header>
      <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {journalArticles.map((article) => (
          <JournalCard
            key={article.slug}
            article={article}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ))}
      </div>
    </main>
  );
}
