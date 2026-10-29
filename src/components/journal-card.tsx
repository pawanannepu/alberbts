import Image from "next/image";
import Link from "next/link";

import { formatJournalDate, type JournalArticle } from "@/lib/journal-data";

export function JournalCard({ article, sizes }: { article: JournalArticle; sizes: string }) {
  return (
    <Link href={`/journal/${article.slug}`} className="group block">
      <div className="media aspect-[4/5]">
        <Image src={article.image.src} alt={article.image.alt} fill sizes={sizes} />
      </div>
      <p className="caption mt-4">{formatJournalDate(article.date)}</p>
      <h3 className="title mt-2 group-hover:underline underline-offset-4">{article.title}</h3>
      <p className="caption mt-2 max-w-[44ch]">{article.excerpt}</p>
    </Link>
  );
}
