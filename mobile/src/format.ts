export const CURRENCY = "$";

export function formatCurrency(n: number, symbol: string = CURRENCY): string {
  const v = Number(n) || 0;
  return `${symbol}${v.toFixed(2)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function pct(spent: number, budget: number): number {
  if (!budget || budget <= 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}
