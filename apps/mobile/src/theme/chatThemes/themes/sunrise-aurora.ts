/**
 * Sunrise Aurora Teması
 * Pack 2 - Abstract/Aurora
 */

import type { ThemeDefinition } from "../types";

export const sunriseAuroraTheme: ThemeDefinition = {
  id: "sunrise-aurora",
  name: "Sunrise Aurora",
  emoji: "☀️",
  description: "Gün doğumu",
  dark: {
    background: "#1A0610",
    backgroundGradient: ["#1A0610", "#28071F", "#2E0C30"],
    ownBubble: "#F97316",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#FB923C",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#1A0610"
  },
  light: {
    background: "#FFF4EC",
    backgroundGradient: ["#FFF4EC", "#FFE4F0", "#FFE9FF"],
    ownBubble: "#F97316",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#7C2D12",
    accent: "#FB923C",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF4EC"
  },
  particles: {
    emoji: "☀️",
    count: 6,
    speed: "slow"
  }
};
