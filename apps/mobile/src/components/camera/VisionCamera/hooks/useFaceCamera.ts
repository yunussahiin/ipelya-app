/**
 * useFaceCamera Hook
 *
 * VisionCamera için yüz efektleri entegrasyonu
 * Face detection + Effect management + Carousel state
 *
 * @module VisionCamera/hooks/useFaceCamera
 */

import { useState, useCallback, useMemo } from "react";
import { useFaceDetection } from "../components/face-effects/hooks/useFaceDetection";
import { useFaceEffects } from "../components/face-effects/hooks/useFaceEffects";
import { getCarouselEffects } from "../components/face-effects/presets";
import type { FaceEffectConfig, FaceData } from "../components/face-effects/types";
import type { EffectItem } from "../components/face-effects/EffectCarousel";

// =============================================
// TYPES
// =============================================

export interface UseFaceCameraOptions {
  /** Yüz efektleri aktif mi */
  enabled?: boolean;
  /** Performans modu */
  performanceMode?: "fast" | "accurate";
  /** Maksimum yüz sayısı */
  maxFaces?: number;
}

export interface UseFaceCameraReturn {
  /** Algılanan yüzler */
  faces: FaceData[];
  /** Frame processor (Camera'ya verilecek) */
  frameProcessor: ReturnType<typeof useFaceDetection>["frameProcessor"];
  /** Aktif efektler */
  activeEffects: FaceEffectConfig[];
  /** Seçili efekt ID */
  selectedEffectId: string;
  /** Carousel efekt listesi */
  carouselEffects: EffectItem[];
  /** Efekt seç */
  selectEffect: (effect: EffectItem) => void;
  /** Efekt temizle */
  clearEffects: () => void;
  /** Yüz algılandı mı */
  hasFace: boolean;
  /** Efektler aktif mi */
  hasActiveEffects: boolean;
  /** Yüz algılama hatası */
  faceDetectionError: string | null;
  /** Frame boyutları (koordinat dönüşümü için) */
  frameSize: { width: number; height: number };
}

// =============================================
// HOOK
// =============================================

export function useFaceCamera(
  options: UseFaceCameraOptions = {}
): UseFaceCameraReturn {
  const { enabled = true, performanceMode = "fast", maxFaces = 1 } = options;

  // Seçili efekt state
  const [selectedEffectId, setSelectedEffectId] = useState<string>("none");

  // Face detection hook
  const { faces, frameProcessor, hasFace, error: faceDetectionError, frameSize } = useFaceDetection({
    enabled,
    performanceMode,
    maxFaces,
  });

  // Face effects hook
  const { activeEffects, addEffect, removeEffect, clearEffects } = useFaceEffects();

  // Carousel efektlerini oluştur
  const carouselEffects = useMemo((): EffectItem[] => {
    const effects = getCarouselEffects();
    
    // Sol yarı (ortanın solunda)
    const leftEffects = effects.slice(0, 5).map((config) => ({
      id: config.id,
      name: config.name,
      type: "effect" as const,
      icon: config.icon,
      config,
    }));

    // Sağ yarı (ortanın sağında)
    const rightEffects = effects.slice(5).map((config) => ({
      id: config.id,
      name: config.name,
      type: "effect" as const,
      icon: config.icon,
      config,
    }));

    return [...leftEffects, ...rightEffects];
  }, []);

  // Efekt seçimi
  const selectEffect = useCallback(
    (effect: EffectItem) => {
      console.log("[useFaceCamera] selectEffect called:", {
        effectId: effect.id,
        effectType: effect.type,
        hasConfig: !!effect.config,
        configId: effect.config?.id
      });

      // Önceki efekti kaldır
      if (selectedEffectId !== "none") {
        const prevEffect = carouselEffects.find((e) => e.id === selectedEffectId);
        if (prevEffect?.config) {
          console.log("[useFaceCamera] Removing previous effect:", prevEffect.config.id);
          removeEffect(prevEffect.config.id);
        }
      }

      // Yeni efekti seç
      setSelectedEffectId(effect.id);

      // Efektsiz mod değilse efekti ekle
      if (effect.type === "effect" && effect.config) {
        console.log("[useFaceCamera] Adding effect:", effect.config.id, effect.config.type);
        addEffect(effect.config);
      } else {
        console.log("[useFaceCamera] Not adding effect - type:", effect.type, "hasConfig:", !!effect.config);
      }
    },
    [selectedEffectId, carouselEffects, addEffect, removeEffect]
  );

  // Efektleri temizle
  const handleClearEffects = useCallback(() => {
    clearEffects();
    setSelectedEffectId("none");
  }, [clearEffects]);

  return {
    faces,
    frameProcessor,
    activeEffects,
    selectedEffectId,
    carouselEffects,
    selectEffect,
    clearEffects: handleClearEffects,
    hasFace,
    hasActiveEffects: activeEffects.length > 0,
    faceDetectionError,
    frameSize,
  };
}

export default useFaceCamera;
