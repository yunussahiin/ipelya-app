/**
 * Soft Bokeh Teması
 * Pack 2 - Abstract/Bokeh
 */

import type { ThemeDefinition } from "../types";

export const softBokehTheme: ThemeDefinition = {
  id: "soft-bokeh",
  name: "Soft Bokeh",
  emoji: "●",
  description: "Yumuşak bokeh",
  dark: {
    background: "#0D0A18",
    backgroundGradient: ["#0D0A18", "#130C24", "#160D2A"],
    ownBubble: "#A78BFA",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.12)",
    otherBubbleText: "#FFFFFF",
    accent: "#C4B5FD",
    inputBackground: "rgba(255,255,255,0.08)",
    safeAreaBackground: "#0D0A18"
  },
  light: {
    background: "#F7F4FF",
    backgroundGradient: ["#F7F4FF", "#F1F5FF"],
    ownBubble: "#A78BFA",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#4C1D95",
    accent: "#C4B5FD",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F7F4FF"
  },
  particles: {
    emoji: "●",
    count: 10,
    speed: "slow"
  }
};
