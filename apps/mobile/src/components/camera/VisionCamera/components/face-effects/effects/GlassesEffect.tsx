/**
 * GlassesEffect Component
 *
 * Gözlük overlay efekti
 * Göz noktalarına göre pozisyon, scale ve rotation hesaplar
 *
 * @module face-effects/effects/GlassesEffect
 */

import React, { memo, useMemo } from "react";
import { Group, ImageSVG, useSVG, Circle, Line, vec } from "@shopify/react-native-skia";
import type { FaceData } from "../types";

// =============================================
// TYPES
// =============================================

export interface GlassesEffectProps {
  /** Yüz verisi */
  face: FaceData;
  /** Efekt yoğunluğu (0-1) */
  intensity: number;
  /** Canvas genişliği */
  canvasWidth: number;
  /** Canvas yüksekliği (gelecekte kullanılacak) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canvasHeight: number;
  /** Mirror (front kamera için) */
  isMirrored: boolean;
  /** Gözlük asset yolu */
  asset?: string;
  /** Gözlük varyantı */
  variant?: "glasses" | "sunglasses";
}

// =============================================
// CONSTANTS
// =============================================

// Varsayılan gözlük boyut oranları
const GLASSES_WIDTH_RATIO = 2.8; // Göz mesafesinin katı
const GLASSES_HEIGHT_RATIO = 0.4; // Genişliğin oranı (SVG 200x80 = 0.4)
const GLASSES_Y_OFFSET = 0; // Göz merkezinden offset (0 = tam göz hizasında)

// =============================================
// COMPONENT
// =============================================

export const GlassesEffect = memo(function GlassesEffect({
  face,
  intensity,
  canvasWidth,
  canvasHeight,
  isMirrored,
  asset,
  variant = "glasses"
}: GlassesEffectProps) {
  // SVG Asset yükle (varsa)
  const svg = useSVG(asset ?? null);

  // Gözlük pozisyon ve boyut hesaplama
  const glassesTransform = useMemo(() => {
    const { leftEye, rightEye } = face.landmarks;

    // Göz merkezi
    const centerX = (leftEye.x + rightEye.x) / 2;
    const centerY = (leftEye.y + rightEye.y) / 2;

    // Göz mesafesi (scale için)
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

    // Gözlük boyutları
    const width = eyeDistance * GLASSES_WIDTH_RATIO;
    const height = width * GLASSES_HEIGHT_RATIO;

    // Pozisyon (merkez noktasından)
    const x = centerX - width / 2;
    const y = centerY - height * GLASSES_Y_OFFSET - height / 2;

    // Baş rotasyonu (roll açısı)
    const rotation = face.rotation.roll * (Math.PI / 180);

    // NOT: Mirror zaten FaceEffectOverlay'de uygulandı, burada tekrar yapmıyoruz
    return {
      x,
      y,
      width,
      height,
      rotation,
      centerX,
      centerY
    };
  }, [face]);

  // SVG yoksa placeholder çiz
  if (!svg) {
    return (
      <GlassesPlaceholder transform={glassesTransform} intensity={intensity} variant={variant} />
    );
  }

  // SVG ile render
  return (
    <Group
      transform={[
        { translateX: glassesTransform.centerX },
        { translateY: glassesTransform.centerY },
        { rotate: glassesTransform.rotation },
        { translateX: -glassesTransform.centerX },
        { translateY: -glassesTransform.centerY }
      ]}
      opacity={intensity}
    >
      <ImageSVG
        svg={svg}
        x={glassesTransform.x}
        y={glassesTransform.y}
        width={glassesTransform.width}
        height={glassesTransform.height}
      />
    </Group>
  );
});

// =============================================
// PLACEHOLDER COMPONENT
// =============================================

interface GlassesPlaceholderProps {
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    centerX: number;
    centerY: number;
  };
  intensity: number;
  variant: "glasses" | "sunglasses";
}

/**
 * Asset yokken gösterilen placeholder gözlük
 * Basit çerçeve çizimi
 */
const GlassesPlaceholder = memo(function GlassesPlaceholder({
  transform,
  intensity,
  variant
}: GlassesPlaceholderProps) {
  // Lens boyutları
  const lensRadius = transform.width / 5;
  const lensSpacing = transform.width / 5;
  const bridgeY = transform.y + transform.height / 2;

  // Sol ve sağ lens merkezleri
  const leftLensX = transform.x + transform.width / 2 - lensSpacing;
  const rightLensX = transform.x + transform.width / 2 + lensSpacing;

  // Renk (sunglasses için koyu, glasses için şeffaf)
  const lensColor = variant === "sunglasses" ? "rgba(0, 0, 0, 0.6)" : "rgba(200, 220, 255, 0.3)";
  const frameColor = variant === "sunglasses" ? "#1a1a1a" : "#333333";

  return (
    <Group
      transform={[
        { translateX: transform.centerX },
        { translateY: transform.centerY },
        { rotate: transform.rotation },
        { translateX: -transform.centerX },
        { translateY: -transform.centerY }
      ]}
      opacity={intensity}
    >
      {/* Sol lens */}
      <Circle cx={leftLensX} cy={bridgeY} r={lensRadius} color={lensColor} />
      <Circle
        cx={leftLensX}
        cy={bridgeY}
        r={lensRadius}
        color={frameColor}
        style="stroke"
        strokeWidth={3}
      />

      {/* Sağ lens */}
      <Circle cx={rightLensX} cy={bridgeY} r={lensRadius} color={lensColor} />
      <Circle
        cx={rightLensX}
        cy={bridgeY}
        r={lensRadius}
        color={frameColor}
        style="stroke"
        strokeWidth={3}
      />

      {/* Köprü (burun kısmı) */}
      <Line
        p1={vec(leftLensX + lensRadius, bridgeY)}
        p2={vec(rightLensX - lensRadius, bridgeY)}
        color={frameColor}
        strokeWidth={3}
      />
    </Group>
  );
});

export default GlassesEffect;
