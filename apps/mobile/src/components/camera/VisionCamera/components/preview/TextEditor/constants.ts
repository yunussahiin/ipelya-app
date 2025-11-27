/**
 * TextEditor Constants
 */

import type { FontStyle, TextStyleConfig } from "./types";

// Font stilleri
export const FONT_STYLES: FontStyle[] = [
  { id: "modern", name: "Modern", fontWeight: "700" },
  { id: "classic", name: "Classic", fontWeight: "400" },
  { id: "neon", name: "Neon", fontWeight: "900" },
  { id: "typewriter", name: "Daktilo", fontWeight: "300" },
  { id: "handwritten", name: "El Yazısı", fontWeight: "500" }
];

// Text stilleri (arka plan, gölge vb.)
export const TEXT_STYLES: TextStyleConfig[] = [
  { id: "plain", name: "Düz", hasBackground: false, hasShadow: true },
  { id: "highlight", name: "Vurgulu", hasBackground: true, hasShadow: false },
  { id: "neon", name: "Neon", hasBackground: false, hasShadow: true, glowColor: true },
  { id: "outline", name: "Çerçeve", hasBackground: false, hasShadow: false, hasOutline: true }
];

// Renk paleti
export const COLOR_PALETTE = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#00C7BE",
  "#007AFF",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#A2845E",
  "#8E8E93",
  "#636366",
  "#48484A"
];

// Font size limitleri
export const FONT_SIZE_MIN = 16;
export const FONT_SIZE_MAX = 64;
export const FONT_SIZE_DEFAULT = 32;

// Varsayılan değerler
export const DEFAULT_COLOR = COLOR_PALETTE[0];
export const DEFAULT_FONT_STYLE_ID = "modern";
export const DEFAULT_TEXT_STYLE_ID = "plain";
export const DEFAULT_ALIGNMENT = "center" as const;
