/**
 * Chat Themes
 *
 * Amaç: Sohbet temaları - Instagram tarzı
 * Tarih: 2025-12-02
 *
 * Her tema dark ve light mod için ayrı renkler içerir.
 * İpelya teması uygulama accent rengini kullanır (dinamik).
 */

export type ChatThemeId =
  | "ipelya"
  | "love"
  | "night"
  | "nature"
  | "ocean"
  | "sunset"
  | "neon"
  | "vintage";

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
  // Dark ve Light mod renkleri
  dark: ThemeColors;
  light: ThemeColors;
  // Aktif renkler (runtime'da set edilir)
  colors: ThemeColors;
  // Partiküller (animasyonlu arka plan)
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

// İpelya teması için placeholder - runtime'da ThemeProvider'dan alınacak
const IPELYA_PLACEHOLDER = "__IPELYA__";

// Tema tanımları
const THEME_DEFINITIONS: Record<ChatThemeId, Omit<ChatTheme, "colors">> = {
  // Varsayılan İpelya teması - Uygulama accent rengini kullanır (dinamik)
  ipelya: {
    id: "ipelya",
    name: "İpelya",
    emoji: "✨",
    description: "Varsayılan tema",
    dark: {
      background: IPELYA_PLACEHOLDER,
      ownBubble: IPELYA_PLACEHOLDER,
      ownBubbleText: "#FFFFFF",
      otherBubble: IPELYA_PLACEHOLDER,
      otherBubbleText: "#FFFFFF",
      accent: IPELYA_PLACEHOLDER,
      inputBackground: IPELYA_PLACEHOLDER,
      safeAreaBackground: IPELYA_PLACEHOLDER
    },
    light: {
      background: IPELYA_PLACEHOLDER,
      ownBubble: IPELYA_PLACEHOLDER,
      ownBubbleText: "#FFFFFF",
      otherBubble: IPELYA_PLACEHOLDER,
      otherBubbleText: "#000000",
      accent: IPELYA_PLACEHOLDER,
      inputBackground: IPELYA_PLACEHOLDER,
      safeAreaBackground: IPELYA_PLACEHOLDER
    }
  },

  // Sevgi teması
  love: {
    id: "love",
    name: "Sevgi",
    emoji: "❤️",
    description: "Romantik kalpler",
    dark: {
      background: "#1a0a0f",
      backgroundGradient: ["#1a0a0f", "#2d1018", "#1a0a0f"],
      ownBubble: "#E91E63",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#2d1018",
      otherBubbleText: "#FFFFFF",
      accent: "#E91E63",
      inputBackground: "#2d1018",
      safeAreaBackground: "#1a0a0f"
    },
    light: {
      background: "#FFF0F5",
      backgroundGradient: ["#FFF0F5", "#FFE4EC", "#FFF0F5"],
      ownBubble: "#E91E63",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#FFE4EC",
      otherBubbleText: "#1a0a0f",
      accent: "#E91E63",
      inputBackground: "#FFE4EC",
      safeAreaBackground: "#FFF0F5"
    },
    particles: {
      emoji: "❤️",
      count: 15,
      speed: "slow"
    },
    pattern: {
      type: "hearts",
      opacity: 0.05
    }
  },

  // Gece teması
  night: {
    id: "night",
    name: "Gece",
    emoji: "🌙",
    description: "Yıldızlı gece",
    dark: {
      background: "#0a0a1a",
      backgroundGradient: ["#0a0a1a", "#1a1a3a", "#0a0a1a"],
      ownBubble: "#5B21B6",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#1a1a2e",
      otherBubbleText: "#FFFFFF",
      accent: "#8B5CF6",
      inputBackground: "#1a1a2e",
      safeAreaBackground: "#0a0a1a"
    },
    light: {
      background: "#F0F0FF",
      backgroundGradient: ["#F0F0FF", "#E8E8FF", "#F0F0FF"],
      ownBubble: "#7C3AED",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#E8E8FF",
      otherBubbleText: "#1a1a2e",
      accent: "#8B5CF6",
      inputBackground: "#E8E8FF",
      safeAreaBackground: "#F0F0FF"
    },
    particles: {
      emoji: "⭐",
      count: 20,
      speed: "slow"
    },
    pattern: {
      type: "stars",
      opacity: 0.08
    }
  },

  // Doğa teması
  nature: {
    id: "nature",
    name: "Doğa",
    emoji: "🌿",
    description: "Huzurlu yeşillik",
    dark: {
      background: "#0a1a0f",
      backgroundGradient: ["#0a1a0f", "#0f2a18", "#0a1a0f"],
      ownBubble: "#059669",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#0f2a18",
      otherBubbleText: "#FFFFFF",
      accent: "#10B981",
      inputBackground: "#0f2a18",
      safeAreaBackground: "#0a1a0f"
    },
    light: {
      background: "#F0FFF4",
      backgroundGradient: ["#F0FFF4", "#E6FFED", "#F0FFF4"],
      ownBubble: "#059669",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#E6FFED",
      otherBubbleText: "#0f2a18",
      accent: "#10B981",
      inputBackground: "#E6FFED",
      safeAreaBackground: "#F0FFF4"
    },
    particles: {
      emoji: "🍃",
      count: 12,
      speed: "medium"
    },
    pattern: {
      type: "leaves",
      opacity: 0.06
    }
  },

  // Okyanus teması
  ocean: {
    id: "ocean",
    name: "Okyanus",
    emoji: "🌊",
    description: "Derin mavi",
    dark: {
      background: "#0a1520",
      backgroundGradient: ["#0a1520", "#0f2535", "#0a1520"],
      ownBubble: "#0284C7",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#0f2535",
      otherBubbleText: "#FFFFFF",
      accent: "#0EA5E9",
      inputBackground: "#0f2535",
      safeAreaBackground: "#0a1520"
    },
    light: {
      background: "#F0F9FF",
      backgroundGradient: ["#F0F9FF", "#E0F2FE", "#F0F9FF"],
      ownBubble: "#0284C7",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#E0F2FE",
      otherBubbleText: "#0f2535",
      accent: "#0EA5E9",
      inputBackground: "#E0F2FE",
      safeAreaBackground: "#F0F9FF"
    },
    particles: {
      emoji: "💧",
      count: 10,
      speed: "slow"
    },
    pattern: {
      type: "waves",
      opacity: 0.05
    }
  },

  // Gün batımı teması
  sunset: {
    id: "sunset",
    name: "Gün Batımı",
    emoji: "🌅",
    description: "Sıcak tonlar",
    dark: {
      background: "#1a0f0a",
      backgroundGradient: ["#1a0f0a", "#2a1810", "#1a0f0a"],
      ownBubble: "#EA580C",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#2a1810",
      otherBubbleText: "#FFFFFF",
      accent: "#F97316",
      inputBackground: "#2a1810",
      safeAreaBackground: "#1a0f0a"
    },
    light: {
      background: "#FFF7ED",
      backgroundGradient: ["#FFF7ED", "#FFEDD5", "#FFF7ED"],
      ownBubble: "#EA580C",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#FFEDD5",
      otherBubbleText: "#2a1810",
      accent: "#F97316",
      inputBackground: "#FFEDD5",
      safeAreaBackground: "#FFF7ED"
    },
    particles: {
      emoji: "🌟",
      count: 8,
      speed: "slow"
    }
  },

  // Neon teması
  neon: {
    id: "neon",
    name: "Neon",
    emoji: "💜",
    description: "Canlı renkler",
    dark: {
      background: "#0a0a0a",
      backgroundGradient: ["#0a0a0a", "#1a0a1a", "#0a0a0a"],
      ownBubble: "#D946EF",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#1a0a1a",
      otherBubbleText: "#FFFFFF",
      accent: "#E879F9",
      inputBackground: "#1a0a1a",
      safeAreaBackground: "#0a0a0a"
    },
    light: {
      background: "#FDF4FF",
      backgroundGradient: ["#FDF4FF", "#FAE8FF", "#FDF4FF"],
      ownBubble: "#D946EF",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#FAE8FF",
      otherBubbleText: "#1a0a1a",
      accent: "#E879F9",
      inputBackground: "#FAE8FF",
      safeAreaBackground: "#FDF4FF"
    },
    pattern: {
      type: "dots",
      opacity: 0.03
    }
  },

  // Vintage teması
  vintage: {
    id: "vintage",
    name: "Vintage",
    emoji: "📜",
    description: "Klasik görünüm",
    dark: {
      background: "#1a1815",
      backgroundGradient: ["#1a1815", "#252018", "#1a1815"],
      ownBubble: "#92400E",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#252018",
      otherBubbleText: "#F5F5DC",
      accent: "#D97706",
      inputBackground: "#252018",
      safeAreaBackground: "#1a1815"
    },
    light: {
      background: "#FFFBEB",
      backgroundGradient: ["#FFFBEB", "#FEF3C7", "#FFFBEB"],
      ownBubble: "#92400E",
      ownBubbleText: "#FFFFFF",
      otherBubble: "#FEF3C7",
      otherBubbleText: "#1a1815",
      accent: "#D97706",
      inputBackground: "#FEF3C7",
      safeAreaBackground: "#FFFBEB"
    }
  }
};

// Tema listesi (seçim için) - ipelya hariç, o dinamik
export const THEME_LIST = Object.values(THEME_DEFINITIONS).map((t) => ({
  ...t,
  colors: t.dark // Varsayılan olarak dark
})) as ChatTheme[];

// ThemeProvider renkleri için interface
interface AppThemeColors {
  background: string;
  surface: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
}

// Tema al (dark/light mode'a göre + app renkleri)
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

// Varsayılan tema (fallback)
export function getDefaultTheme(isDarkMode: boolean = true): ChatTheme {
  return {
    ...THEME_DEFINITIONS.ipelya,
    colors: isDarkMode ? THEME_DEFINITIONS.ipelya.dark : THEME_DEFINITIONS.ipelya.light
  };
}

// Sadece tema ID'sinden temel bilgileri al (dark/light bağımsız)
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
