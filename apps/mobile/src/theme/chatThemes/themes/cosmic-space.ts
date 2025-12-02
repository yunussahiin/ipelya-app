/**
 * Cosmic Space Teması
 * Pack 1 - Emoji/Particle
 */

import type { ThemeDefinition } from "../types";

export const cosmicSpaceTheme: ThemeDefinition = {
  id: "cosmic-space",
  name: "Cosmic Space",
  emoji: "🪐",
  description: "Uzay",
  dark: {
    background: "#02020A",
    backgroundGradient: ["#02020A", "#040314", "#05051B"],
    ownBubble: "#8B5CF6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#A78BFA",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#02020A"
  },
  light: {
    background: "#F4F7FF",
    backgroundGradient: ["#F4F7FF", "#EAF3FF"],
    ownBubble: "#8B5CF6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#4C1D95",
    accent: "#A78BFA",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F4F7FF"
  },
  particles: {
    emoji: "✨",
    count: 20,
    speed: "fast"
  }
};
