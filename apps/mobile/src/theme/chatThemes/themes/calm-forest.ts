/**
 * Calm Forest Teması
 * Pack 3 - Nature/Seasonal
 */

import type { ThemeDefinition } from "../types";

export const calmForestTheme: ThemeDefinition = {
  id: "calm-forest",
  name: "Calm Forest",
  emoji: "🌲",
  description: "Sakin orman",
  dark: {
    background: "#020D09",
    backgroundGradient: ["#020D09", "#02151A", "#031F2A"],
    ownBubble: "#059669",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#10B981",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#020D09"
  },
  light: {
    background: "#EAF7F0",
    backgroundGradient: ["#EAF7F0", "#E1F3F7"],
    ownBubble: "#059669",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#064E3B",
    accent: "#10B981",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#EAF7F0"
  },
  particles: {
    emoji: "✨",
    count: 10,
    speed: "slow"
  }
};
