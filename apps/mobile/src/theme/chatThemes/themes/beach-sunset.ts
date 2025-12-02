/**
 * Beach Sunset Teması
 * Pack 3 - Nature/Seasonal
 */

import type { ThemeDefinition } from "../types";

export const beachSunsetTheme: ThemeDefinition = {
  id: "beach-sunset",
  name: "Beach Sunset",
  emoji: "🌅",
  description: "Sahil gün batımı",
  dark: {
    background: "#190612",
    backgroundGradient: ["#190612", "#2A0721", "#2E1530"],
    ownBubble: "#F97316",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#FB923C",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#190612"
  },
  light: {
    background: "#FFF3E8",
    backgroundGradient: ["#FFF3E8", "#FFE5F0", "#FFE9FA"],
    ownBubble: "#F97316",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#7C2D12",
    accent: "#FB923C",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF3E8"
  },
  particles: {
    emoji: "🌅",
    count: 8,
    speed: "slow"
  },
  pattern: {
    type: "waves",
    opacity: 0.16
  }
};
