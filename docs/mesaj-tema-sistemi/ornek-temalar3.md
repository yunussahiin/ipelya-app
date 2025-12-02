Pack 4 – Minimal / Tech / Pro (16–20)
// pack-4-minimal.ts

import type { ChatTheme } from "./chatThemes.types";

export const MINIMAL_THEMES_PACK_4: ChatTheme[] = [
  {
    id: "midnight-minimal",
    name: "Midnight Minimal",
    description:
      "Neredeyse düz gece mavisi zemin, çok hafif noktacık pattern. Tam fokus modu.",
    effect: "none",
    variants: {
      dark: {
        background: "#050712",
        backgroundGradient: ["#050712", "#07091A"],
        pattern: {
          type: "dots",
          opacity: 0.12
        },
        particles: {
          emoji: "•",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.40
        }
      },
      light: {
        background: "#F5F7FB",
        backgroundGradient: ["#F5F7FB", "#ECEFF6"],
        pattern: {
          type: "dots",
          opacity: 0.08
        },
        particles: {
          emoji: "•",
          count: 4,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 8,
          dimOpacity: 0.14
        }
      }
    }
  },
  {
    id: "code-matrix",
    name: "Code Matrix",
    description:
      "Koyu yeşil tonlar, matrix benzeri yağmur efektleri için uygun bir tema.",
    effect: "matrix",
    variants: {
      dark: {
        background: "#020D07",
        backgroundGradient: ["#020D07", "#02140D", "#031C14"],
        pattern: {
          type: "grid",
          opacity: 0.20
        },
        particles: {
          emoji: "▮",
          count: 24,
          speed: "fast"
        },
        wallpaper: {
          blurRadius: 16,
          dimOpacity: 0.52
        }
      },
      light: {
        background: "#E8F5EC",
        backgroundGradient: ["#E8F5EC", "#E1F3EE"],
        pattern: {
          type: "grid",
          opacity: 0.10
        },
        particles: {
          emoji: "▮",
          count: 16,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 10,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "neon-purple",
    name: "Neon Purple",
    description:
      "Koyu mor zeminde neon çizgiler ve glow. Gaming/chat app havası.",
    effect: "neon-grid",
    variants: {
      dark: {
        background: "#120220",
        backgroundGradient: ["#120220", "#190330", "#1E0736"],
        pattern: {
          type: "waves",
          opacity: 0.20
        },
        particles: {
          emoji: "✦",
          count: 14,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.55
        }
      },
      light: {
        background: "#F6EDFF",
        backgroundGradient: ["#F6EDFF", "#F0E6FF"],
        pattern: {
          type: "waves",
          opacity: 0.12
        },
        particles: {
          emoji: "✦",
          count: 10,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.22
        }
      }
    }
  },
  {
    id: "blueprint-chat",
    name: "Blueprint Chat",
    description:
      "Lacivert blueprint hissi, ince grid ve köşelerde hafif glow noktaları.",
    effect: "none",
    variants: {
      dark: {
        background: "#050A18",
        backgroundGradient: ["#050A18", "#060E20"],
        pattern: {
          type: "grid",
          opacity: 0.24
        },
        particles: {
          emoji: "+",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 18,
          dimOpacity: 0.50
        }
      },
      light: {
        background: "#E8F0FF",
        backgroundGradient: ["#E8F0FF", "#E0EBFF"],
        pattern: {
          type: "grid",
          opacity: 0.12
        },
        particles: {
          emoji: "+",
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
    id: "focus-dark",
    name: "Focus Dark",
    description:
      "Hemen hemen düz siyah, sadece etrafta gezen blur orb’lar. Deep work / serious chat modu.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#020204",
        backgroundGradient: ["#020204", "#050508"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "●",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 16,
          dimOpacity: 0.60
        }
      },
      light: {
        background: "#F7F7F9",
        backgroundGradient: ["#F7F7F9", "#EEEEF2"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "●",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 10,
          dimOpacity: 0.18
        }
      }
    }
  }
];
