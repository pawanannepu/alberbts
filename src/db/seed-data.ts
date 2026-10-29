// Demo catalog used by `npm run db:seed`. Not imported by the app.

const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

// Close-up crop of the same photo, centred on a focal point and zoomed in.
const closeUp = (id: string, [x, y, zoom]: [number, number, number], width: number) =>
  `${unsplash(id, width)}&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}&h=${Math.round(width * 1.25)}`;

export const categorySeeds = [
  { slug: "eyewear", name: "Eyewear" },
  { slug: "bags", name: "Bags" },
  { slug: "knitwear", name: "Knitwear" },
  { slug: "dresses", name: "Dresses" },
  { slug: "jewelry", name: "Jewelry" },
  { slug: "tailoring", name: "Tailoring" },
  { slug: "essentials", name: "Essentials" },
];

type ProductSeed = {
  slug: string;
  name: string;
  categorySlug: string;
  priceCents: number;
  audience: "women" | "men" | "unisex";
  isNew?: boolean;
  stock: number;
  description: string;
  details: string[];
  photo: string;
  alt: string;
  focus: [[number, number, number], [number, number, number]];
};

// Order matters: seeded `created_at` follows this order, so the last entry is the newest.
const productSeeds: ProductSeed[] = [
  {
    slug: "round-metal-sunglasses",
    name: "Round Metal Sunglasses",
    categorySlug: "eyewear",
    priceCents: 24500,
    audience: "unisex",
    isNew: true,
    stock: 14,
    photo: "1511499767150-a48a237f0083",
    focus: [[0.5, 0.5, 2], [0.3, 0.5, 2.6]],
    alt: "Round gold-framed sunglasses with green lenses",
    description:
      "Lightweight round sunglasses with a fine metal frame and bottle-green lenses. A quiet shape that works with everything.",
    details: ["Gold-tone metal frame", "Green UV400 lenses", "Adjustable nose pads", "Includes case and cloth"],
  },
  {
    slug: "structured-top-handle-bag",
    name: "Structured Top-Handle Bag",
    categorySlug: "bags",
    priceCents: 129000,
    audience: "women",
    stock: 6,
    photo: "1584917865442-de89df76afd3",
    focus: [[0.5, 0.22, 2], [0.75, 0.8, 2.2]],
    alt: "Red leather top-handle bag on a white plinth",
    description:
      "A rigid, architectural bag in smooth calfskin, with a polished metal clasp and room for the essentials.",
    details: ["Smooth calfskin leather", "Polished metal clasp", "Suede-lined interior", "Made in Italy"],
  },
  {
    slug: "crochet-fringe-poncho",
    name: "Crochet Fringe Poncho",
    categorySlug: "knitwear",
    priceCents: 32000,
    audience: "women",
    isNew: true,
    stock: 3,
    photo: "1434389677669-e08b4cac3105",
    focus: [[0.5, 0.3, 2], [0.5, 0.85, 2.4]],
    alt: "Cream crochet poncho with fringe on a wooden hanger",
    description:
      "An open-knit poncho in soft cotton, finished with a hand-knotted fringe. Easy to layer over a shirt or dress.",
    details: ["100% cotton", "Hand-knotted fringe", "One size", "Hand wash cold"],
  },
  {
    slug: "floral-wrap-dress",
    name: "Floral Wrap Dress",
    categorySlug: "dresses",
    priceCents: 48000,
    audience: "women",
    stock: 9,
    photo: "1496747611176-843222e1e57c",
    focus: [[0.5, 0.45, 2], [0.45, 0.2, 2.4]],
    alt: "White floral wrap dress by the sea",
    description:
      "A fluid wrap dress in a light viscose crepe with a printed rose pattern and a flattering tie waist.",
    details: ["Viscose crepe", "Wrap front with tie waist", "Midi length", "Machine wash gentle"],
  },
  {
    slug: "halo-diamond-ring",
    name: "Halo Diamond Ring",
    categorySlug: "jewelry",
    priceCents: 215000,
    audience: "women",
    stock: 2,
    photo: "1605100804763-247f67b3557e",
    focus: [[0.5, 0.45, 2], [0.65, 0.55, 3]],
    alt: "Diamond halo ring on a dark surface",
    description:
      "A round brilliant stone ringed by pavé diamonds, set in recycled 18k gold with a split shoulder.",
    details: ["Recycled 18k gold", "Round brilliant centre stone", "Pavé halo", "Presented in a gift box"],
  },
  {
    slug: "tailored-wool-suit",
    name: "Tailored Wool Suit",
    categorySlug: "tailoring",
    priceCents: 145000,
    audience: "men",
    isNew: true,
    stock: 0,
    photo: "1617137968427-85924c800a22",
    focus: [[0.5, 0.35, 2], [0.5, 0.75, 2.4]],
    alt: "Man in a navy tailored suit walking past glass",
    description:
      "A two-piece suit in navy wool with a soft shoulder and a slim, tapered leg. Half-canvassed for a clean drape.",
    details: ["Super 110s wool", "Half-canvassed jacket", "Two-button, notch lapel", "Dry clean only"],
  },
  {
    slug: "garment-dyed-cotton-tee",
    name: "Garment-Dyed Cotton Tee",
    categorySlug: "essentials",
    priceCents: 9500,
    audience: "unisex",
    stock: 40,
    photo: "1523381210434-271e8be1f52b",
    focus: [[0.5, 0.5, 1.6], [0.4, 0.7, 2.4]],
    alt: "Sage green t-shirts hanging on wooden hangers",
    description:
      "A heavyweight tee, garment-dyed in sage for a lived-in finish that softens with every wash.",
    details: ["Heavyweight cotton jersey", "Garment-dyed", "Relaxed fit", "Machine wash cold"],
  },
  {
    slug: "floral-print-handbag",
    name: "Floral Print Handbag",
    categorySlug: "bags",
    priceCents: 118000,
    audience: "women",
    stock: 5,
    photo: "1591561954557-26941169b49e",
    focus: [[0.5, 0.75, 2], [0.75, 0.65, 2.4]],
    alt: "Handbag with a pastel floral print",
    description:
      "A structured handbag in canvas with an all-over pastel floral print and leather-trimmed handles.",
    details: ["Printed coated canvas", "Leather-trimmed handles", "Interior zip pocket", "Made in Italy"],
  },
];

export const seedProducts = productSeeds.map(({ photo, focus, alt, ...product }, index) => ({
  ...product,
  createdAt: new Date(Date.UTC(2026, 8, 1 + index)),
  images: [
    { url: unsplash(photo, 1400), alt },
    { url: closeUp(photo, focus[0], 1000), alt: `${product.name}, close-up` },
    { url: closeUp(photo, focus[1], 1000), alt: `${product.name}, detail` },
  ],
}));
