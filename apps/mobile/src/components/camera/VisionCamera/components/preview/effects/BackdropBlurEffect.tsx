/**
 * BackdropBlurEffect
 *
 * Arka plan bulanıklaştırma efekti
 * Instagram story tarzı blur overlay
 */

import React from "react";
import { BackdropBlur, Fill, rect } from "@shopify/react-native-skia";

interface BackdropBlurEffectProps {
  /** Canvas genişliği */
  width: number;
  /** Canvas yüksekliği */
  height: number;
  /** Blur yoğunluğu (1-20 arası önerilir) */
  blur?: number;
  /** Blur alanı pozisyonu: "top" | "bottom" | "full" */
  position?: "top" | "bottom" | "full";
  /** Blur alanı yüzdesi (0.0 - 1.0) */
  coverage?: number;
  /** Overlay rengi (opsiyonel) */
  overlayColor?: string;
  /** Efekt aktif mi */
  enabled?: boolean;
}

/**
 * BackdropBlurEffect Component
 *
 * Kullanım:
 * ```tsx
 * <Canvas style={{ width: 256, height: 256 }}>
 *   <Image image={image} ... />
 *   <BackdropBlurEffect
 *     width={256}
 *     height={256}
 *     blur={10}
 *     position="bottom"
 *     coverage={0.3}
 *   />
 * </Canvas>
 * ```
 */
export function BackdropBlurEffect({
  width,
  height,
  blur = 10,
  position = "bottom",
  coverage = 0.3,
  overlayColor = "rgba(0, 0, 0, 0.2)",
  enabled = true
}: BackdropBlurEffectProps) {
  if (!enabled) return null;

  // Blur alanını hesapla
  const blurHeight = height * coverage;
  let clipRect;

  switch (position) {
    case "top":
      clipRect = rect(0, 0, width, blurHeight);
      break;
    case "bottom":
      clipRect = rect(0, height - blurHeight, width, blurHeight);
      break;
    case "full":
    default:
      clipRect = rect(0, 0, width, height);
      break;
  }

  return (
    <BackdropBlur blur={blur} clip={clipRect}>
      <Fill color={overlayColor} />
    </BackdropBlur>
  );
}

/**
 * Backdrop Blur preset'leri
 */
export const BACKDROP_BLUR_PRESETS = {
  /** Hafif blur - subtle etki */
  light: { blur: 5, coverage: 0.25, overlayColor: "rgba(0, 0, 0, 0.1)" },
  /** Normal blur - dengeli etki */
  normal: { blur: 10, coverage: 0.3, overlayColor: "rgba(0, 0, 0, 0.2)" },
  /** Güçlü blur - dramatik etki */
  strong: { blur: 20, coverage: 0.4, overlayColor: "rgba(0, 0, 0, 0.3)" },
  /** Story blur - Instagram story tarzı */
  story: { blur: 15, coverage: 0.35, overlayColor: "rgba(0, 0, 0, 0.15)" }
};

export type BackdropBlurPreset = keyof typeof BACKDROP_BLUR_PRESETS;

export default BackdropBlurEffect;
