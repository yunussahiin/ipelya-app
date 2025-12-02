/**
 * Cyber Teması (Premium)
 *
 * Neon ızgara efekti - cyan/magenta
 */

import type { ThemeDefinition } from "../types";

export const cyberTheme: ThemeDefinition = {
  id: "cyber",
  name: "Cyber",
  emoji: "🔮",
  description: "Neon ızgara",
  dark: {
    background: "#010008",
    backgroundGradient: ["#010008", "#050013", "#05000E"],
    ownBubble: "#00FFFF",
    ownBubbleText: "#000000",
    otherBubble: "rgba(0,255,255,0.15)",
    otherBubbleText: "#00FFFF",
    accent: "#FF00FF",
    inputBackground: "rgba(0,255,255,0.08)",
    safeAreaBackground: "#010008"
  },
  light: {
    background: "#F0FFFF",
    backgroundGradient: ["#F0FFFF", "#E0F7FA", "#F3E5F5"],
    ownBubble: "#0097A7",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#006064",
    accent: "#9C27B0",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F0FFFF"
  }
};
