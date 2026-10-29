import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JournalCard } from "@/components/journal-card";
import { JsonLd } from "@/components/json-ld";
import {
  formatJournalDate,
  getJournalArticle,
  journalArticles,
  readingMinutes,
} from "@/lib/journal-data";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return journalArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const article = getJournalArticle((await params).slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
    image: article.image,
    type: "article",
    publishedTime: article.date,
  });
}

export default async function JournalArticlePage({ params }: PageProps<"/journal/[slug]">) {
  const article = getJournalArticle((await params).slug);
  if (!article) notFound();

  const more = journalArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <main>
      <JsonLd data={articleJsonLd(article)} />
      <nav aria-label="Breadcrumb" className="page caption flex gap-2 pt-6 pb-4">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/journal" className="hover:underline">
          Journal
        </Link>
      </nav>

      <article>
        <header className="page-narrow pt-6 pb-10 text-center">
          <p className="label text-muted">
            {formatJournalDate(article.date)} · {readingMinutes(article)} min read
          </p>
          <h1 className="heading mt-4">{article.title}</h1>
          <p className="lead mt-4 text-muted">{article.excerpt}</p>
        </header>

        <div className="page">
          <div className="media media-hero">
            <Image
              src={article.image.src}
              alt={article.image.alt}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </div>

        <div className="page-narrow section">
          <div className="mx-auto max-w-xl">
            {article.sections.map((section, i) => (
              <section key={i} className={i > 0 ? "mt-10" : undefined}>
                {section.heading && <h2 className="title">{section.heading}</h2>}
                {section.paragraphs.map((text, j) => (
                  <p key={j} className={`lead text-muted ${section.heading || j > 0 ? "mt-4" : ""}`}>
                    {text}
                  </p>
                ))}
              </section>
            ))}

            <div className="mt-12 flex flex-wrap gap-3">
              {article.shop.map((link) => (
                <Link key={link.href} href={link.href} className="btn btn-primary">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      <section className="border-t">
        <div className="page section">
          <h2 className="heading mb-8">More from the journal</h2>
          <div className="grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((a) => (
              <JournalCard key={a.slug} article={a} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
