/**
 * Starry Night Teması
 * Pack 1 - Emoji/Particle
 */

import type { ThemeDefinition } from "../types";

export const starryNightTheme: ThemeDefinition = {
  id: "starry-night",
  name: "Starry Night",
  emoji: "⭐",
  description: "Yıldızlı gece",
  dark: {
    background: "#05061A",
    backgroundGradient: ["#05061A", "#05041A", "#090623"],
    ownBubble: "#6366F1",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#818CF8",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#05061A"
  },
  light: {
    background: "#EDF0FF",
    backgroundGradient: ["#F5F6FF", "#E9EEFF"],
    ownBubble: "#6366F1",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E1B4B",
    accent: "#818CF8",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#EDF0FF"
  },
  particles: {
    emoji: "⭐",
    count: 14,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.2
  }
};
