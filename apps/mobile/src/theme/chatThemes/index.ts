/**
 * Chat Themes - Main Export
 *
 * Amaç: Sohbet temaları sistemi
 * Tarih: 2025-12-02
 *
 * MODÜLER YAPI:
 * - types.ts: Tip tanımları
 * - themes/: Her tema ayrı dosyada
 * - index.ts: Ana export ve yardımcı fonksiyonlar
 *
 * YENİ TEMA EKLEMEK İÇİN:
 * 1. themes/ klasörüne yeni tema dosyası oluştur
 * 2. themes/index.ts'e export ekle
 * 3. types.ts'deki ChatThemeId'ye yeni ID'yi ekle
 * 4. Bu dosyadaki THEME_DEFINITIONS'a temayı ekle
 * 5. Edge function'ı güncelle: supabase/functions/update-conversation-theme
 *    - VALID_THEMES array'ine tema ID'sini ekle
 *    - THEME_NAMES object'ine Türkçe adını ekle
 */

// Types
export type { ChatThemeId, ThemeColors, ChatTheme, ThemeDefinition, AppThemeColors } from "./types";

// Individual themes (for direct import if needed)
export * from "./themes";

// Import all themes
import {
  // Varsayılan temalar
  ipelyaTheme,
  loveTheme,
  nightTheme,
  natureTheme,
  oceanTheme,
  sunsetTheme,
  neonTheme,
  vintageTheme,
  auroraTheme,
  cyberTheme,
  bokehTheme,
  // Pack 1 - Emoji/Particle
  starryNightTheme,
  softHeartsTheme,
  bubbleChatTheme,
  sakuraBreezeTheme,
  cosmicSpaceTheme,
  // Pack 2 - Abstract/Aurora/Bokeh
  deepAuroraTheme,
  sunriseAuroraTheme,
  softBokehTheme,
  oceanBokehTheme,
  glowLinesTheme,
  // Pack 3 - Nature/Seasonal
  autumnLeavesTheme,
  calmForestTheme,
  snowyNightTheme,
  beachSunsetTheme,
  rainyWindowTheme,
  // Pack 4 - Minimal/Tech
  midnightMinimalTheme,
  codeMatrixTheme,
  neonPurpleTheme,
  blueprintChatTheme,
  focusDarkTheme,
  // Pack 5 - Love/Romantic
  velvetLoveTheme,
  neonRomanceTheme,
  blushingChatTheme,
  sakuraDateTheme,
  midnightCouplesTheme
} from "./themes";

import type { ChatThemeId, ChatTheme, ThemeDefinition, AppThemeColors } from "./types";

// =============================================
// THEME DEFINITIONS
// =============================================

const THEME_DEFINITIONS: Record<ChatThemeId, ThemeDefinition> = {
  // Varsayılan temalar
  ipelya: ipelyaTheme,
  love: loveTheme,
  night: nightTheme,
  nature: natureTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  neon: neonTheme,
  vintage: vintageTheme,
  aurora: auroraTheme,
  cyber: cyberTheme,
  bokeh: bokehTheme,
  // Pack 1 - Emoji/Particle
  "starry-night": starryNightTheme,
  "soft-hearts": softHeartsTheme,
  "bubble-chat": bubbleChatTheme,
  "sakura-breeze": sakuraBreezeTheme,
  "cosmic-space": cosmicSpaceTheme,
  // Pack 2 - Abstract/Aurora/Bokeh
  "deep-aurora": deepAuroraTheme,
  "sunrise-aurora": sunriseAuroraTheme,
  "soft-bokeh": softBokehTheme,
  "ocean-bokeh": oceanBokehTheme,
  "glow-lines": glowLinesTheme,
  // Pack 3 - Nature/Seasonal
  "autumn-leaves": autumnLeavesTheme,
  "calm-forest": calmForestTheme,
  "snowy-night": snowyNightTheme,
  "beach-sunset": beachSunsetTheme,
  "rainy-window": rainyWindowTheme,
  // Pack 4 - Minimal/Tech
  "midnight-minimal": midnightMinimalTheme,
  "code-matrix": codeMatrixTheme,
  "neon-purple": neonPurpleTheme,
  "blueprint-chat": blueprintChatTheme,
  "focus-dark": focusDarkTheme,
  // Pack 5 - Love/Romantic
  "velvet-love": velvetLoveTheme,
  "neon-romance": neonRomanceTheme,
  "blushing-chat": blushingChatTheme,
  "sakura-date": sakuraDateTheme,
  "midnight-couples": midnightCouplesTheme
};

// =============================================
// EXPORTS
// =============================================

/**
 * Tema listesi (seçim UI'ı için)
 */
export const THEME_LIST = Object.values(THEME_DEFINITIONS).map((t) => ({
  ...t,
  colors: t.dark // Varsayılan olarak dark
})) as ChatTheme[];

/**
 * Tema al (dark/light mode'a göre + app renkleri)
 *
 * @param themeId - Tema ID'si
 * @param isDarkMode - Dark mode aktif mi
 * @param appColors - ThemeProvider'dan gelen app renkleri (ipelya teması için)
 */
export function getChatTheme(
  themeId: ChatThemeId | string | null | undefined,
  isDarkMode: boolean = true,
  appColors?: AppThemeColors
): ChatTheme {
  const id = themeId && themeId in THEME_DEFINITIONS ? (themeId as ChatThemeId) : "ipelya";
  const theme = THEME_DEFINITIONS[id];
  let colors = isDarkMode ? { ...theme.dark } : { ...theme.light };

  // İpelya teması için app renklerini kullan
  if (id === "ipelya" && appColors) {
    colors = {
      background: appColors.background,
      ownBubble: appColors.accent,
      ownBubbleText: "#FFFFFF",
      otherBubble: appColors.surface,
      otherBubbleText: appColors.textPrimary,
      accent: appColors.accent,
      inputBackground: appColors.surface,
      safeAreaBackground: appColors.background
    };
  }

  return {
    ...theme,
    colors
  };
}

/**
 * Varsayılan tema (fallback)
 */
export function getDefaultTheme(isDarkMode: boolean = true): ChatTheme {
  return {
    ...THEME_DEFINITIONS.ipelya,
    colors: isDarkMode ? THEME_DEFINITIONS.ipelya.dark : THEME_DEFINITIONS.ipelya.light
  };
}

/**
 * Sadece tema ID'sinden temel bilgileri al (dark/light bağımsız)
 */
export function getThemeInfo(themeId: ChatThemeId | string | null | undefined) {
  const id = themeId && themeId in THEME_DEFINITIONS ? (themeId as ChatThemeId) : "ipelya";
  const theme = THEME_DEFINITIONS[id];
  return {
    id: theme.id,
    name: theme.name,
    emoji: theme.emoji,
    description: theme.description,
    particles: theme.particles,
    pattern: theme.pattern
  };
}
