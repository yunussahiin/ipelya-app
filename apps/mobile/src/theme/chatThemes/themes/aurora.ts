/**
 * Aurora Teması (Premium)
 *
 * Kuzey ışıkları efekti - mor/mavi gradient
 */

import type { ThemeDefinition } from "../types";

export const auroraTheme: ThemeDefinition = {
  id: "aurora",
  name: "Aurora",
  emoji: "🌌",
  description: "Kuzey ışıkları",
  dark: {
    background: "#030014",
    backgroundGradient: ["#030014", "#060318", "#080320", "#050215"],
    ownBubble: "#8763FF",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#8763FF",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#030014"
  },
  light: {
    background: "#F0F4FF",
    backgroundGradient: ["#F0F4FF", "#E8EFFF", "#F5F0FF"],
    ownBubble: "#6366F1",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E1B4B",
    accent: "#6366F1",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F0F4FF"
  }
};
