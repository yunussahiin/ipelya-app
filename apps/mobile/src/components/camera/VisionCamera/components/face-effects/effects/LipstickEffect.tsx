/**
 * LipstickEffect Component
 *
 * Dudak boyama (ruj) efekti
 * Dudak noktalarına göre path oluşturur ve renk overlay uygular
 *
 * @module face-effects/effects/LipstickEffect
 */

import React, { memo, useMemo } from "react";
import { Group, Path, Skia, BlurMask } from "@shopify/react-native-skia";
import type { FaceData } from "../types";

// =============================================
// TYPES
// =============================================

export interface LipstickEffectProps {
  /** Yüz verisi */
  face: FaceData;
  /** Efekt yoğunluğu (0-1) */
  intensity: number;
  /** Canvas genişliği */
  canvasWidth: number;
  /** Canvas yüksekliği */
  canvasHeight: number;
  /** Mirror (front kamera için) */
  isMirrored: boolean;
  /** Ruj rengi (RGBA) */
  color: string;
}

// =============================================
// CONSTANTS
// =============================================

// Varsayılan ruj renkleri
export const LIPSTICK_COLORS = {
  red: "rgba(255, 0, 80, 0.45)",
  pink: "rgba(255, 105, 180, 0.45)",
  coral: "rgba(255, 127, 80, 0.45)",
  berry: "rgba(139, 0, 98, 0.45)",
  nude: "rgba(205, 133, 102, 0.35)",
  plum: "rgba(142, 69, 133, 0.45)"
};

// Blur miktarı (yumuşak kenarlar için)
const BLUR_RADIUS = 3;

// =============================================
// COMPONENT
// =============================================

export const LipstickEffect = memo(function LipstickEffect({
  face,
  intensity,
  canvasWidth,
  isMirrored,
  color
}: LipstickEffectProps) {
  // Dudak path'i oluştur
  const lipPath = useMemo(() => {
    const { leftMouth, rightMouth, bottomMouth } = face.landmarks;

    // Basit dudak path'i (3 nokta ile)
    // TODO: Kontür noktaları aktif edildiğinde daha detaylı path oluşturulabilir
    const path = Skia.Path.Make();

    // Mirror için x koordinatlarını çevir
    const getX = (x: number) => (isMirrored ? canvasWidth - x : x);

    // Üst dudak (basit eğri)
    const leftX = getX(leftMouth.x);
    const rightX = getX(rightMouth.x);

    // Dudak yüksekliği
    const lipHeight = Math.abs(bottomMouth.y - leftMouth.y);

    // Merkez noktası
    const centerX = (leftX + rightX) / 2;
    const topY = leftMouth.y - lipHeight * 0.3;

    // Üst dudak
    path.moveTo(leftX, leftMouth.y);
    path.quadTo(centerX, topY, rightX, rightMouth.y);

    // Alt dudak
    path.quadTo(centerX, bottomMouth.y + lipHeight * 0.2, leftX, leftMouth.y);

    path.close();

    return path;
  }, [face.landmarks, canvasWidth, isMirrored]);

  // Rengi intensity'ye göre ayarla
  const adjustedColor = useMemo(() => {
    // RGBA formatından alpha değerini çıkar ve intensity ile çarp
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
    if (match) {
      const [, r, g, b, a = "1"] = match;
      const newAlpha = parseFloat(a) * intensity;
      return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
    }
    return color;
  }, [color, intensity]);

  return (
    <Group>
      <Path path={lipPath} color={adjustedColor} style="fill">
        <BlurMask blur={BLUR_RADIUS} style="normal" />
      </Path>
    </Group>
  );
});

export default LipstickEffect;
