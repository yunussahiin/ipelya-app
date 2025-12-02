/**
 * Ocean Bokeh Teması
 * Pack 2 - Abstract/Bokeh
 */

import type { ThemeDefinition } from "../types";

export const oceanBokehTheme: ThemeDefinition = {
  id: "ocean-bokeh",
  name: "Ocean Bokeh",
  emoji: "💧",
  description: "Okyanus bokeh",
  dark: {
    background: "#02141F",
    backgroundGradient: ["#02141F", "#032331", "#032C3C"],
    ownBubble: "#06B6D4",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#22D3EE",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#02141F"
  },
  light: {
    background: "#E6FAFF",
    backgroundGradient: ["#E6FAFF", "#E2F4FF"],
    ownBubble: "#06B6D4",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#164E63",
    accent: "#22D3EE",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#E6FAFF"
  },
  particles: {
    emoji: "💧",
    count: 12,
    speed: "medium"
  },
  pattern: {
    type: "waves",
    opacity: 0.18
  }
};
