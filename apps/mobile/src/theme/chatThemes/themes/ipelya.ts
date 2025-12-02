/**
 * İpelya Teması (Varsayılan)
 *
 * Uygulama accent rengini kullanır - dinamik olarak ThemeProvider'dan alınır.
 * Placeholder değerler runtime'da gerçek renklerle değiştirilir.
 */

import type { ThemeDefinition } from "../types";

const PLACEHOLDER = "__IPELYA__";

export const ipelyaTheme: ThemeDefinition = {
  id: "ipelya",
  name: "İpelya",
  emoji: "✨",
  description: "Varsayılan tema",
  particles: {
    emoji: "✨",
    count: 8,
    speed: "slow"
  },
  dark: {
    background: PLACEHOLDER,
    ownBubble: PLACEHOLDER,
    ownBubbleText: "#FFFFFF",
    otherBubble: PLACEHOLDER,
    otherBubbleText: "#FFFFFF",
    accent: PLACEHOLDER,
    inputBackground: PLACEHOLDER,
    safeAreaBackground: PLACEHOLDER
  },
  light: {
    background: PLACEHOLDER,
    ownBubble: PLACEHOLDER,
    ownBubbleText: "#FFFFFF",
    otherBubble: PLACEHOLDER,
    otherBubbleText: "#000000",
    accent: PLACEHOLDER,
    inputBackground: PLACEHOLDER,
    safeAreaBackground: PLACEHOLDER
  }
};
