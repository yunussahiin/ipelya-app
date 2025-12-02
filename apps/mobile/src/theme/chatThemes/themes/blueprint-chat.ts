/**
 * Blueprint Chat Teması
 * Pack 4 - Minimal/Tech
 */

import type { ThemeDefinition } from "../types";

export const blueprintChatTheme: ThemeDefinition = {
  id: "blueprint-chat",
  name: "Blueprint Chat",
  emoji: "+",
  description: "Blueprint",
  dark: {
    background: "#050A18",
    backgroundGradient: ["#050A18", "#060E20"],
    ownBubble: "#3B82F6",
    ownBubbleText: "#FFFFFF",
    otherBubble: "rgba(59,130,246,0.15)",
    otherBubbleText: "#93C5FD",
    accent: "#60A5FA",
    inputBackground: "rgba(59,130,246,0.08)",
    safeAreaBackground: "#050A18"
  },
  light: {
    background: "#E8F0FF",
    backgroundGradient: ["#E8F0FF", "#E0EBFF"],
    ownBubble: "#2563EB",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#FFFFFF",
    otherBubbleText: "#1E3A8A",
    accent: "#3B82F6",
    inputBackground: "#FFFFFF",
    safeAreaBackground: "#E8F0FF"
  },
  particles: {
    emoji: "+",
    count: 10,
    speed: "slow"
  }
};
