/**
 * priceUtils.ts
 * Implements strict German PAngV base price (Grundpreis) calculations.
 */

export function formatGrundpreis(priceEur: number, volumeMl?: number | null): string | null {
  if (!volumeMl || volumeMl <= 0) return null;

  // Calculate price per 100ml
  // For example: €10 for 50ml -> €20 for 100ml
  const pricePer100 = (priceEur / volumeMl) * 100;

  // Format with German locale to get comma instead of dot, e.g. "20,00"
  // But let's just stick to standard output requested: €X / 100 ml
  // Using Intl.NumberFormat for EU style:
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pricePer100);

  // Example output: "20,00 € / 100ml" (Since Intl.NumberFormat adds the symbol)
  return `${formatted} / 100ml`;
}
