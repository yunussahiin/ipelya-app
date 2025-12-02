Pack 2 – Abstract / Aurora / Bokeh (6–10)
// pack-2-abstract.ts

import type { ChatTheme } from "./chatThemes.types";

export const ABSTRACT_THEMES_PACK_2: ChatTheme[] = [
  {
    id: "deep-aurora",
    name: "Deep Aurora",
    description:
      "Derin mor/navy zeminde akışkan aurora blob’ları. Premium DM teması gibi.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#040015",
        backgroundGradient: ["#040015", "#06031B", "#090425"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "✨",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 22,
          dimOpacity: 0.55
        }
      },
      light: {
        background: "#F5F3FF",
        backgroundGradient: ["#F5F3FF", "#E7E5FF"],
        pattern: {
          type: "dots",
          opacity: 0.08
        },
        particles: {
          emoji: "✨",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 16,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "sunrise-aurora",
    name: "Sunrise Aurora",
    description:
      "Turuncu/pembe/eflatun karışımı aurora; sabah güneşi hissiyatlı gradient.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#1A0610",
        backgroundGradient: ["#1A0610", "#28071F", "#2E0C30"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "☀️",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          // sunset & gradient wave duvar kağıtları güzel gider
          blurRadius: 18,
          dimOpacity: 0.52
        }
      },
      light: {
        background: "#FFF4EC",
        backgroundGradient: ["#FFF4EC", "#FFE4F0", "#FFE9FF"],
        pattern: {
          type: "dots",
          opacity: 0.12
        },
        particles: {
          emoji: "☀️",
          count: 4,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "soft-bokeh",
    name: "Soft Bokeh",
    description:
      "Pastel ışık bokeh’leri ile sakin ve okunaklı chat arka planı.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#0D0A18",
        backgroundGradient: ["#0D0A18", "#130C24", "#160D2A"],
        pattern: {
          type: "none",
          opacity: 0
        },
        particles: {
          emoji: "●",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 18,
          dimOpacity: 0.48
        }
      },
      light: {
        background: "#F7F4FF",
        backgroundGradient: ["#F7F4FF", "#F1F5FF"],
        pattern: {
          type: "dots",
          opacity: 0.10
        },
        particles: {
          emoji: "●",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "ocean-bokeh",
    name: "Ocean Bokeh",
    description:
      "Mavi/yeşil tonlu, deniz üstünde ışık yansımaları gibi görünen bokeh’ler.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#02141F",
        backgroundGradient: ["#02141F", "#032331", "#032C3C"],
        pattern: {
          type: "waves",
          opacity: 0.18
        },
        particles: {
          emoji: "💧",
          count: 12,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.50
        }
      },
      light: {
        background: "#E6FAFF",
        backgroundGradient: ["#E6FAFF", "#E2F4FF"],
        pattern: {
          type: "waves",
          opacity: 0.12
        },
        particles: {
          emoji: "💧",
          count: 8,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.22
        }
      }
    }
  },
  {
    id: "glow-lines",
    name: "Glow Lines",
    description:
      "Neon grid + scan bar efekti. Futuristik, ama chat balonlarını boğmayan bir neon tema.",
    effect: "neon-grid",
    variants: {
      dark: {
        background: "#020008",
        backgroundGradient: ["#020008", "#050013", "#050019"],
        pattern: {
          type: "grid",
          opacity: 0.22
        },
        particles: {
          emoji: "◇",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.55
        }
      },
      light: {
        background: "#F5F7FF",
        backgroundGradient: ["#F5F7FF", "#EAF0FF"],
        pattern: {
          type: "grid",
          opacity: 0.10
        },
        particles: {
          emoji: "◇",
          count: 6,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.20
        }
      }
    }
  }
];


Sunrise Aurora ve Ocean Bokeh için abstract gradient / ocean sunset tarzı duvar kağıtları çok iyi çalışır. Örn. ocean sunset gradient wallpaper’ları veya gradient waves abstract wallpaper koleksiyonlarını kullanabilirsin.

Pack 3 – Nature / Seasonal / Cozy (11–15)
// pack-3-nature.ts

import type { ChatTheme } from "./chatThemes.types";

export const NATURE_THEMES_PACK_3: ChatTheme[] = [
  {
    id: "autumn-leaves",
    name: "Autumn Leaves",
    description:
      "Sıcak turuncu/kahve gradient, 🍁 partikülleri. Sonbahar havası veren cozy tema.",
    effect: "bokeh",
    variants: {
      dark: {
        background: "#160A04",
        backgroundGradient: ["#160A04", "#201007", "#2A130B"],
        pattern: {
          type: "dots",
          opacity: 0.16
        },
        particles: {
          emoji: "🍁",
          count: 12,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 18,
          dimOpacity: 0.52
        }
      },
      light: {
        background: "#FFF5E6",
        backgroundGradient: ["#FFF5E6", "#FFEAD2"],
        pattern: {
          type: "dots",
          opacity: 0.10
        },
        particles: {
          emoji: "🍁",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.22
        }
      }
    }
  },
  {
    id: "calm-forest",
    name: "Calm Forest",
    description:
      "Yeşil → lacivert gradient, çok hafif 🌲/✨ hissi. Odaklı ama doğal.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#020D09",
        backgroundGradient: ["#020D09", "#02151A", "#031F2A"],
        pattern: {
          type: "diamonds",
          opacity: 0.14
        },
        particles: {
          emoji: "✨",
          count: 10,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.50
        }
      },
      light: {
        background: "#EAF7F0",
        backgroundGradient: ["#EAF7F0", "#E1F3F7"],
        pattern: {
          type: "diamonds",
          opacity: 0.10
        },
        particles: {
          emoji: "✨",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 12,
          dimOpacity: 0.20
        }
      }
    }
  },
  {
    id: "snowy-night",
    name: "Snowy Night",
    description:
      "Lacivert gece üzerinde kar tanesi ❄️ partikülleri. Soğuk ama çok temiz bir tema.",
    effect: "rain",
    variants: {
      dark: {
        background: "#02071A",
        backgroundGradient: ["#02071A", "#041029", "#071633"],
        pattern: {
          type: "soft-stars",
          opacity: 0.22
        },
        particles: {
          emoji: "❄️",
          count: 16,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.55
        }
      },
      light: {
        background: "#F3F7FF",
        backgroundGradient: ["#F3F7FF", "#E6F0FF"],
        pattern: {
          type: "soft-stars",
          opacity: 0.12
        },
        particles: {
          emoji: "❄️",
          count: 12,
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
    id: "beach-sunset",
    name: "Beach Sunset",
    description:
      "Turuncu/pembe gökyüzü ile sahil gün batımı. Hafif 🐚 / dalga hissi, çok sıcak bir sohbet alanı.",
    effect: "aurora",
    variants: {
      dark: {
        background: "#190612",
        backgroundGradient: ["#190612", "#2A0721", "#2E1530"],
        pattern: {
          type: "waves",
          opacity: 0.16
        },
        particles: {
          emoji: "🌅",
          count: 8,
          speed: "slow"
        },
        wallpaper: {
          blurRadius: 20,
          dimOpacity: 0.54
        }
      },
      light: {
        background: "#FFF3E8",
        backgroundGradient: ["#FFF3E8", "#FFE5F0", "#FFE9FA"],
        pattern: {
          type: "waves",
          opacity: 0.10
        },
        particles: {
          emoji: "🌅",
          count: 6,
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
    id: "rainy-window",
    name: "Rainy Window",
    description:
      "Koyu gri/mavi tonlar, aşağı süzülen yağmur çizgileri efekti ve hafif 💧 partikülleri.",
    effect: "rain",
    variants: {
      dark: {
        background: "#05070D",
        backgroundGradient: ["#05070D", "#09111A", "#0A151F"],
        pattern: {
          type: "waves",
          opacity: 0.18
        },
        particles: {
          emoji: "💧",
          count: 14,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 22,
          dimOpacity: 0.60
        }
      },
      light: {
        background: "#EDF3F8",
        backgroundGradient: ["#EDF3F8", "#E3ECF5"],
        pattern: {
          type: "waves",
          opacity: 0.12
        },
        particles: {
          emoji: "💧",
          count: 10,
          speed: "medium"
        },
        wallpaper: {
          blurRadius: 14,
          dimOpacity: 0.24
        }
      }
    }
  }
];