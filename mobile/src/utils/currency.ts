export const currencies = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
] as const;

export type Currency = (typeof currencies)[number];

export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
}
