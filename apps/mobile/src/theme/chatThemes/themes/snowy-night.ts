/**
 * Snowy Night Teması
 * Pack 3 - Nature/Seasonal
 */

import type { ThemeDefinition } from "../types";

export const snowyNightTheme: ThemeDefinition = {
  id: "snowy-night",
  name: "Snowy Night",
  emoji: "❄️",
  description: "Karlı gece",
  dark: {
    background: "#02071A",
    backgroundGradient: ["#02071A", "#041029", "#071633"],
    ownBubble: "#3B82F6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.15)",
    otherBubbleText: "#FFFFFF",
    accent: "#60A5FA",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#02071A"
  },
  light: {
    background: "#F3F7FF",
    backgroundGradient: ["#F3F7FF", "#E6F0FF"],
    ownBubble: "#3B82F6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E3A8A",
    accent: "#60A5FA",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F3F7FF"
  },
  particles: {
    emoji: "❄️",
    count: 16,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.22
  }
};
