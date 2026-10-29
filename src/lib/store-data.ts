// Static site content (navigation, hero and collection tiles, services, footer).
// Products, categories and stock live in the database: see src/lib/catalog.ts.

export const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

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
