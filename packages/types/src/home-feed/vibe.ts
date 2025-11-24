/**
 * Vibe & Intent Type Definitions
 * 
 * Amaç: Vibe Match ve Intent Match sisteminin type'larını tanımlar
 * 
 * Exports:
 * - VibeType: Mood tipleri
 * - IntentType: Dating intent tipleri
 * - UserVibe: Kullanıcı mood state
 * - UserIntent: Kullanıcı dating intent
 * - CrystalGift: Dijital hediye
 */

/**
 * Vibe Type
 * Kullanıcı mood/energy tipleri
 */
export type VibeType =
  | 'energetic'    // Enerjik, aktif
  | 'chill'        // Sakin, rahat
  | 'social'       // Sosyal, dışa dönük
  | 'creative'     // Yaratıcı, artistik
  | 'adventurous'; // Maceraperest, cesur

/**
 * Intent Type
 * Dating niyeti tipleri
 */
export type IntentType =
  | 'meet_new'              // Yeni insanlarla tanışmak
  | 'activity_partner'      // Aktivite arkadaşı aramak
  | 'flirt'                 // Flört
  | 'serious_relationship'; // Ciddi ilişki

/**
 * User Vibe
 * Kullanıcının mevcut mood durumu
 */
export interface UserVibe {
  id: string;
  user_id: string;
  vibe_type: VibeType;
  intensity: number; // 1-5 (1: hafif, 5: çok yoğun)
  created_at: string;
  expires_at: string; // 24 saat sonra expire olur
}

/**
 * User Intent
 * Kullanıcının dating niyeti
 */
export interface UserIntent {
  id: string;
  user_id: string;
  intent_type: IntentType;
  priority: number; // 1-5 (5: en yüksek öncelik)
  created_at: string;
  updated_at: string;
}

/**
 * Update Vibe Request
 * Vibe güncelleme request body
 */
export interface UpdateVibeRequest {
  vibe_type: VibeType;
  intensity: number; // 1-5
}

/**
 * Update Intent Request
 * Intent güncelleme request body
 */
export interface UpdateIntentRequest {
  intents: {
    intent_type: IntentType;
    priority: number; // 1-5
  }[];
}

/**
 * Crystal Gift Type
 * Dijital hediye tipleri
 */
export type CrystalGiftType =
  | 'energy_crystal'    // Enerji kristali
  | 'coffee'            // Kahve ikramı
  | 'motivation_card'   // Motivasyon kartı
  | 'flower'            // Çiçek
  | 'star';             // Yıldız

/**
 * Crystal Gift
 * Dijital hediye
 */
export interface CrystalGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  gift_type: CrystalGiftType;
  message?: string;
  is_opened: boolean;
  opened_at?: string;
  created_at: string;
}

/**
 * Send Gift Request
 * Hediye gönderme request body
 */
export interface SendGiftRequest {
  recipient_id: string;
  gift_type: CrystalGiftType;
  message?: string;
}
