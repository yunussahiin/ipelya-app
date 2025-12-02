/**
 * Finance Utilities
 * Server ve client component'lerde kullanılabilir helper fonksiyonlar
 */

export function formatCoin(amount: number): string {
  return new Intl.NumberFormat("tr-TR").format(amount);
}

export function formatTL(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function coinToTL(coinAmount: number, rate: number): number {
  return coinAmount * rate;
}
