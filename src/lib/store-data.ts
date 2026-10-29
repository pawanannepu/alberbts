// Sample storefront data. Replace with database queries once product schemas exist.

const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

// Close-up crop of the same photo, centred on a focal point and zoomed in.
const closeUp = (id: string, [x, y, zoom]: Focus, width = 1200) =>
  `${unsplash(id, width)}&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}&h=${Math.round(width * 1.25)}`;

type Focus = [x: number, y: number, zoom: number];

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  alt: string;
  isNew?: boolean;
  description: string;
  details: string[];
  stock: number;
  gallery: { src: string; alt: string }[];
};

export type Collection = {
  slug: string;
  title: string;
  image: string;
  alt: string;
};

export const navLinks = [
  { label: "New In", href: "/collections/new-in" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Eyewear", href: "/collections/eyewear" },
  { label: "Jewelry", href: "/collections/jewelry" },
];

export const hero = {
  image: unsplash("1539109136881-3be0616acf4b", 2000),
  alt: "Woman in a pale blue coat standing in a cathedral square",
};

export const collections: Collection[] = [
  {
    slug: "women",
    title: "Women",
    image: unsplash("1566174053879-31528523f8ae", 1400),
    alt: "Woman in a deep purple off-shoulder dress",
  },
  {
    slug: "men",
    title: "Men",
    image: unsplash("1507679799987-c73779587ccf", 1400),
    alt: "Man adjusting the jacket of a navy suit",
  },
];

export const editorial = {
  image: unsplash("1445205170230-053b83016050", 1400),
  alt: "Knitwear and shirts hanging on a warmly lit rail",
};

type ProductSeed = Omit<Product, "image" | "gallery"> & {
  photo: string;
  focus: [Focus, Focus];
};

const productSeeds: ProductSeed[] = [
  {
    slug: "round-metal-sunglasses",
    name: "Round Metal Sunglasses",
    category: "Eyewear",
    price: 245,
    photo: "1511499767150-a48a237f0083",
    focus: [[0.5, 0.5, 2], [0.3, 0.5, 2.6]],
    alt: "Round gold-framed sunglasses with green lenses",
    isNew: true,
    stock: 14,
    description:
      "Lightweight round sunglasses with a fine metal frame and bottle-green lenses. A quiet shape that works with everything.",
    details: ["Gold-tone metal frame", "Green UV400 lenses", "Adjustable nose pads", "Includes case and cloth"],
  },
  {
    slug: "structured-top-handle-bag",
    name: "Structured Top-Handle Bag",
    category: "Bags",
    price: 1290,
    photo: "1584917865442-de89df76afd3",
    focus: [[0.5, 0.22, 2], [0.75, 0.8, 2.2]],
    alt: "Red leather top-handle bag on a white plinth",
    stock: 6,
    description:
      "A rigid, architectural bag in smooth calfskin, with a polished metal clasp and room for the essentials.",
    details: ["Smooth calfskin leather", "Polished metal clasp", "Suede-lined interior", "Made in Italy"],
  },
  {
    slug: "crochet-fringe-poncho",
    name: "Crochet Fringe Poncho",
    category: "Knitwear",
    price: 320,
    photo: "1434389677669-e08b4cac3105",
    focus: [[0.5, 0.3, 2], [0.5, 0.85, 2.4]],
    alt: "Cream crochet poncho with fringe on a wooden hanger",
    isNew: true,
    stock: 3,
    description:
      "An open-knit poncho in soft cotton, finished with a hand-knotted fringe. Easy to layer over a shirt or dress.",
    details: ["100% cotton", "Hand-knotted fringe", "One size", "Hand wash cold"],
  },
  {
    slug: "floral-wrap-dress",
    name: "Floral Wrap Dress",
    category: "Dresses",
    price: 480,
    photo: "1496747611176-843222e1e57c",
    focus: [[0.5, 0.45, 2], [0.45, 0.2, 2.4]],
    alt: "White floral wrap dress by the sea",
    stock: 9,
    description:
      "A fluid wrap dress in a light viscose crepe with a printed rose pattern and a flattering tie waist.",
    details: ["Viscose crepe", "Wrap front with tie waist", "Midi length", "Machine wash gentle"],
  },
  {
    slug: "halo-diamond-ring",
    name: "Halo Diamond Ring",
    category: "Jewelry",
    price: 2150,
    photo: "1605100804763-247f67b3557e",
    focus: [[0.5, 0.45, 2], [0.65, 0.55, 3]],
    alt: "Diamond halo ring on a dark surface",
    stock: 2,
    description:
      "A round brilliant stone ringed by pavé diamonds, set in recycled 18k gold with a split shoulder.",
    details: ["Recycled 18k gold", "Round brilliant centre stone", "Pavé halo", "Presented in a gift box"],
  },
  {
    slug: "tailored-wool-suit",
    name: "Tailored Wool Suit",
    category: "Tailoring",
    price: 1450,
    photo: "1617137968427-85924c800a22",
    focus: [[0.5, 0.35, 2], [0.5, 0.75, 2.4]],
    alt: "Man in a navy tailored suit walking past glass",
    isNew: true,
    stock: 0,
    description:
      "A two-piece suit in navy wool with a soft shoulder and a slim, tapered leg. Half-canvassed for a clean drape.",
    details: ["Super 110s wool", "Half-canvassed jacket", "Two-button, notch lapel", "Dry clean only"],
  },
  {
    slug: "garment-dyed-cotton-tee",
    name: "Garment-Dyed Cotton Tee",
    category: "Essentials",
    price: 95,
    photo: "1523381210434-271e8be1f52b",
    focus: [[0.5, 0.5, 1.6], [0.4, 0.7, 2.4]],
    alt: "Sage green t-shirts hanging on wooden hangers",
    stock: 40,
    description:
      "A heavyweight tee, garment-dyed in sage for a lived-in finish that softens with every wash.",
    details: ["Heavyweight cotton jersey", "Garment-dyed", "Relaxed fit", "Machine wash cold"],
  },
  {
    slug: "floral-print-handbag",
    name: "Floral Print Handbag",
    category: "Bags",
    price: 1180,
    photo: "1591561954557-26941169b49e",
    focus: [[0.5, 0.75, 2], [0.75, 0.65, 2.4]],
    alt: "Handbag with a pastel floral print",
    stock: 5,
    description:
      "A structured handbag in canvas with an all-over pastel floral print and leather-trimmed handles.",
    details: ["Printed coated canvas", "Leather-trimmed handles", "Interior zip pocket", "Made in Italy"],
  },
];

export const products: Product[] = productSeeds.map(({ photo, focus, ...product }) => ({
  ...product,
  image: unsplash(photo, 900),
  gallery: [
    { src: unsplash(photo, 1400), alt: product.alt },
    { src: closeUp(photo, focus[0], 1000), alt: `${product.name}, close-up` },
    { src: closeUp(photo, focus[1], 1000), alt: `${product.name}, detail` },
  ],
}));

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const getRelatedProducts = (product: Product, limit = 6) =>
  products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, limit);

export const getStockState = (stock: number): StockState =>
  stock <= 0 ? "out-of-stock" : stock <= 3 ? "low-stock" : "in-stock";

export const services = [
  { title: "Complimentary Shipping", text: "On every order, delivered in 2–4 business days." },
  { title: "Easy Returns", text: "Return any item within 30 days of delivery." },
  { title: "Gift Wrapping", text: "Presented in our signature packaging." },
  { title: "Client Care", text: "Our advisors are available seven days a week." },
];

export const footerLinks = [
  { title: "Client Care", links: ["Contact Us", "Shipping", "Returns", "Order Status"] },
  { title: "The House", links: ["About Alberbts", "Careers", "Stores", "Sustainability"] },
  { title: "Legal", links: ["Terms of Use", "Privacy Policy", "Cookie Settings"] },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
