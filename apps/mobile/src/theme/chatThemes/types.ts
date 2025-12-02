/**
 * Chat Themes - Types
 *
 * Amaç: Sohbet temaları için tip tanımları
 * Tarih: 2025-12-02
 *
 * NOT: Yeni tema eklerken:
 * 1. ChatThemeId'ye yeni tema ID'sini ekle
 * 2. themes/ klasörüne yeni tema dosyası oluştur
 * 3. themes/index.ts'e export ekle
 * 4. Edge function'a tema ekle: supabase/functions/update-conversation-theme
 *    - VALID_THEMES array'ine tema ID'sini ekle
 *    - THEME_NAMES object'ine Türkçe adını ekle
 */

export type ChatThemeId =
  // Varsayılan temalar
  | "ipelya"
  | "love"
  | "night"
  | "nature"
  | "ocean"
  | "sunset"
  | "neon"
  | "vintage"
  | "aurora"
  | "cyber"
  | "bokeh"
  // Pack 1 - Emoji/Particle
  | "starry-night"
  | "soft-hearts"
  | "bubble-chat"
  | "sakura-breeze"
  | "cosmic-space"
  // Pack 2 - Abstract/Aurora/Bokeh
  | "deep-aurora"
  | "sunrise-aurora"
  | "soft-bokeh"
  | "ocean-bokeh"
  | "glow-lines"
  // Pack 3 - Nature/Seasonal
  | "autumn-leaves"
  | "calm-forest"
  | "snowy-night"
  | "beach-sunset"
  | "rainy-window"
  // Pack 4 - Minimal/Tech
  | "midnight-minimal"
  | "code-matrix"
  | "neon-purple"
  | "blueprint-chat"
  | "focus-dark"
  // Pack 5 - Love/Romantic
  | "velvet-love"
  | "neon-romance"
  | "blushing-chat"
  | "sakura-date"
  | "midnight-couples";

export interface ThemeColors {
  background: string;
  backgroundGradient?: string[];
  ownBubble: string;
  ownBubbleText: string;
  otherBubble: string;
  otherBubbleText: string;
  accent: string;
  inputBackground: string;
  safeAreaBackground: string;
}

export interface ChatTheme {
  id: ChatThemeId;
  name: string;
  emoji: string;
  description: string;
  dark: ThemeColors;
  light: ThemeColors;
  colors: ThemeColors; // Runtime'da dark veya light'tan atanır
  // Animasyon partikülleri
  particles?: {
    emoji: string;
    count: number;
    speed: "slow" | "medium" | "fast";
  };
  // Arka plan deseni
  pattern?: {
    type: "hearts" | "stars" | "leaves" | "waves" | "dots" | "none";
    opacity: number;
  };
}

// Tema tanımı (colors hariç - runtime'da eklenir)
export type ThemeDefinition = Omit<ChatTheme, "colors">;

// ThemeProvider renkleri için interface
export interface AppThemeColors {
  background: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
}
