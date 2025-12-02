/**
 * Velvet Love Teması
 * Pack 5 - Love/Romantic
 */

import type { ThemeDefinition } from "../types";

export const velvetLoveTheme: ThemeDefinition = {
  id: "velvet-love",
  name: "Velvet Love",
  emoji: "❤️",
  description: "Kadife aşk",
  dark: {
    background: "#19010A",
    backgroundGradient: ["#19010A", "#240211", "#2C0418"],
    ownBubble: "#DC2626",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#EF4444",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#19010A"
  },
  light: {
    background: "#FFF1F4",
    backgroundGradient: ["#FFF1F4", "#FFE0E8"],
    ownBubble: "#DC2626",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#7F1D1D",
    accent: "#EF4444",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF1F4"
  },
  particles: {
    emoji: "❤️",
    count: 16,
    speed: "slow"
  },
  pattern: {
    type: "dots",
    opacity: 0.18
  }
};
