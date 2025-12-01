/**
 * Story Viewer Constants
 * Instagram tarzı animasyon sabitleri
 */

import { Dimensions, Platform } from "react-native";

// Ekran boyutları
export const { width: WIDTH, height: HEIGHT } = Dimensions.get("screen");

// Animasyon süreleri (ms)
export const STORY_ANIMATION_DURATION = 300; // Story geçiş animasyonu (hızlı)
export const STORY_DURATION = 5000; // Varsayılan story süresi (5 saniye)
export const LONG_PRESS_DURATION = 200; // Long press threshold

// 3D Cube animasyonu
export const CUBE_ANGLE = Math.PI / 3; // 60 derece
export const CUBE_RATIO = Platform.OS === "ios" ? 2 : 1.2; // Platform-specific

// Renkler
export const PROGRESS_COLOR = "rgba(255, 255, 255, 0.3)";
export const PROGRESS_ACTIVE_COLOR = "#FFFFFF";
export const BACKGROUND_COLOR = "#000000";

// Avatar gradient renkleri (Instagram tarzı)
export const AVATAR_GRADIENT_COLORS = [
  "#F7B801",
  "#F18701",
  "#F35B04",
  "#F5301E",
  "#C81D4E",
  "#8F1D4E"
];
export const AVATAR_SEEN_COLORS = ["#2A2A2C"];

// Boyutlar
export const AVATAR_SIZE = 60;
export const STORY_AVATAR_SIZE = 26;
