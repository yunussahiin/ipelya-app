/**
 * IAP Product Definitions
 * Store'da tanımlanan ürünlerin konfigürasyonu
 */

// Coin paketleri
export const COIN_PRODUCTS = [
  { id: 'ipelya_coins_100', coins: 100, bonus: 0, price: '₺29.99', popular: false },
  { id: 'ipelya_coins_500', coins: 500, bonus: 50, price: '₺129.99', popular: true },
  { id: 'ipelya_coins_1000', coins: 1000, bonus: 150, price: '₺249.99', popular: false },
] as const;

// Alias for screens
export const COIN_PACKAGES = COIN_PRODUCTS;

// Platform abonelikleri (App Store/Google Play üzerinden)
export const PLATFORM_SUBSCRIPTION_PRODUCTS = [
  { id: 'ipelya_premium_monthly', period: 'monthly' as const, price: '₺79.99/ay', title: 'Aylık Premium', features: ['Reklamsız deneyim', 'Özel rozetler', 'Öncelikli destek'] },
  { id: 'ipelya_premium_yearly', period: 'yearly' as const, price: '₺599.99/yıl', title: 'Yıllık Premium', features: ['Reklamsız deneyim', 'Özel rozetler', 'Öncelikli destek', '2 ay ücretsiz'] },
] as const;

// Alias for screens
export const PLATFORM_SUBSCRIPTIONS = PLATFORM_SUBSCRIPTION_PRODUCTS;

// Hediye tipleri
export const GIFT_TYPES = {
  heart: { id: 'heart', name: 'Kalp', cost: 10, emoji: '❤️' },
  rose: { id: 'rose', name: 'Gül', cost: 25, emoji: '🌹' },
  star: { id: 'star', name: 'Yıldız', cost: 50, emoji: '⭐' },
  fire: { id: 'fire', name: 'Ateş', cost: 75, emoji: '🔥' },
  diamond: { id: 'diamond', name: 'Elmas', cost: 100, emoji: '💎' },
  crown: { id: 'crown', name: 'Taç', cost: 500, emoji: '👑' },
} as const;

// Önerilen tier şablonları (Creator'lar için)
export const SUGGESTED_TIER_TEMPLATES = [
  { name: 'Bronze', coinPrice: 50, benefits: ['Özel içerikler'] },
  { name: 'Silver', coinPrice: 150, benefits: ['Özel içerikler', 'DM erişimi'] },
  { name: 'Gold', coinPrice: 300, benefits: ['Özel içerikler', 'DM erişimi', 'Canlı yayın'] },
  { name: 'Diamond', coinPrice: 500, benefits: ['Özel içerikler', 'DM erişimi', 'Canlı yayın', '1-1 görüşme'] },
] as const;

// Type exports
export type CoinProductId = typeof COIN_PRODUCTS[number]['id'];
export type PlatformSubscriptionProductId = typeof PLATFORM_SUBSCRIPTION_PRODUCTS[number]['id'];
export type GiftType = keyof typeof GIFT_TYPES;

// Helper functions
export function getCoinProduct(id: string) {
  return COIN_PRODUCTS.find(p => p.id === id);
}

export function getGiftType(type: string) {
  return GIFT_TYPES[type as GiftType];
}

export function getTotalCoins(productId: string): number {
  const product = getCoinProduct(productId);
  return product ? product.coins + product.bonus : 0;
}
