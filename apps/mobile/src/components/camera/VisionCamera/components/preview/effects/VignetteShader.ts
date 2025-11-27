/**
 * VignetteShader
 *
 * Kenar karartma efekti için SKSL shader
 * Fotoğrafın kenarlarını koyulaştırarak odak noktasını vurgular
 */

import { Skia } from "@shopify/react-native-skia";

/**
 * Vignette shader SKSL kodu
 * 
 * Uniforms:
 * - image: Kaynak görüntü
 * - resolution: Canvas boyutları [width, height]
 * - intensity: Efekt yoğunluğu (0.0 - 2.0, varsayılan 1.0)
 * - radius: Vignette başlangıç yarıçapı (0.0 - 1.0, varsayılan 0.5)
 * - softness: Kenar yumuşaklığı (0.0 - 1.0, varsayılan 0.5)
 */
const VIGNETTE_SKSL = `
uniform shader image;
uniform float2 resolution;
uniform float intensity;
uniform float radius;
uniform float softness;

half4 main(float2 xy) {
  // Orijinal piksel rengini al
  half4 color = image.eval(xy);
  
  // Koordinatları normalize et (0-1 arası)
  float2 uv = xy / resolution;
  
  // Merkez noktası
  float2 center = float2(0.5, 0.5);
  
  // Merkezden uzaklık (0 merkezde, ~0.7 köşelerde)
  float dist = distance(uv, center);
  
  // Vignette faktörü hesapla
  // smoothstep ile yumuşak geçiş sağla
  float vignette = smoothstep(radius, radius + softness, dist * intensity);
  
  // Kenarları koyulaştır
  color.rgb *= 1.0 - vignette * 0.8;
  
  return color;
}
`;

/**
 * Vignette shader'ı oluştur
 * @returns SkRuntimeEffect veya null (hata durumunda)
 */
export function createVignetteShader() {
  try {
    const shader = Skia.RuntimeEffect.Make(VIGNETTE_SKSL);
    if (!shader) {
      console.error("[VignetteShader] Shader derleme hatası");
      return null;
    }
    return shader;
  } catch (error) {
    console.error("[VignetteShader] Shader oluşturma hatası:", error);
    return null;
  }
}

/**
 * Vignette varsayılan değerleri
 */
export const VIGNETTE_DEFAULTS = {
  intensity: 1.2,
  radius: 0.3,
  softness: 0.5,
};

/**
 * Vignette preset'leri
 */
export const VIGNETTE_PRESETS = {
  /** Hafif vignette - subtle etki */
  light: { intensity: 0.8, radius: 0.4, softness: 0.6 },
  /** Normal vignette - dengeli etki */
  normal: { intensity: 1.2, radius: 0.3, softness: 0.5 },
  /** Güçlü vignette - dramatik etki */
  strong: { intensity: 1.8, radius: 0.2, softness: 0.4 },
  /** Vintage vignette - eski fotoğraf etkisi */
  vintage: { intensity: 2.0, radius: 0.15, softness: 0.3 },
};

export type VignettePreset = keyof typeof VIGNETTE_PRESETS;

export default createVignetteShader;
