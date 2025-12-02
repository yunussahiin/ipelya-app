/**
 * Code Matrix Teması
 * Pack 4 - Minimal/Tech
 */

import type { ThemeDefinition } from "../types";

export const codeMatrixTheme: ThemeDefinition = {
  id: "code-matrix",
  name: "Code Matrix",
  emoji: "▮",
  description: "Matrix kodu",
  dark: {
    background: "#020D07",
    backgroundGradient: ["#020D07", "#02140D", "#031C14"],
    ownBubble: "#22C55E",
    ownBubbleText: "#000000",
    otherBubble: "rgba(34,197,94,0.15)",
    otherBubbleText: "#22C55E",
    accent: "#4ADE80",
    inputBackground: "rgba(34,197,94,0.08)",
    safeAreaBackground: "#020D07"
  },
  light: {
    background: "#E8F5EC",
    backgroundGradient: ["#E8F5EC", "#E1F3EE"],
    ownBubble: "#16A34A",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#14532D",
    accent: "#22C55E",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#E8F5EC"
  },
  particles: {
    emoji: "▮",
    count: 24,
    speed: "fast"
  }
};
