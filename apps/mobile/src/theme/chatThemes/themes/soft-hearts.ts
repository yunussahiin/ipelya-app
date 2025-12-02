/**
 * Soft Hearts Teması
 * Pack 1 - Emoji/Particle
 */

import type { ThemeDefinition } from "../types";

export const softHeartsTheme: ThemeDefinition = {
  id: "soft-hearts",
  name: "Soft Hearts",
  emoji: "💜",
  description: "Yumuşak kalpler",
  dark: {
    background: "#180418",
    backgroundGradient: ["#180418", "#220625", "#2A0830"],
    ownBubble: "#A855F7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#C084FC",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#180418"
  },
  light: {
    background: "#FFF4FB",
    backgroundGradient: ["#FFF4FB", "#FFE8F8"],
    ownBubble: "#A855F7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#581C87",
    accent: "#C084FC",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF4FB"
  },
  particles: {
    emoji: "💜",
    count: 16,
    speed: "medium"
  },
  pattern: {
    type: "dots",
    opacity: 0.16
  }
};
