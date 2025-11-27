/**
 * SparkleEffect Component
 *
 * Parıltı efekti
 * Yüz çevresinde animasyonlu parıltılar gösterir
 *
 * @module face-effects/effects/SparkleEffect
 */

import React, { memo, useMemo } from "react";
import { Group, Circle } from "@shopify/react-native-skia";
import type { FaceData } from "../types";

// =============================================
// TYPES
// =============================================

export interface SparkleEffectProps {
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

// Parıltı sayısı
const SPARKLE_COUNT = 8;

// Parıltı renkleri
const SPARKLE_COLORS = [
  "rgba(255, 255, 255, 0.9)",
  "rgba(255, 215, 0, 0.8)",
  "rgba(255, 192, 203, 0.7)",
  "rgba(173, 216, 230, 0.7)"
];

// =============================================
// HELPER
// =============================================

interface Sparkle {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
}

/**
 * Yüz çevresinde rastgele parıltı pozisyonları oluştur
 */
function generateSparkles(
  face: FaceData,
  canvasWidth: number,
  isMirrored: boolean,
  _intensity: number // Gelecekte parıltı sayısını ayarlamak için kullanılacak
): Sparkle[] {
  const { bounds } = face;
  const sparkles: Sparkle[] = [];

  // Seed için face ID kullan (tutarlı pozisyonlar için)
  const seed = face.id;

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    // Pseudo-random değerler (seed + index bazlı)
    const angle = ((seed + i) * 137.5) % 360;
    const distance = 0.3 + ((seed * i) % 100) / 200;

    // Yüz merkezi
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Parıltı pozisyonu (yüz çevresinde)
    const radius = Math.max(bounds.width, bounds.height) * distance;
    const x = centerX + Math.cos((angle * Math.PI) / 180) * radius;
    const y = centerY + Math.sin((angle * Math.PI) / 180) * radius;

    // Mirror için x koordinatını çevir
    const finalX = isMirrored ? canvasWidth - x : x;

    sparkles.push({
      x: finalX,
      y,
      radius: 3 + (i % 3) * 2,
      color: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
      opacity: 0.5 + (i % 5) * 0.1
    });
  }

  return sparkles;
}

// =============================================
// COMPONENT
// =============================================

export const SparkleEffect = memo(function SparkleEffect({
  face,
  intensity,
  canvasWidth,
  isMirrored
}: SparkleEffectProps) {
  // Parıltıları oluştur
  const sparkles = useMemo(
    () => generateSparkles(face, canvasWidth, isMirrored, intensity),
    [face, canvasWidth, isMirrored, intensity]
  );

  // Çok düşük intensity'de render etme
  if (intensity < 0.1) {
    return null;
  }

  return (
    <Group opacity={intensity}>
      {sparkles.map((sparkle, index) => (
        <Circle
          key={index}
          cx={sparkle.x}
          cy={sparkle.y}
          r={sparkle.radius}
          color={sparkle.color}
          opacity={sparkle.opacity}
        />
      ))}
    </Group>
  );
});

export default SparkleEffect;
