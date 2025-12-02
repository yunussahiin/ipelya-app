/**
 * Gece Teması
 *
 * Yıldızlı gece gökyüzü
 */

import type { ThemeDefinition } from "../types";

export const nightTheme: ThemeDefinition = {
  id: "night",
  name: "Gece",
  emoji: "🌙",
  description: "Yıldızlı gece",
  dark: {
    background: "#0a0a1a",
    backgroundGradient: ["#0a0a1a", "#1a1a3a", "#0a0a1a"],
    ownBubble: "#6366F1",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#1a1a3a",
    otherBubbleText: "#E0E7FF",
    accent: "#818CF8",
    inputBackground: "#1a1a3a",
    safeAreaBackground: "#0a0a1a"
  },
  light: {
    background: "#EEF2FF",
    backgroundGradient: ["#EEF2FF", "#E0E7FF", "#EEF2FF"],
    ownBubble: "#6366F1",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#E0E7FF",
    otherBubbleText: "#312E81",
    accent: "#818CF8",
    inputBackground: "#E0E7FF",
    safeAreaBackground: "#EEF2FF"
  },
  particles: {
    emoji: "⭐",
    count: 12,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.15
  }
};
