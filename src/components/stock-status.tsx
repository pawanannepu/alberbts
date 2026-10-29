import { getStockState } from "@/lib/store-data";

const copy = {
  "in-stock": { text: () => "In stock", dot: "bg-ink" },
  "low-stock": { text: (n: number) => `Only ${n} left`, dot: "bg-danger" },
  "out-of-stock": { text: () => "Out of stock", dot: "border border-muted" },
};

export function StockStatus({ stock }: { stock: number }) {
  const state = getStockState(stock);
  const { text, dot } = copy[state];
  return (
    <p className="flex items-center gap-2 text-body" data-stock={state}>
      <span aria-hidden className={`size-2 rounded-full ${dot}`} />
      <span className={state === "out-of-stock" ? "text-muted" : undefined}>{text(stock)}</span>
    </p>
  );
}
