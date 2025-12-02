/**
 * Rainy Window Teması
 * Pack 3 - Nature/Seasonal
 */

import type { ThemeDefinition } from "../types";

export const rainyWindowTheme: ThemeDefinition = {
  id: "rainy-window",
  name: "Rainy Window",
  emoji: "🌧️",
  description: "Yağmurlu pencere",
  dark: {
    background: "#05070D",
    backgroundGradient: ["#05070D", "#09111A", "#0A151F"],
    ownBubble: "#64748B",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#94A3B8",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#05070D"
  },
  light: {
    background: "#EDF3F8",
    backgroundGradient: ["#EDF3F8", "#E3ECF5"],
    ownBubble: "#64748B",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E293B",
    accent: "#94A3B8",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#EDF3F8"
  },
  particles: {
    emoji: "💧",
    count: 14,
    speed: "medium"
  },
  pattern: {
    type: "waves",
    opacity: 0.18
  }
};
