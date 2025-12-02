/**
 * Sakura Date Teması
 * Pack 5 - Love/Romantic
 */

import type { ThemeDefinition } from "../types";

export const sakuraDateTheme: ThemeDefinition = {
  id: "sakura-date",
  name: "Sakura Date",
  emoji: "🌸",
  description: "Sakura randevusu",
  dark: {
    background: "#180317",
    backgroundGradient: ["#180317", "#240523", "#2E0730"],
    ownBubble: "#DB2777",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#EC4899",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#180317"
  },
  light: {
    background: "#FFE9F4",
    backgroundGradient: ["#FFE9F4", "#FFDFF0"],
    ownBubble: "#DB2777",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#831843",
    accent: "#EC4899",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFE9F4"
  },
  particles: {
    emoji: "🌸",
    count: 18,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.18
  }
};
