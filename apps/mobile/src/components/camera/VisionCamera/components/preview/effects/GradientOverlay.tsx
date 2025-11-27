/**
 * GradientOverlay
 *
 * Gradient overlay efekti
 * Text okunabilirliği için alt/üst gradient
 */

import React from "react";
import { Rect, LinearGradient, vec } from "@shopify/react-native-skia";

interface GradientOverlayProps {
  /** Canvas genişliği */
  width: number;
  /** Canvas yüksekliği */
  height: number;
  /** Gradient pozisyonu: "top" | "bottom" | "both" */
  position?: "top" | "bottom" | "both";
  /** Gradient yükseklik yüzdesi (0.0 - 1.0) */
  coverage?: number;
  /** Başlangıç rengi (şeffaf) */
  startColor?: string;
  /** Bitiş rengi (koyu) */
  endColor?: string;
  /** Efekt aktif mi */
  enabled?: boolean;
}

/**
 * GradientOverlay Component
 *
 * Kullanım:
 * ```tsx
 * <Canvas style={{ width: 256, height: 256 }}>
 *   <Image image={image} ... />
 *   <GradientOverlay
 *     width={256}
 *     height={256}
 *     position="bottom"
 *     coverage={0.4}
 *   />
 * </Canvas>
 * ```
 */
export function GradientOverlay({
  width,
  height,
  position = "bottom",
  coverage = 0.4,
  startColor = "transparent",
  endColor = "rgba(0, 0, 0, 0.7)",
  enabled = true
}: GradientOverlayProps) {
  if (!enabled) return null;

  const gradientHeight = height * coverage;

  // Bottom gradient
  const renderBottomGradient = () => (
    <Rect x={0} y={height - gradientHeight} width={width} height={gradientHeight}>
      <LinearGradient
        start={vec(0, height - gradientHeight)}
        end={vec(0, height)}
        colors={[startColor, endColor]}
      />
    </Rect>
  );

  // Top gradient
  const renderTopGradient = () => (
    <Rect x={0} y={0} width={width} height={gradientHeight}>
      <LinearGradient
        start={vec(0, gradientHeight)}
        end={vec(0, 0)}
        colors={[startColor, endColor]}
      />
    </Rect>
  );

  switch (position) {
    case "top":
      return renderTopGradient();
    case "bottom":
      return renderBottomGradient();
    case "both":
      return (
        <>
          {renderTopGradient()}
          {renderBottomGradient()}
        </>
      );
    default:
      return renderBottomGradient();
  }
}

/**
 * Gradient Overlay preset'leri
 */
export const GRADIENT_OVERLAY_PRESETS = {
  /** Hafif gradient - subtle etki */
  light: { coverage: 0.3, endColor: "rgba(0, 0, 0, 0.4)" },
  /** Normal gradient - dengeli etki */
  normal: { coverage: 0.4, endColor: "rgba(0, 0, 0, 0.6)" },
  /** Güçlü gradient - dramatik etki */
  strong: { coverage: 0.5, endColor: "rgba(0, 0, 0, 0.8)" },
  /** Story gradient - Instagram story tarzı */
  story: { coverage: 0.35, endColor: "rgba(0, 0, 0, 0.5)" }
};

export type GradientOverlayPreset = keyof typeof GRADIENT_OVERLAY_PRESETS;

export default GradientOverlay;
