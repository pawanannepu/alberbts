// Pure helpers shared by server components. Keep this file free of database imports.

export type StockState = "in-stock" | "low-stock" | "out-of-stock";

export const LOW_STOCK_THRESHOLD = 3;

export const getStockState = (quantity: number): StockState =>
  quantity <= 0 ? "out-of-stock" : quantity <= LOW_STOCK_THRESHOLD ? "low-stock" : "in-stock";

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
