/**
 * IAP Product Definitions
 * Store'da tanımlanan ürünlerin konfigürasyonu
 * 
 * NOT: Tier Benefits ve Templates artık veritabanından yönetilir.
 * Güncel veri için useTierTemplates hook'unu kullanın:
 * @see /src/hooks/useTierTemplates.ts
 * 
 * Bu dosyadaki TIER_BENEFITS ve SUGGESTED_TIER_TEMPLATES
 * sadece fallback olarak kullanılır (offline/hata durumlarında).
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

/**
 * Standart Tier Avantajları (Fallback)
 * 
 * ⚠️ Bu liste sadece fallback olarak kullanılır!
 * Güncel veri için useTierTemplates hook'unu kullanın.
 * 
 * Veritabanı tablosu: tier_benefits
 * Edge function: get-tier-benefits
 * Web ops panelinden yönetilebilir.
 */
export const TIER_BENEFITS = [
  // 📺 İçerik Kategorisi
  { id: 'exclusive_stories', name: 'Özel Hikayeler', description: 'Sadece abonelerin görebileceği özel story paylaşımları', emoji: '📖', category: 'content' },
  { id: 'exclusive_broadcast', name: 'Özel Broadcast Kanalı', description: 'Sadece abonelerin erişebildiği özel yayın kanalı', emoji: '�', category: 'content' },
  { id: 'archive_access', name: 'Arşiv Erişimi', description: 'Geçmiş özel içeriklere ve silinmiş paylaşımlara erişim', emoji: '�️', category: 'content' },
  { id: 'media_packages', name: 'Özel Foto/Video Paketleri', description: 'Creator\'ın sadece abonelere verdiği özel media paketleri', emoji: '📦', category: 'content' },
  { id: 'personal_video', name: 'Kişisel Video Mesaj', description: 'Ayda 1 kez abonelere özel hazırlanmış kişisel video mesajı', emoji: '🎬', category: 'content' },
  { id: 'weekly_summary', name: 'Haftalık Abone Özeti', description: 'Creator\'ın haftalık olarak abonelere özel kısa bir özet paylaşması', emoji: '📋', category: 'content' },
  { id: 'subscriber_surprises', name: 'Abone Sürprizleri', description: 'Ayda 1 kez rastgele bonus içerik (özel foto, voice note, mini vlog)', emoji: '�', category: 'content' },
  
  // 💬 İletişim Kategorisi
  { id: 'voice_message', name: 'Sesli Mesaj Gönderimi', description: 'Creator\'ın abonelere DM\'den özel ses kaydı göndermesi', emoji: '🎤', category: 'communication', hasLimit: true, limitType: 'monthly' },
  { id: 'dm_access', name: 'Creator\'a DM Gönderimi', description: 'DM atan abonelere daha hızlı dönüş yapılması', emoji: '�', category: 'communication' },
  { id: 'priority_dm', name: 'Öncelikli DM', description: 'Mesajlarınız öncelikli olarak görülür', emoji: '⚡', category: 'communication' },
  { id: 'mini_group_chat', name: 'Mini Grup Sohbeti', description: 'Sadece abonelerden oluşan küçük özel sohbet gruplarına erişim', emoji: '👥', category: 'communication' },
  { id: 'vip_question', name: 'VIP Soru Hakkı', description: 'Canlı yayınlarda soru sorabilme', emoji: '❓', category: 'communication' },
  
  // 🎁 Ekstra Kategorisi
  { id: 'early_notifications', name: 'Erken Duyuru Bildirimleri', description: 'Yeni içerik, canlı yayın veya etkinliği herkesten önce öğrenme', emoji: '�', category: 'perks' },
  { id: 'premium_badge', name: 'Premium Profil Rozeti', description: 'Abonenin profilinde daha özel ve dikkat çekici bir rozet görünmesi', emoji: '�', category: 'perks' },
  { id: 'special_stickers', name: 'Özel Sticker ve Reaksiyonlar', description: 'Sadece abonelerin kullanabildiği özel emoji/sticker setleri', emoji: '🎨', category: 'perks' },
  { id: 'birthday_message', name: 'Özel Gün Kutlaması', description: 'Doğum günü gibi özel günlerde creator\'dan kişisel mesaj', emoji: '🎂', category: 'perks' },
] as const;

export type TierBenefitId = typeof TIER_BENEFITS[number]['id'];

/**
 * Önerilen Tier Şablonları (Fallback)
 * 
 * ⚠️ Bu liste sadece fallback olarak kullanılır!
 * Güncel veri için useTierTemplates hook'unu kullanın.
 * 
 * Veritabanı tablosu: tier_templates
 * Edge function: get-tier-templates
 * Web ops panelinden yönetilebilir.
 * 
 * Creator'lar bu şablonlardan birini seçer,
 * fiyatları kendileri belirler, avantajları düzenleyebilir.
 */
export const SUGGESTED_TIER_TEMPLATES = [
  { 
    name: 'Bronze', 
    coinPrice: 50, 
    benefitIds: ['exclusive_stories', 'early_notifications'] as TierBenefitId[],
    emoji: '🥉',
    color: '#CD7F32',
    gradientColors: ['#CD7F32', '#8B4513'] as [string, string]
  },
  { 
    name: 'Silver', 
    coinPrice: 150, 
    benefitIds: ['exclusive_stories', 'exclusive_broadcast', 'dm_access', 'early_notifications'] as TierBenefitId[],
    emoji: '🥈',
    color: '#C0C0C0',
    gradientColors: ['#C0C0C0', '#808080'] as [string, string]
  },
  { 
    name: 'Gold', 
    coinPrice: 300, 
    benefitIds: ['exclusive_stories', 'exclusive_broadcast', 'archive_access', 'dm_access', 'priority_dm', 'premium_badge'] as TierBenefitId[],
    emoji: '🥇',
    color: '#FFD700',
    gradientColors: ['#FFD700', '#FFA500'] as [string, string]
  },
  { 
    name: 'Diamond', 
    coinPrice: 500, 
    benefitIds: ['exclusive_stories', 'exclusive_broadcast', 'archive_access', 'media_packages', 'priority_dm', 'vip_question', 'premium_badge', 'special_stickers'] as TierBenefitId[],
    emoji: '💎',
    color: '#B9F2FF',
    gradientColors: ['#E0B0FF', '#9370DB'] as [string, string]
  },
  { 
    name: 'VIP', 
    coinPrice: 1000, 
    benefitIds: ['exclusive_stories', 'exclusive_broadcast', 'archive_access', 'media_packages', 'personal_video', 'voice_message', 'priority_dm', 'mini_group_chat', 'vip_question', 'premium_badge', 'special_stickers', 'birthday_message'] as TierBenefitId[],
    emoji: '👑',
    color: '#FF6B6B',
    gradientColors: ['#FF6B6B', '#C44569'] as [string, string]
  },
] as const;

// Helper: Benefit ID'den benefit bilgisi al
export function getBenefitById(id: TierBenefitId) {
  return TIER_BENEFITS.find(b => b.id === id);
}

// Helper: Benefit ID listesinden benefit isimleri al
export function getBenefitNames(ids: TierBenefitId[]): string[] {
  return ids.map(id => getBenefitById(id)?.name || id).filter(Boolean);
}

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
