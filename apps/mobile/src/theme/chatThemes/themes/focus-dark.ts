/**
 * Focus Dark Teması
 * Pack 4 - Minimal/Tech
 */

import type { ThemeDefinition } from "../types";

export const focusDarkTheme: ThemeDefinition = {
  id: "focus-dark",
  name: "Focus Dark",
  emoji: "●",
  description: "Odak modu",
  dark: {
    background: "#020204",
    backgroundGradient: ["#020204", "#050508"],
    ownBubble: "#6B7280",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.08)",
    otherBubbleText: "#FFFFFF",
    accent: "#9CA3AF",
    inputBackground: "rgba(255,255,255,0.05)",
    safeAreaBackground: "#020204"
  },
  light: {
    background: "#F7F7F9",
    backgroundGradient: ["#F7F7F9", "#EEEEF2"],
    ownBubble: "#6B7280",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1F2937",
    accent: "#9CA3AF",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F7F7F9"
  },
  particles: {
    emoji: "●",
    count: 8,
    speed: "slow"
  }
};
