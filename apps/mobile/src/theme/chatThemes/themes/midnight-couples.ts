/**
 * Midnight Couples Teması
 * Pack 5 - Love/Romantic
 */

import type { ThemeDefinition } from "../types";

export const midnightCouplesTheme: ThemeDefinition = {
  id: "midnight-couples",
  name: "Midnight Couples",
  emoji: "💗",
  description: "Gece çiftleri",
  dark: {
    background: "#040717",
    backgroundGradient: ["#040717", "#060A1F", "#070C25"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(255,255,255,0.10)",
    otherBubbleText: "#FFFFFF",
    accent: "#F472B6",
    inputBackground: "rgba(255,255,255,0.06)",
    safeAreaBackground: "#040717"
  },
  light: {
    background: "#F2F5FF",
    backgroundGradient: ["#F2F5FF", "#EDEFFF"],
    ownBubble: "#EC4899",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#831843",
    accent: "#F472B6",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#F2F5FF"
  },
  particles: {
    emoji: "💗",
    count: 10,
    speed: "slow"
  }
};
