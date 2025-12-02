/**
 * Bokeh Teması (Premium)
 *
 * Işık noktaları efekti - sıcak tonlar
 */

import type { ThemeDefinition } from "../types";

export const bokehTheme: ThemeDefinition = {
  id: "bokeh",
  name: "Bokeh",
  emoji: "✨",
  description: "Işık noktaları",
  dark: {
    background: "#0C0616",
    backgroundGradient: ["#0C0616", "#140B24", "#190C2B"],
    ownBubble: "#FFD296",
    ownBubbleText: "#1a1a1a",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#FFD296",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#0C0616"
  },
  light: {
    background: "#FFF8F0",
    backgroundGradient: ["#FFF8F0", "#FFF0E6", "#FFF5F8"],
    ownBubble: "#F59E0B",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#451A03",
    accent: "#F59E0B",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#FFF8F0"
  }
};
