/**
 * Bubble Chat Teması
 * Pack 1 - Emoji/Particle
 */

import type { ThemeDefinition } from "../types";

export const bubbleChatTheme: ThemeDefinition = {
  id: "bubble-chat",
  name: "Bubble Chat",
  emoji: "🫧",
  description: "Baloncuklar",
  dark: {
    background: "#020718",
    backgroundGradient: ["#020718", "#041227", "#041A33"],
    ownBubble: "#0EA5E9",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#38BDF8",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#020718"
  },
  light: {
    background: "#E6F4FF",
    backgroundGradient: ["#E6F4FF", "#F0FAFF"],
    ownBubble: "#0EA5E9",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#0C4A6E",
    accent: "#38BDF8",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#E6F4FF"
  },
  particles: {
    emoji: "🫧",
    count: 18,
    speed: "medium"
  },
  pattern: {
    type: "dots",
    opacity: 0.18
  }
};
