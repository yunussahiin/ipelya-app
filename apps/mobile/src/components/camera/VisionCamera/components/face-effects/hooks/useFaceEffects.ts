/**
 * useFaceEffects Hook
 *
 * Yüz efektlerini yönetmek için hook
 * Efekt ekleme, kaldırma, güncelleme işlemleri
 *
 * @module face-effects/hooks/useFaceEffects
 *
 * Kullanım:
 * ```tsx
 * const { activeEffects, addEffect, removeEffect, setIntensity } = useFaceEffects();
 *
 * // Efekt ekle
 * addEffect({
 *   id: 'glasses-1',
 *   type: 'glasses',
 *   category: 'accessories',
 *   name: 'Aviator',
 *   enabled: true,
 *   intensity: 1,
 *   asset: require('./assets/glasses/aviator.png')
 * });
 *
 * // Yoğunluk ayarla
 * setIntensity('glasses-1', 0.8);
 * ```
 */

import { useState, useCallback } from "react";
import type { FaceEffectConfig, FaceEffectPreset } from "../types";

// =============================================
// TYPES
// =============================================

export interface UseFaceEffectsOptions {
  /** Başlangıç efektleri */
  initialEffects?: FaceEffectConfig[];
  /** Maksimum aktif efekt sayısı */
  maxEffects?: number;
}

// =============================================
// HOOK
// =============================================

export function useFaceEffects(options: UseFaceEffectsOptions = {}) {
  const { initialEffects = [], maxEffects = 10 } = options;

  // Aktif efektler state'i
  const [activeEffects, setActiveEffects] =
    useState<FaceEffectConfig[]>(initialEffects);

  /**
   * Yeni efekt ekle
   * Aynı ID'li efekt varsa günceller
   */
  const addEffect = useCallback(
    (effect: FaceEffectConfig) => {
      setActiveEffects((prev) => {
        // Aynı ID varsa güncelle
        const existingIndex = prev.findIndex((e) => e.id === effect.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = effect;
          return updated;
        }

        // Maksimum limit kontrolü
        if (prev.length >= maxEffects) {
          console.warn(
            `[useFaceEffects] Maximum effect limit (${maxEffects}) reached`
          );
          return prev;
        }

        return [...prev, effect];
      });
    },
    [maxEffects]
  );

  /**
   * Efekt kaldır
   */
  const removeEffect = useCallback((effectId: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
  }, []);

  /**
   * Efekt güncelle
   */
  const updateEffect = useCallback(
    (effectId: string, updates: Partial<FaceEffectConfig>) => {
      setActiveEffects((prev) =>
        prev.map((e) => (e.id === effectId ? { ...e, ...updates } : e))
      );
    },
    []
  );

  /**
   * Efekt aç/kapat
   */
  const toggleEffect = useCallback((effectId: string) => {
    setActiveEffects((prev) =>
      prev.map((e) =>
        e.id === effectId ? { ...e, enabled: !e.enabled } : e
      )
    );
  }, []);

  /**
   * Efekt yoğunluğunu ayarla
   */
  const setIntensity = useCallback(
    (effectId: string, intensity: number) => {
      // 0-1 arasında clamp
      const clampedIntensity = Math.max(0, Math.min(1, intensity));
      updateEffect(effectId, { intensity: clampedIntensity });
    },
    [updateEffect]
  );

  /**
   * Efekt rengini ayarla (makyaj için)
   */
  const setColor = useCallback(
    (effectId: string, color: string) => {
      updateEffect(effectId, { color });
    },
    [updateEffect]
  );

  /**
   * Tüm efektleri temizle
   */
  const clearEffects = useCallback(() => {
    setActiveEffects([]);
  }, []);

  /**
   * Preset uygula
   * Mevcut efektleri temizler ve preset'teki efektleri ekler
   */
  const applyPreset = useCallback((preset: FaceEffectPreset) => {
    setActiveEffects(preset.effects);
  }, []);

  /**
   * Belirli kategorideki efektleri getir
   */
  const getEffectsByCategory = useCallback(
    (category: FaceEffectConfig["category"]) => {
      return activeEffects.filter((e) => e.category === category);
    },
    [activeEffects]
  );

  /**
   * Belirli türdeki efekti getir
   */
  const getEffectByType = useCallback(
    (type: FaceEffectConfig["type"]) => {
      return activeEffects.find((e) => e.type === type);
    },
    [activeEffects]
  );

  /**
   * Aktif (enabled) efektleri getir
   */
  const enabledEffects = activeEffects.filter((e) => e.enabled);

  return {
    /** Tüm aktif efektler */
    activeEffects,
    /** Sadece açık olan efektler */
    enabledEffects,
    /** Efekt sayısı */
    effectCount: activeEffects.length,
    /** Efekt var mı */
    hasEffects: activeEffects.length > 0,

    // Actions
    /** Efekt ekle */
    addEffect,
    /** Efekt kaldır */
    removeEffect,
    /** Efekt güncelle */
    updateEffect,
    /** Efekt aç/kapat */
    toggleEffect,
    /** Yoğunluk ayarla */
    setIntensity,
    /** Renk ayarla */
    setColor,
    /** Tüm efektleri temizle */
    clearEffects,
    /** Preset uygula */
    applyPreset,

    // Getters
    /** Kategoriye göre efektler */
    getEffectsByCategory,
    /** Türe göre efekt */
    getEffectByType,
  };
}

export default useFaceEffects;
