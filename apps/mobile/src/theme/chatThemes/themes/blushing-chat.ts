/**
 * Blushing Chat Teması
 * Pack 5 - Love/Romantic
 */

import type { ThemeDefinition } from "../types";

export const blushingChatTheme: ThemeDefinition = {
  id: "blushing-chat",
  name: "Blushing Chat",
  emoji: "✨",
  description: "Utangaç sohbet",
  dark: {
    background: "#1A0711",
    backgroundGradient: ["#1A0711", "#220818", "#2A0A21"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#F472B6",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#1A0711"
  },
  light: {
    background: "#FFEFF5",
    backgroundGradient: ["#FFEFF5", "#FFE2ED"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#831843",
    accent: "#F472B6",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFEFF5"
  },
  particles: {
    emoji: "✨",
    count: 12,
    speed: "slow"
  },
  pattern: {
    type: "stars",
    opacity: 0.16
  }
};
