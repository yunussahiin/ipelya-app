/**
 * Autumn Leaves Teması
 * Pack 3 - Nature/Seasonal
 */

import type { ThemeDefinition } from "../types";

export const autumnLeavesTheme: ThemeDefinition = {
  id: "autumn-leaves",
  name: "Autumn Leaves",
  emoji: "🍁",
  description: "Sonbahar yaprakları",
  dark: {
    background: "#160A04",
    backgroundGradient: ["#160A04", "#201007", "#2A130B"],
    ownBubble: "#EA580C",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#F97316",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#160A04"
  },
  light: {
    background: "#FFF5E6",
    backgroundGradient: ["#FFF5E6", "#FFEAD2"],
    ownBubble: "#EA580C",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#7C2D12",
    accent: "#F97316",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF5E6"
  },
  particles: {
    emoji: "🍁",
    count: 12,
    speed: "slow"
  },
  pattern: {
    type: "dots",
    opacity: 0.16
  }
};
