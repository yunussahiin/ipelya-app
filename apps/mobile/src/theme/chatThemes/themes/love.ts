/**
 * Sevgi Teması
 *
 * Romantik kalpler ve pembe tonlar
 */

import type { ThemeDefinition } from "../types";

export const loveTheme: ThemeDefinition = {
  id: "love",
  name: "Sevgi",
  emoji: "❤️",
  description: "Romantik kalpler",
  dark: {
    background: "#1a0a0f",
    backgroundGradient: ["#1a0a0f", "#2d1018", "#1a0a0f"],
    ownBubble: "#E11D48",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#2d1018",
    otherBubbleText: "#FFC0CB",
    accent: "#F43F5E",
    inputBackground: "#2d1018",
    safeAreaBackground: "#1a0a0f"
  },
  light: {
    background: "#FFF0F3",
    backgroundGradient: ["#FFF0F3", "#FFE4E8", "#FFF0F3"],
    ownBubble: "#E11D48",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFE4E8",
    otherBubbleText: "#881337",
    accent: "#F43F5E",
    inputBackground: "#FFE4E8",
    safeAreaBackground: "#FFF0F3"
  },
  particles: {
    emoji: "❤️",
    count: 8,
    speed: "slow"
  },
  pattern: {
    type: "hearts",
    opacity: 0.1
  }
};
