/**
 * Midnight Minimal Teması
 * Pack 4 - Minimal/Tech
 */

import type { ThemeDefinition } from "../types";

export const midnightMinimalTheme: ThemeDefinition = {
  id: "midnight-minimal",
  name: "Midnight Minimal",
  emoji: "•",
  description: "Minimal gece",
  dark: {
    background: "#050712",
    backgroundGradient: ["#050712", "#07091A"],
    ownBubble: "#3B82F6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.10)",
    otherBubbleText: "#FFFFFF",
    accent: "#60A5FA",
    inputBackground: "rgba(255,255,255,0.06)",
    safeAreaBackground: "#050712"
  },
  light: {
    background: "#F5F7FB",
    backgroundGradient: ["#F5F7FB", "#ECEFF6"],
    ownBubble: "#3B82F6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E3A8A",
    accent: "#60A5FA",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F5F7FB"
  },
  particles: {
    emoji: "•",
    count: 6,
    speed: "slow"
  },
  pattern: {
    type: "dots",
    opacity: 0.12
  }
};
