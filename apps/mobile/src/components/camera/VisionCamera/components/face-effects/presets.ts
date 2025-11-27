/**
 * Face Effect Presets
 *
 * Hazır efekt kombinasyonları
 * Kullanıcılar tek tıkla uygulayabilir
 *
 * @module face-effects/presets
 */

import type { FaceEffectConfig, FaceEffectPreset } from "./types";

// =============================================
// INDIVIDUAL EFFECT CONFIGS
// =============================================

/**
 * Gözlük efektleri
 */
export const GLASSES_EFFECTS: Record<string, FaceEffectConfig> = {
  aviator: {
    id: "glasses-aviator",
    type: "glasses",
    category: "accessories",
    name: "Aviator",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/glasses/aviator.svg"),
    icon: "🕶️",
  },
  round: {
    id: "glasses-round",
    type: "glasses",
    category: "accessories",
    name: "Yuvarlak",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/glasses/round.svg"),
    icon: "👓",
  },
  heart: {
    id: "glasses-heart",
    type: "glasses",
    category: "accessories",
    name: "Kalp",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/glasses/heart.svg"),
    icon: "💕",
  },
  star: {
    id: "glasses-star",
    type: "glasses",
    category: "accessories",
    name: "Yıldız",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/glasses/star.svg"),
    icon: "⭐",
  },
};

/**
 * Makyaj efektleri
 */
export const MAKEUP_EFFECTS: Record<string, FaceEffectConfig> = {
  redLips: {
    id: "lipstick-red",
    type: "lipstick",
    category: "makeup",
    name: "Kırmızı Ruj",
    enabled: true,
    intensity: 0.8,
    color: "rgba(255, 0, 80, 0.45)",
    icon: "💄",
  },
  pinkLips: {
    id: "lipstick-pink",
    type: "lipstick",
    category: "makeup",
    name: "Pembe Ruj",
    enabled: true,
    intensity: 0.8,
    color: "rgba(255, 105, 180, 0.45)",
    icon: "💋",
  },
  nudeLips: {
    id: "lipstick-nude",
    type: "lipstick",
    category: "makeup",
    name: "Nude Ruj",
    enabled: true,
    intensity: 0.7,
    color: "rgba(205, 133, 102, 0.35)",
    icon: "🤎",
  },
  berryLips: {
    id: "lipstick-berry",
    type: "lipstick",
    category: "makeup",
    name: "Berry Ruj",
    enabled: true,
    intensity: 0.8,
    color: "rgba(139, 0, 98, 0.45)",
    icon: "🍇",
  },
};

/**
 * Güzellik efektleri
 */
export const BEAUTY_EFFECTS: Record<string, FaceEffectConfig> = {
  skinSmooth: {
    id: "beauty-smooth",
    type: "skin_smooth",
    category: "beauty",
    name: "Cilt Düzeltme",
    enabled: true,
    intensity: 0.5,
    icon: "✨",
  },
  skinSmoothHigh: {
    id: "beauty-smooth-high",
    type: "skin_smooth",
    category: "beauty",
    name: "Yoğun Düzeltme",
    enabled: true,
    intensity: 0.8,
    icon: "💫",
  },
};

/**
 * Parçacık efektleri
 */
export const PARTICLE_EFFECTS: Record<string, FaceEffectConfig> = {
  sparkle: {
    id: "particle-sparkle",
    type: "sparkle",
    category: "particles",
    name: "Parıltı",
    enabled: true,
    intensity: 0.7,
    icon: "✨",
  },
  hearts: {
    id: "particle-hearts",
    type: "hearts",
    category: "particles",
    name: "Kalpler",
    enabled: true,
    intensity: 0.7,
    icon: "💕",
  },
};

/**
 * Maske efektleri
 */
export const MASK_EFFECTS: Record<string, FaceEffectConfig> = {
  catEars: {
    id: "mask-cat",
    type: "cat_face",
    category: "masks",
    name: "Kedi",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/masks/cat-ears.svg"),
    icon: "🐱",
  },
  bunnyEars: {
    id: "mask-bunny",
    type: "bunny_face",
    category: "masks",
    name: "Tavşan",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/masks/bunny-ears.svg"),
    icon: "🐰",
  },
  dogEars: {
    id: "mask-dog",
    type: "dog_face",
    category: "masks",
    name: "Köpek",
    enabled: true,
    intensity: 1,
    asset: require("../../../../../../assets/effects/masks/dog-ears.svg"),
    icon: "🐶",
  },
};

// =============================================
// PRESET COLLECTIONS
// =============================================

/**
 * Makyaj preset'leri
 */
export const MAKEUP_PRESETS: FaceEffectPreset[] = [
  {
    id: "preset-natural",
    name: "Doğal",
    thumbnail: "", // TODO: Thumbnail eklenecek
    effects: [MAKEUP_EFFECTS.nudeLips, BEAUTY_EFFECTS.skinSmooth],
  },
  {
    id: "preset-glam",
    name: "Glamour",
    thumbnail: "",
    effects: [
      MAKEUP_EFFECTS.redLips,
      BEAUTY_EFFECTS.skinSmoothHigh,
      PARTICLE_EFFECTS.sparkle,
    ],
  },
  {
    id: "preset-party",
    name: "Parti",
    thumbnail: "",
    effects: [
      MAKEUP_EFFECTS.berryLips,
      BEAUTY_EFFECTS.skinSmooth,
      PARTICLE_EFFECTS.sparkle,
    ],
  },
];

/**
 * Filtre preset'leri
 */
export const FILTER_PRESETS: FaceEffectPreset[] = [
  {
    id: "preset-beauty",
    name: "Güzellik",
    thumbnail: "",
    effects: [BEAUTY_EFFECTS.skinSmooth],
  },
  {
    id: "preset-glow",
    name: "Işıltı",
    thumbnail: "",
    effects: [BEAUTY_EFFECTS.skinSmooth, PARTICLE_EFFECTS.sparkle],
  },
];

/**
 * Tüm preset'ler
 */
export const EFFECT_PRESETS: FaceEffectPreset[] = [
  ...MAKEUP_PRESETS,
  ...FILTER_PRESETS,
];

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * ID'ye göre preset bul
 */
export function getPresetById(id: string): FaceEffectPreset | undefined {
  return EFFECT_PRESETS.find((p) => p.id === id);
}

/**
 * Kategoriye göre efektleri getir
 */
export function getEffectsByCategory(
  category: FaceEffectConfig["category"]
): FaceEffectConfig[] {
  const allEffects = [
    ...Object.values(GLASSES_EFFECTS),
    ...Object.values(MAKEUP_EFFECTS),
    ...Object.values(BEAUTY_EFFECTS),
    ...Object.values(PARTICLE_EFFECTS),
    ...Object.values(MASK_EFFECTS),
  ];

  return allEffects.filter((e) => e.category === category);
}

/**
 * Tüm efektleri getir
 */
export function getAllEffects(): FaceEffectConfig[] {
  return [
    ...Object.values(GLASSES_EFFECTS),
    ...Object.values(MAKEUP_EFFECTS),
    ...Object.values(BEAUTY_EFFECTS),
    ...Object.values(PARTICLE_EFFECTS),
    ...Object.values(MASK_EFFECTS),
  ];
}

/**
 * Carousel için efekt listesi (sıralı)
 * Instagram tarzı: sol-sağ kaydırmalı efektler
 */
export function getCarouselEffects(): FaceEffectConfig[] {
  // TEST: Sadece bir gözlük efekti - düzgün çalışınca diğerlerini ekleyeceğiz
  return [
    GLASSES_EFFECTS.aviator,
  ];
}
