/**
 * Glow Lines Teması
 * Pack 2 - Abstract/Neon
 */

import type { ThemeDefinition } from "../types";

export const glowLinesTheme: ThemeDefinition = {
  id: "glow-lines",
  name: "Glow Lines",
  emoji: "◇",
  description: "Neon çizgiler",
  dark: {
    background: "#020008",
    backgroundGradient: ["#020008", "#050013", "#050019"],
    ownBubble: "#06B6D4",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(0,255,255,0.12)",
    otherBubbleText: "#00FFFF",
    accent: "#22D3EE",
    inputBackground: "rgba(0,255,255,0.08)",
    safeAreaBackground: "#020008"
  },
  light: {
    background: "#F5F7FF",
    backgroundGradient: ["#F5F7FF", "#EAF0FF"],
    ownBubble: "#0891B2",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#164E63",
    accent: "#06B6D4",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F5F7FF"
  },
  particles: {
    emoji: "◇",
    count: 10,
    speed: "slow"
  }
};
