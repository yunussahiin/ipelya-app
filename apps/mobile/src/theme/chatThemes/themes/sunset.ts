/**
 * Gün Batımı Teması
 *
 * Turuncu ve pembe tonlar
 */

import type { ThemeDefinition } from "../types";

export const sunsetTheme: ThemeDefinition = {
  id: "sunset",
  name: "Gün Batımı",
  emoji: "🌅",
  description: "Sıcak tonlar",
  dark: {
    background: "#1a0f0a",
    backgroundGradient: ["#1a0f0a", "#2d1a10", "#1a0f0a"],
    ownBubble: "#EA580C",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#2d1a10",
    otherBubbleText: "#FED7AA",
    accent: "#F97316",
    inputBackground: "#2d1a10",
    safeAreaBackground: "#1a0f0a"
  },
  light: {
    background: "#FFF7ED",
    backgroundGradient: ["#FFF7ED", "#FFEDD5", "#FFF7ED"],
    ownBubble: "#EA580C",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFEDD5",
    otherBubbleText: "#7C2D12",
    accent: "#F97316",
    inputBackground: "#FFEDD5",
    safeAreaBackground: "#FFF7ED"
  },
  particles: {
    emoji: "🌸",
    count: 8,
    speed: "medium"
  }
};
