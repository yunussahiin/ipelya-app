/**
 * Onboarding Step 2 - Vibe Selection Options
 */

export const MOOD_OPTIONS = {
  romantic: { label: "Romantik", emoji: "💕" },
  adventure: { label: "Macera", emoji: "🏔️" },
  fun: { label: "Eğlenceli", emoji: "🎉" },
  calm: { label: "Sakin", emoji: "🧘" },
  intellectual: { label: "Entelektüel", emoji: "🧠" },
  passionate: { label: "Tutkulu", emoji: "🔥" }
} as const;

export const PERSONALITY_OPTIONS = {
  introvert: { label: "İçe-Dönük", emoji: "🎧" },
  extrovert: { label: "Dışa-Dönük", emoji: "👥" },
  balanced: { label: "Dengeli", emoji: "⚖️" },
  creative: { label: "Yaratıcı", emoji: "🎨" },
  practical: { label: "Pratik", emoji: "🛠️" },
  mysterious: { label: "Gizemli", emoji: "🌙" }
} as const;

export const ENERGY_OPTIONS = {
  low: { label: "Düşük", emoji: "😴" },
  medium: { label: "Orta", emoji: "😊" },
  high: { label: "Yüksek", emoji: "⚡" }
} as const;

export type MoodOption = keyof typeof MOOD_OPTIONS;
export type PersonalityOption = keyof typeof PERSONALITY_OPTIONS;
export type EnergyOption = keyof typeof ENERGY_OPTIONS;

/**
 * Get display label for a mood option
 */
export function getMoodLabel(mood: MoodOption): string {
  return MOOD_OPTIONS[mood]?.label || mood;
}

/**
 * Get display label for a personality option
 */
export function getPersonalityLabel(personality: PersonalityOption): string {
  return PERSONALITY_OPTIONS[personality]?.label || personality;
}

/**
 * Get display label for an energy option
 */
export function getEnergyLabel(energy: EnergyOption): string {
  return ENERGY_OPTIONS[energy]?.label || energy;
}

/**
 * Get emoji for a mood option
 */
export function getMoodEmoji(mood: MoodOption): string {
  return MOOD_OPTIONS[mood]?.emoji || "";
}

/**
 * Get emoji for a personality option
 */
export function getPersonalityEmoji(personality: PersonalityOption): string {
  return PERSONALITY_OPTIONS[personality]?.emoji || "";
}

/**
 * Get emoji for an energy option
 */
export function getEnergyEmoji(energy: EnergyOption): string {
  return ENERGY_OPTIONS[energy]?.emoji || "";
}
