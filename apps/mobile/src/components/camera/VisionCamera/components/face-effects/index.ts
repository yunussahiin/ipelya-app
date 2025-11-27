/**
 * Face Effects Module
 *
 * VisionCamera için gerçek zamanlı yüz efektleri
 * Instagram/Snapchat tarzı AR filtreleri
 *
 * @module face-effects
 *
 * Kullanım:
 * ```tsx
 * import {
 *   useFaceDetection,
 *   useFaceEffects,
 *   FaceEffectOverlay,
 *   FaceEffectSelector
 * } from './face-effects';
 *
 * // Kamera component'inde
 * const { faces, frameProcessor } = useFaceDetection({ enabled: true });
 * const { activeEffects, addEffect } = useFaceEffects();
 *
 * <Camera frameProcessor={frameProcessor} />
 * <FaceEffectOverlay faces={faces} effects={activeEffects} />
 * ```
 */

// Types
export * from "./types";

// Hooks
export { useFaceDetection } from "./hooks/useFaceDetection";
export type { UseFaceDetectionOptions } from "./hooks/useFaceDetection";
export { useFaceEffects } from "./hooks/useFaceEffects";
export type { UseFaceEffectsOptions } from "./hooks/useFaceEffects";

// Main Components
export { FaceEffectOverlay } from "./FaceEffectOverlay";
export { FaceEffectSelector } from "./FaceEffectSelector";
export type { FaceEffectSelectorProps } from "./FaceEffectSelector";
export { EffectCarousel } from "./EffectCarousel";
export type { EffectItem, EffectCarouselProps } from "./EffectCarousel";

// Individual Effects
export { GlassesEffect } from "./effects/GlassesEffect";
export { LipstickEffect } from "./effects/LipstickEffect";
export { SkinSmoothEffect } from "./effects/SkinSmoothEffect";
export { SparkleEffect } from "./effects/SparkleEffect";

// Presets
export {
  EFFECT_PRESETS,
  MAKEUP_PRESETS,
  FILTER_PRESETS,
  GLASSES_EFFECTS,
  MAKEUP_EFFECTS,
  BEAUTY_EFFECTS,
  PARTICLE_EFFECTS,
  MASK_EFFECTS,
  getPresetById,
  getEffectsByCategory,
  getAllEffects,
  getCarouselEffects,
} from "./presets";
