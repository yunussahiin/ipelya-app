/**
 * Sakura Breeze Teması
 * Pack 1 - Emoji/Particle
 */

import type { ThemeDefinition } from "../types";

export const sakuraBreezeTheme: ThemeDefinition = {
  id: "sakura-breeze",
  name: "Sakura Breeze",
  emoji: "🌸",
  description: "Kiraz çiçekleri",
  dark: {
    background: "#14041A",
    backgroundGradient: ["#14041A", "#1A0825", "#230A30"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#F472B6",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#14041A"
  },
  light: {
    background: "#FFF0F5",
    backgroundGradient: ["#FFF0F5", "#FFE4F2"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#831843",
    accent: "#F472B6",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF0F5"
  },
  particles: {
    emoji: "🌸",
    count: 14,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.14
  }
};
