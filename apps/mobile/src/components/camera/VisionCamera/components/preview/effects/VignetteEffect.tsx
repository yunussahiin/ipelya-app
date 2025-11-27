/**
 * VignetteEffect
 *
 * Vignette (kenar karartma) efekti için Skia component
 * Fotoğrafın kenarlarını koyulaştırarak odak noktasını vurgular
 */

import React, { useMemo } from "react";
import { Shader, ImageShader, Fill, SkImage } from "@shopify/react-native-skia";
import { createVignetteShader, VIGNETTE_DEFAULTS } from "./VignetteShader";

interface VignetteEffectProps {
  /** Kaynak görüntü */
  image: SkImage;
  /** Canvas genişliği */
  width: number;
  /** Canvas yüksekliği */
  height: number;
  /** Efekt yoğunluğu (0.0 - 2.0) */
  intensity?: number;
  /** Vignette başlangıç yarıçapı (0.0 - 1.0) */
  radius?: number;
  /** Kenar yumuşaklığı (0.0 - 1.0) */
  softness?: number;
  /** Efekt aktif mi */
  enabled?: boolean;
}

/**
 * VignetteEffect Component
 *
 * Kullanım:
 * ```tsx
 * <Canvas style={{ width: 256, height: 256 }}>
 *   <VignetteEffect
 *     image={image}
 *     width={256}
 *     height={256}
 *     intensity={1.2}
 *   />
 * </Canvas>
 * ```
 */
export function VignetteEffect({
  image,
  width,
  height,
  intensity = VIGNETTE_DEFAULTS.intensity,
  radius = VIGNETTE_DEFAULTS.radius,
  softness = VIGNETTE_DEFAULTS.softness,
  enabled = true
}: VignetteEffectProps) {
  // Shader'ı bir kez oluştur
  const shader = useMemo(() => createVignetteShader(), []);

  // Shader yoksa veya efekt kapalıysa sadece görüntüyü göster
  if (!shader || !enabled) {
    return (
      <Fill>
        <ImageShader image={image} fit="cover" rect={{ x: 0, y: 0, width, height }} />
      </Fill>
    );
  }

  return (
    <Fill>
      <Shader
        source={shader}
        uniforms={{
          resolution: [width, height],
          intensity,
          radius,
          softness
        }}
      >
        <ImageShader image={image} fit="cover" rect={{ x: 0, y: 0, width, height }} />
      </Shader>
    </Fill>
  );
}

export default VignetteEffect;
