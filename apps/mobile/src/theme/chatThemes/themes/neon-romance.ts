/**
 * Neon Romance Teması
 * Pack 5 - Love/Romantic
 */

import type { ThemeDefinition } from "../types";

export const neonRomanceTheme: ThemeDefinition = {
  id: "neon-romance",
  name: "Neon Romance",
  emoji: "💜",
  description: "Neon romantik",
  dark: {
    background: "#140021",
    backgroundGradient: ["#140021", "#1C022E", "#230338"],
    ownBubble: "#D946EF",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(217,70,239,0.15)",
    otherBubbleText: "#F5D0FE",
    accent: "#E879F9",
    inputBackground: "rgba(217,70,239,0.08)",
    safeAreaBackground: "#140021"
  },
  light: {
    background: "#FBE9FF",
    backgroundGradient: ["#FBE9FF", "#F4E3FF"],
    ownBubble: "#C026D3",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#701A75",
    accent: "#D946EF",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FBE9FF"
  },
  particles: {
    emoji: "💜",
    count: 14,
    speed: "medium"
  },
  pattern: {
    type: "waves",
    opacity: 0.22
  }
};
