/**
 * Doğa Teması
 *
 * Yeşil orman ve yapraklar
 */

import type { ThemeDefinition } from "../types";

export const natureTheme: ThemeDefinition = {
  id: "nature",
  name: "Doğa",
  emoji: "🌿",
  description: "Yeşil orman",
  dark: {
    background: "#0a1a0f",
    backgroundGradient: ["#0a1a0f", "#1a2d1a", "#0a1a0f"],
    ownBubble: "#059669",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#1a2d1a",
    otherBubbleText: "#A7F3D0",
    accent: "#10B981",
    inputBackground: "#1a2d1a",
    safeAreaBackground: "#0a1a0f"
  },
  light: {
    background: "#ECFDF5",
    backgroundGradient: ["#ECFDF5", "#D1FAE5", "#ECFDF5"],
    ownBubble: "#059669",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#D1FAE5",
    otherBubbleText: "#064E3B",
    accent: "#10B981",
    inputBackground: "#D1FAE5",
    safeAreaBackground: "#ECFDF5"
  },
  particles: {
    emoji: "🍃",
    count: 10,
    speed: "medium"
  },
  pattern: {
    type: "leaves",
    opacity: 0.12
  }
};
