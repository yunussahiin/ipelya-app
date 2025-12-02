/**
 * Deep Aurora Teması
 * Pack 2 - Abstract/Aurora
 */

import type { ThemeDefinition } from "../types";

export const deepAuroraTheme: ThemeDefinition = {
  id: "deep-aurora",
  name: "Deep Aurora",
  emoji: "🌌",
  description: "Derin aurora",
  dark: {
    background: "#040015",
    backgroundGradient: ["#040015", "#06031B", "#090425"],
    ownBubble: "#7C3AED",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#8B5CF6",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#040015"
  },
  light: {
    background: "#F5F3FF",
    backgroundGradient: ["#F5F3FF", "#E7E5FF"],
    ownBubble: "#7C3AED",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#4C1D95",
    accent: "#8B5CF6",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F5F3FF"
  },
  particles: {
    emoji: "✨",
    count: 8,
    speed: "slow"
  }
};
