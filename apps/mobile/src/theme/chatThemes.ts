/**
 * Chat Themes - Re-export
 *
 * Bu dosya geriye dönük uyumluluk için tutulmuştur.
 * Yeni importlar için: @/theme/chatThemes (klasör)
 *
 * MODÜLER YAPI:
 * - chatThemes/types.ts: Tip tanımları
 * - chatThemes/themes/: Her tema ayrı dosyada
 * - chatThemes/index.ts: Ana export
 *
 * YENİ TEMA EKLEMEK İÇİN:
 * 1. chatThemes/themes/ klasörüne yeni tema dosyası oluştur
 * 2. chatThemes/themes/index.ts'e export ekle
 * 3. chatThemes/types.ts'deki ChatThemeId'ye yeni ID'yi ekle
 * 4. chatThemes/index.ts'deki THEME_DEFINITIONS'a temayı ekle
 * 5. Edge function'ı güncelle: supabase/functions/update-conversation-theme
 *    - VALID_THEMES array'ine tema ID'sini ekle
 *    - THEME_NAMES object'ine Türkçe adını ekle
 */

// Re-export everything from the modular structure
export * from "./chatThemes/index";
