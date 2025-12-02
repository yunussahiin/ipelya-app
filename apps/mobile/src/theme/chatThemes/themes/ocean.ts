/**
 * Okyanus Teması
 *
 * Derin mavi dalgalar
 */

import type { ThemeDefinition } from "../types";

export const oceanTheme: ThemeDefinition = {
  id: "ocean",
  name: "Okyanus",
  emoji: "🌊",
  description: "Derin mavi",
  dark: {
    background: "#0a1520",
    backgroundGradient: ["#0a1520", "#0c2540", "#0a1520"],
    ownBubble: "#0284C7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#0c2540",
    otherBubbleText: "#BAE6FD",
    accent: "#0EA5E9",
    inputBackground: "#0c2540",
    safeAreaBackground: "#0a1520"
  },
  light: {
    background: "#F0F9FF",
    backgroundGradient: ["#F0F9FF", "#E0F2FE", "#F0F9FF"],
    ownBubble: "#0284C7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#E0F2FE",
    otherBubbleText: "#0C4A6E",
    accent: "#0EA5E9",
    inputBackground: "#E0F2FE",
    safeAreaBackground: "#F0F9FF"
  },
  particles: {
    emoji: "🐚",
    count: 6,
    speed: "slow"
  },
  pattern: {
    type: "waves",
    opacity: 0.1
  }
};
