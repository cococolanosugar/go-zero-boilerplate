export const APP_NAME = "Go-Zero Boilerplate";

export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
