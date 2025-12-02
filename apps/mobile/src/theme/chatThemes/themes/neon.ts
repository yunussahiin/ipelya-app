/**
 * Neon Teması
 *
 * Parlak neon renkler
 */

import type { ThemeDefinition } from "../types";

export const neonTheme: ThemeDefinition = {
  id: "neon",
  name: "Neon",
  emoji: "💜",
  description: "Parlak renkler",
  dark: {
    background: "#0a0015",
    backgroundGradient: ["#0a0015", "#150025", "#0a0015"],
    ownBubble: "#A855F7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#150025",
    otherBubbleText: "#E9D5FF",
    accent: "#C084FC",
    inputBackground: "#150025",
    safeAreaBackground: "#0a0015"
  },
  light: {
    background: "#FAF5FF",
    backgroundGradient: ["#FAF5FF", "#F3E8FF", "#FAF5FF"],
    ownBubble: "#A855F7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#F3E8FF",
    otherBubbleText: "#581C87",
    accent: "#C084FC",
    inputBackground: "#F3E8FF",
    safeAreaBackground: "#FAF5FF"
  },
  particles: {
    emoji: "✨",
    count: 10,
    speed: "fast"
  }
};
