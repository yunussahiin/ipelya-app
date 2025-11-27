/**
 * SkinSmoothEffect Component
 *
 * Cilt düzeltme (beautify) efekti
 * Yüz bölgesine blur uygulayarak pürüzsüz görünüm sağlar
 *
 * @module face-effects/effects/SkinSmoothEffect
 */

import React, { memo, useMemo } from "react";
import { Group, BlurMask, Skia, Path } from "@shopify/react-native-skia";
import type { FaceData } from "../types";

// =============================================
// TYPES
// =============================================

export interface SkinSmoothEffectProps {
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
}

// =============================================
// CONSTANTS
// =============================================

// Blur yoğunluğu (intensity ile çarpılır)
const MAX_BLUR = 8;

// Yüz oval padding (bounds'dan büyütme)
const FACE_PADDING = 0.1;

// =============================================
// COMPONENT
// =============================================

export const SkinSmoothEffect = memo(function SkinSmoothEffect({
  face,
  intensity,
  canvasWidth,
  isMirrored
}: SkinSmoothEffectProps) {
  // Yüz oval path'i oluştur
  const faceOvalPath = useMemo(() => {
    const { bounds } = face;

    // Padding ekle
    const paddingX = bounds.width * FACE_PADDING;
    const paddingY = bounds.height * FACE_PADDING;

    // Mirror için x koordinatını çevir
    const x = isMirrored ? canvasWidth - bounds.x - bounds.width - paddingX : bounds.x - paddingX;

    const y = bounds.y - paddingY;
    const width = bounds.width + paddingX * 2;
    const height = bounds.height + paddingY * 2;

    // Oval path oluştur
    const path = Skia.Path.Make();
    path.addOval({
      x,
      y,
      width,
      height
    });

    return path;
  }, [face.bounds, canvasWidth, isMirrored]);

  // Blur miktarı
  const blurAmount = MAX_BLUR * intensity;

  // Çok düşük intensity'de render etme
  if (intensity < 0.1) {
    return null;
  }

  return (
    <Group opacity={intensity * 0.3}>
      {/* Yüz bölgesine hafif blur overlay */}
      <Path path={faceOvalPath} color="rgba(255, 220, 200, 0.15)" style="fill">
        <BlurMask blur={blurAmount} style="normal" />
      </Path>
    </Group>
  );
});

export default SkinSmoothEffect;
