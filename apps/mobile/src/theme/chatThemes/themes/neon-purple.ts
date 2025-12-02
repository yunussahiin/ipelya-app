/**
 * Neon Purple Teması
 * Pack 4 - Minimal/Tech
 */

import type { ThemeDefinition } from "../types";

export const neonPurpleTheme: ThemeDefinition = {
  id: "neon-purple",
  name: "Neon Purple",
  emoji: "✦",
  description: "Neon mor",
  dark: {
    background: "#120220",
    backgroundGradient: ["#120220", "#190330", "#1E0736"],
    ownBubble: "#A855F7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(168,85,247,0.15)",
    otherBubbleText: "#E9D5FF",
    accent: "#C084FC",
    inputBackground: "rgba(168,85,247,0.08)",
    safeAreaBackground: "#120220"
  },
  light: {
    background: "#F6EDFF",
    backgroundGradient: ["#F6EDFF", "#F0E6FF"],
    ownBubble: "#9333EA",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#581C87",
    accent: "#A855F7",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F6EDFF"
  },
  particles: {
    emoji: "✦",
    count: 14,
    speed: "medium"
  },
  pattern: {
    type: "waves",
    opacity: 0.2
  }
};
