## Pack 4 – Love / Romantic Themes (21–25)



```ts
// pack-5-love.ts

import type { ChatTheme } from "./chatThemes.types";

export const LOVE_THEMES_PACK_5: ChatTheme[] = [
  {
    id: "velvet-love",
    name: "Velvet Love",
    description:
      "Kadife kırmızısı gradient, yumuşak kalp partikülleri ve hafif bokeh. Tam “date night” DM teması.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#19010A",
        backgroundGradient: ["#19010A", "#240211", "#2C0418"],
        pattern: {
          type: "dots",
          opacity: 0.18
        },
        particles: {
          emoji: "❤️",
          count: 16,
          speed: "slow"
        },
        wallpaper: {
          // deep red velvet / romantic gradient wallpaper
          blurRadius: 18,
          dimOpacity: 0.55
        }
      },
      light: {
        background: "#FFF1F4",
        backgroundGradient: ["#FFF1F4", "#FFE0E8"],
        pattern: {
          type: "dots",
          opacity: 0.12
        },
        particles: {
          emoji: "❤️",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.22
        }
      }
    }
  },
  {
    id: "neon-romance",
    name: "Neon Romance",
    description:
      "Koyu mor-pembe zeminde neon kalp glow’ları ve çizgileri. Daha modern, club vibe’lı aşk teması.",
    effect: "neon-grid",
    variants: {
      dark: {
        background: "#140021",
        backgroundGradient: ["#140021", "#1C022E", "#230338"],
        pattern: {
          type: "waves",
          opacity: 0.22
        },
        particles: {
          emoji: "💜",
          count: 14,
          speed: "medium"
        },
        wallpaper: {
          // neon heart sign / cyberpink wallpaper
          blurRadius: 20,
          dimOpacity: 0.60
        }
      },
      light: {
        background: "#FBE9FF",
        backgroundGradient: ["#FBE9FF", "#F4E3FF"],
        pattern: {
          type: "waves",
          opacity: 0.14
        },
        particles: {
          emoji: "💜",
          count: 10,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.24
        }
      }
    }
  },
  {
    id: "blushing-chat",
    name: "Blushing Chat",
    description:
      "Pastel pembe/şeftali gradient, ufak kalp ve sparkle karışımı. Daha soft, casual love teması.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#1A0711",
        backgroundGradient: ["#1A0711", "#220818", "#2A0A21"],
        pattern: {
          type: "soft-stars",
          opacity: 0.16
        },
        particles: {
          emoji: "✨",
          count: 12,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 18,
          dimOpacity: 0.50
        }
      },
      light: {
        background: "#FFEFF5",
        backgroundGradient: ["#FFEFF5", "#FFE2ED"],
        pattern: {
          type: "soft-stars",
          opacity: 0.12
        },
        particles: {
          emoji: "✨",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 10,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "sakura-date",
    name: "Sakura Date",
    description:
      "Sakura-Breeze’in daha romantik versiyonu: yoğun pembe aurora ve daha fazla 🌸.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#180317",
        backgroundGradient: ["#180317", "#240523", "#2E0730"],
        pattern: {
          type: "soft-stars",
          opacity: 0.18
        },
        particles: {
          emoji: "🌸",
          count: 18,
          speed: "slow"
        },
        wallpaper: {
          // sakura / cherry blossom wallpaper
          blurRadius: 22,
          dimOpacity: 0.58
        }
      },
      light: {
        background: "#FFE9F4",
        backgroundGradient: ["#FFE9F4", "#FFDFF0"],
        pattern: {
          type: "soft-stars",
          opacity: 0.14
        },
        particles: {
          emoji: "🌸",
          count: 12,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.26
        }
      }
    }
  },
  {
    id: "midnight-couples",
    name: "Midnight Couples",
    description:
      "Çok koyu lacivert, arka planda hafif kalp bokeh orb’ları. Daha ciddi ama romantik gece sohbeti için.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#040717",
        backgroundGradient: ["#040717", "#060A1F", "#070C25"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "💗",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.62
        }
      },
      light: {
        background: "#F2F5FF",
        backgroundGradient: ["#F2F5FF", "#EDEFFF"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "💗",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.22
        }
      }
    }
  }
];