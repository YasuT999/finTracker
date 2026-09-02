export function requireNonEmpty(value: string, field: string): string | null {
  if (!value || !value.trim()) return `${field} is required`;
  return null;
}

export function requirePositiveNumber(value: any, field: string): string | null {
  const n = Number(value);
  if (isNaN(n) || n < 0) return `${field} must be a positive number`;
  return null;
}

export function validateTransaction(amount: any, description: string, date: string, type: string): string | null {
  const n = Number(amount);
  if (!amount || isNaN(n) || n <= 0) return "Amount must be a positive number";
  if (!description.trim()) return "Description is required";
  if (!date) return "Date is required";
  if (!["income", "expense"].includes(type)) return "Type must be income or expense";
  return null;
}
