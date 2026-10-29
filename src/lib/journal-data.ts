import { unsplash } from "@/lib/store-data";

// Static editorial content for /journal. Demo copy: swap for a CMS when there's real content.

export type JournalSection = { heading?: string; paragraphs: string[] };

export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO date
  image: { src: string; alt: string };
  sections: JournalSection[];
  shop: { label: string; href: string }[];
};

export const journalArticles: JournalArticle[] = [
  {
    slug: "layering-explained",
    title: "Layering, explained",
    excerpt:
      "Start with soft knits, add a structured outer layer and finish with one considered accessory. A simple method for a wardrobe that works from morning to evening.",
    date: "2026-10-20",
    image: {
      src: unsplash("1445205170230-053b83016050", 1600),
      alt: "Knitwear and shirts hanging on a warmly lit rail",
    },
    sections: [
      {
        paragraphs: [
          "Good layering isn't about wearing more. It's about choosing pieces that each do a job, so you can add or remove them as the day changes without the outfit falling apart.",
        ],
      },
      {
        heading: "Start close to the skin",
        paragraphs: [
          "Your base layer should be the quietest thing you own: a fine cotton tee, a thin knit, a plain shirt. Keep the colour soft and the cut simple. Everything else will sit on top of it, so it should never fight for attention.",
        ],
      },
      {
        heading: "Add texture, not volume",
        paragraphs: [
          "The middle layer is where warmth and interest live. An open-knit poncho or a heavier cardigan adds depth without bulk. Mix surfaces rather than colours: smooth against nubby, matte against soft sheen.",
          "If a piece feels too heavy to wear indoors, it belongs on the outside.",
        ],
      },
      {
        heading: "Finish with structure",
        paragraphs: [
          "A sharply cut jacket or coat gives the softer layers a frame. Then stop at one accessory (a bag with a clear shape, or a pair of considered sunglasses) and let the rest stay calm.",
        ],
      },
    ],
    shop: [
      { label: "Shop knitwear", href: "/collections/knitwear" },
      { label: "Shop essentials", href: "/collections/essentials" },
    ],
  },
  {
    slug: "caring-for-knitwear",
    title: "How to care for knitwear",
    excerpt:
      "A few small habits, from folding to drying, will keep soft knits shaped and pill-free for years.",
    date: "2026-10-06",
    image: {
      src: unsplash("1434389677669-e08b4cac3105", 1600),
      alt: "Cream crochet poncho with fringe on a wooden hanger",
    },
    sections: [
      {
        paragraphs: [
          "Knitwear rewards a little attention. Most of the damage comes from hanging, heat and rough washing, and all three are easy to avoid.",
        ],
      },
      {
        heading: "Fold, don't hang",
        paragraphs: [
          "Hanging a knit lets its own weight stretch the shoulders. Fold it flat in a drawer or on a shelf instead. Open-knit and fringed pieces are the exception: drape them loosely over a wide, padded hanger for a day to let creases fall out, then fold them away again.",
        ],
      },
      {
        heading: "Wash less, wash gently",
        paragraphs: [
          "Air a knit between wears and wash only when it needs it. When it does, use cold water and a mild detergent, press the water out without wringing, and dry it flat on a towel away from direct heat.",
        ],
      },
      {
        heading: "Deal with pilling early",
        paragraphs: [
          "A little pilling is normal where fabric rubs. Lift the pills off with a fabric comb or shaver rather than pulling them, and they will slow down as the surface settles.",
        ],
      },
    ],
    shop: [{ label: "Shop knitwear", href: "/collections/knitwear" }],
  },
  {
    slug: "choosing-fine-jewelry",
    title: "Choosing your first piece of fine jewelry",
    excerpt:
      "What to look for in the metal, the stone and the setting, and why the best first piece is the one you'll wear every day.",
    date: "2026-09-22",
    image: {
      src: unsplash("1605100804763-247f67b3557e", 1600),
      alt: "Diamond halo ring on a dark surface",
    },
    sections: [
      {
        paragraphs: [
          "A first fine piece should earn its place. The best ones are worn so often they become part of how you look, so choose for daily life before the occasion.",
        ],
      },
      {
        heading: "Start with the metal",
        paragraphs: [
          "Gold in 18 carat is rich in colour and durable enough for everyday wear. Recycled gold has the same properties as newly mined metal, with a smaller footprint. Pick the tone that suits the jewelry you already own.",
        ],
      },
      {
        heading: "Look at the setting",
        paragraphs: [
          "A setting does two things: it shows off the stone and it protects it. Low profiles catch on knitwear less. A split shoulder or a halo adds presence without adding height.",
        ],
      },
      {
        heading: "Keep it clean",
        paragraphs: [
          "Soak jewelry in warm water with a drop of mild soap, brush gently with a soft brush and dry with a lint-free cloth. Store each piece on its own so nothing scratches.",
        ],
      },
    ],
    shop: [{ label: "Shop jewelry", href: "/collections/jewelry" }],
  },
  {
    slug: "the-everyday-bag",
    title: "The case for a bag with structure",
    excerpt:
      "A rigid shape keeps its line, protects what's inside and makes the plainest outfit look finished.",
    date: "2026-09-08",
    image: {
      src: unsplash("1584917865442-de89df76afd3", 1600),
      alt: "Red leather top-handle bag on a white plinth",
    },
    sections: [
      {
        paragraphs: [
          "Soft bags slouch and sag with use. A structured bag holds its form, and its form is the point: it gives an outfit a clear edge, and it makes things easy to find.",
        ],
      },
      {
        heading: "Pick a size you'll actually carry",
        paragraphs: [
          "Hold the bag as you'd carry it on a normal day: a phone, keys, a wallet and one thing more. If it feels precious or awkward empty, it won't be used full.",
        ],
      },
      {
        heading: "Check the details",
        paragraphs: [
          "Look at the hardware, the stitching along the edges and the lining. These are the parts that show wear first, and the ones that tell you how a bag was made.",
        ],
      },
    ],
    shop: [{ label: "Shop bags", href: "/collections/bags" }],
  },
];

export const getJournalArticle = (slug: string) => journalArticles.find((a) => a.slug === slug);

export const formatJournalDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export const readingMinutes = (article: JournalArticle) => {
  const words = article.sections
    .flatMap((s) => [s.heading ?? "", ...s.paragraphs])
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};
