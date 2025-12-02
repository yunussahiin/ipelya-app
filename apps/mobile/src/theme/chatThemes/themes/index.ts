/**
 * Chat Themes - Theme Exports
 *
 * Tüm temaları buradan export ediyoruz.
 *
 * YENİ TEMA EKLEMEK İÇİN:
 * 1. Bu klasöre yeni tema dosyası oluştur (örn: galaxy.ts)
 * 2. ThemeDefinition tipinde tema objesi export et
 * 3. Bu dosyaya import ve export ekle
 * 4. ../types.ts'deki ChatThemeId'ye yeni ID'yi ekle
 * 5. Edge function'ı güncelle: supabase/functions/update-conversation-theme
 *    - VALID_THEMES array'ine tema ID'sini ekle
 *    - THEME_NAMES object'ine Türkçe adını ekle
 */

// Varsayılan temalar
export { ipelyaTheme } from "./ipelya";
export { loveTheme } from "./love";
export { nightTheme } from "./night";
export { natureTheme } from "./nature";
export { oceanTheme } from "./ocean";
export { sunsetTheme } from "./sunset";
export { neonTheme } from "./neon";
export { vintageTheme } from "./vintage";
export { auroraTheme } from "./aurora";
export { cyberTheme } from "./cyber";
export { bokehTheme } from "./bokeh";

// Pack 1 - Emoji/Particle Temaları
export { starryNightTheme } from "./starry-night";
export { softHeartsTheme } from "./soft-hearts";
export { bubbleChatTheme } from "./bubble-chat";
export { sakuraBreezeTheme } from "./sakura-breeze";
export { cosmicSpaceTheme } from "./cosmic-space";

// Pack 2 - Abstract/Aurora/Bokeh Temaları
export { deepAuroraTheme } from "./deep-aurora";
export { sunriseAuroraTheme } from "./sunrise-aurora";
export { softBokehTheme } from "./soft-bokeh";
export { oceanBokehTheme } from "./ocean-bokeh";
export { glowLinesTheme } from "./glow-lines";

// Pack 3 - Nature/Seasonal Temaları
export { autumnLeavesTheme } from "./autumn-leaves";
export { calmForestTheme } from "./calm-forest";
export { snowyNightTheme } from "./snowy-night";
export { beachSunsetTheme } from "./beach-sunset";
export { rainyWindowTheme } from "./rainy-window";

// Pack 4 - Minimal/Tech Temaları
export { midnightMinimalTheme } from "./midnight-minimal";
export { codeMatrixTheme } from "./code-matrix";
export { neonPurpleTheme } from "./neon-purple";
export { blueprintChatTheme } from "./blueprint-chat";
export { focusDarkTheme } from "./focus-dark";

// Pack 5 - Love/Romantic Temaları
export { velvetLoveTheme } from "./velvet-love";
export { neonRomanceTheme } from "./neon-romance";
export { blushingChatTheme } from "./blushing-chat";
export { sakuraDateTheme } from "./sakura-date";
export { midnightCouplesTheme } from "./midnight-couples";
