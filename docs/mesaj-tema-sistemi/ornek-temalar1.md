Pack 1 – Emoji / Particle Temaları (1–5)
// pack-1-emoji.ts

import type { ChatTheme } from "./chatThemes.types";

export const EMOJI_THEMES_PACK_1: ChatTheme[] = [
  {
    id: "starry-night",
    name: "Starry Night",
    description:
      "Koyu mor gecede yumuşak ⭐️ partikülleri ve hafif star-pattern. Viber/Telegram yıldız teması vibe.",
    effect: "none",
    variants: {
      dark: {
        background: "#05061A",
        backgroundGradient: ["#05061A", "#05041A", "#090623"],
        pattern: {
          type: "soft-stars",
          opacity: 0.20
        },
        particles: {
          emoji: "⭐️",
          count: 14,
          speed: "slow"
        },
        wallpaper: {
          // Örn: starry night phone wallpaper
          blurRadius: 12,
          dimOpacity: 0.35
        }
      },
      light: {
        background: "#EDF0FF",
        backgroundGradient: ["#F5F6FF", "#E9EEFF"],
        pattern: {
          type: "soft-stars",
          opacity: 0.14
        },
        particles: {
          emoji: "⭐️",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 10,
          dimOpacity: 0.10
        }
      }
    }
  },
  {
    id: "soft-hearts",
    name: "Soft Hearts",
    description:
      "Pastel pembe/lila sohbet arka planı, yumuşak kalp partikülleri. Romantik DM’ler için 😌",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#180418",
        backgroundGradient: ["#180418", "#220625", "#2A0830"],
        pattern: {
          type: "dots",
          opacity: 0.16
        },
        particles: {
          emoji: "💜",
          count: 16,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.40
        }
      },
      light: {
        background: "#FFF4FB",
        backgroundGradient: ["#FFF4FB", "#FFE8F8"],
        pattern: {
          type: "dots",
          opacity: 0.12
        },
        particles: {
          emoji: "💖",
          count: 12,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 10,
          dimOpacity: 0.18
        }
      }
    }
  },
  {
    id: "bubble-chat",
    name: "Bubble Chat",
    description:
      "Mavi tonlu gradient üstünde 🫧 baloncuk partikülleri. Konuşma balonlarını destekleyen ferah arka plan.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#020718",
        backgroundGradient: ["#020718", "#041227", "#041A33"],
        pattern: {
          type: "dots",
          opacity: 0.18
        },
        particles: {
          emoji: "🫧",
          count: 18,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 16,
          dimOpacity: 0.42
        }
      },
      light: {
        background: "#E6F4FF",
        backgroundGradient: ["#E6F4FF", "#F0FAFF"],
        pattern: {
          type: "dots",
          opacity: 0.15
        },
        particles: {
          emoji: "🫧",
          count: 12,
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
    id: "sakura-breeze",
    name: "Sakura Breeze",
    description:
      "Gece morundan pembeye kayan gradient, yavaş süzülen 🌸 partikülleri. Hafif romantik, hafif anime.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#14041A",
        backgroundGradient: ["#14041A", "#1A0825", "#230A30"],
        pattern: {
          type: "soft-stars",
          opacity: 0.14
        },
        particles: {
          emoji: "🌸",
          count: 14,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 18,
          dimOpacity: 0.45
        }
      },
      light: {
        background: "#FFF0F5",
        backgroundGradient: ["#FFF0F5", "#FFE4F2"],
        pattern: {
          type: "soft-stars",
          opacity: 0.10
        },
        particles: {
          emoji: "🌸",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.18
        }
      }
    }
  },
  {
    id: "cosmic-space",
    name: "Cosmic Space",
    description:
      "Uzay karanlığı üstünde 🪐 + ⭐ hissiyatı, ama readability için sade tutulmuş star pattern.",
    effect: "none",
    variants: {
      dark: {
        background: "#02020A",
        backgroundGradient: ["#02020A", "#040314", "#05051B"],
        pattern: {
          type: "diamonds",
          opacity: 0.22
        },
        particles: {
          emoji: "✨",
          count: 20,
          speed: "fast"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.50
        }
      },
      light: {
        background: "#F4F7FF",
        backgroundGradient: ["#F4F7FF", "#EAF3FF"],
        pattern: {
          type: "diamonds",
          opacity: 0.10
        },
        particles: {
          emoji: "✨",
          count: 12,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.16
        }
      }
    }
  }
];


Starry Night için “dark starry night phone wallpaper” veya Wallpapers.com’daki starry night koleksiyonunu arka plan olarak kullanabilirsin.