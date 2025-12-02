/**
 * Vintage Teması
 *
 * Klasik, nostaljik görünüm
 */

import type { ThemeDefinition } from "../types";

export const vintageTheme: ThemeDefinition = {
  id: "vintage",
  name: "Vintage",
  emoji: "📜",
  description: "Klasik görünüm",
  dark: {
    background: "#1a1815",
    backgroundGradient: ["#1a1815", "#252018", "#1a1815"],
    ownBubble: "#92400E",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#252018",
    otherBubbleText: "#F5F5DC",
    accent: "#D97706",
    inputBackground: "#252018",
    safeAreaBackground: "#1a1815"
  },
  light: {
    background: "#FFFBEB",
    backgroundGradient: ["#FFFBEB", "#FEF3C7", "#FFFBEB"],
    ownBubble: "#92400E",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FEF3C7",
    otherBubbleText: "#1a1815",
    accent: "#D97706",
    inputBackground: "#FEF3C7",
    safeAreaBackground: "#FFFBEB"
  }
};
