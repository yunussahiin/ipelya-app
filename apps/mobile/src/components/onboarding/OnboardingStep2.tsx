import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/theme/ThemeProvider";
import {
  useOnboardingStore,
  type MoodOption,
  type PersonalityOption,
  type EnergyOption
} from "@/store/onboarding.store";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

const schema = z.object({
  mood: z.enum(["romantik", "macera", "eğlenceli", "sakin", "entelektüel", "tutkulu"] as const),
  personality: z.enum([
    "içe-dönük",
    "dışa-dönük",
    "dengeli",
    "yaratıcı",
    "pratik",
    "gizemli"
  ] as const),
  energy: z.enum(["düşük", "orta", "yüksek"] as const)
});

type FormValues = z.infer<typeof schema>;

const MOOD_OPTIONS: { label: string; value: MoodOption; emoji: string }[] = [
  { label: "Romantik", value: "romantik", emoji: "�" },
  { label: "Macera", value: "macera", emoji: "�️" },
  { label: "Eğlenceli", value: "eğlenceli", emoji: "🎉" },
  { label: "Sakin", value: "sakin", emoji: "🧘" },
  { label: "Entelektüel", value: "entelektüel", emoji: "�" },
  { label: "Tutkulu", value: "tutkulu", emoji: "🔥" }
];

const PERSONALITY_OPTIONS: { label: string; value: PersonalityOption; emoji: string }[] = [
  { label: "İçe-Dönük", value: "içe-dönük", emoji: "🎧" },
  { label: "Dışa-Dönük", value: "dışa-dönük", emoji: "�" },
  { label: "Dengeli", value: "dengeli", emoji: "⚖️" },
  { label: "Yaratıcı", value: "yaratıcı", emoji: "🎨" },
  { label: "Pratik", value: "pratik", emoji: "�️" },
  { label: "Gizemli", value: "gizemli", emoji: "🌙" }
];

const ENERGY_OPTIONS: { label: string; value: EnergyOption; emoji: string }[] = [
  { label: "Düşük", value: "düşük", emoji: "😴" },
  { label: "Orta", value: "orta", emoji: "😊" },
  { label: "Yüksek", value: "yüksek", emoji: "⚡" }
];

interface OnboardingStep2Props {
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStep2({ onNext, onPrev }: OnboardingStep2Props) {
  const { colors } = useTheme();
  const { step2, updateStep2 } = useOnboardingStore();
  const { syncStep } = useOnboardingSync();

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mood: step2.mood || "romantik",
      personality: step2.personality || "dengeli",
      energy: step2.energy || "orta"
    },
    mode: "onBlur"
  });

  const onSubmit = handleSubmit(async (data) => {
    updateStep2({
      mood: data.mood,
      personality: data.personality,
      energy: data.energy
    });

    // Sync to database
    try {
      await syncStep(2);
      console.log(" Step 2 Supabase'e kaydedildi");
    } catch (error) {
      console.error(" Step 2 sync hatası:", error);
    }

    onNext();
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Vibe'ını Seç</Text>
          <Text style={styles.subtitle}>Senin ruh halini tanımla</Text>
        </View>

        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ruh Hali</Text>
          <Controller
            control={control}
            name="mood"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionGrid}>
                {MOOD_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      value === option.value && styles.optionButtonActive,
                      pressed && styles.optionButtonPressed
                    ]}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.optionButtonText,
                        value === option.value && styles.optionButtonTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        {/* Personality Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kişilik</Text>
          <Controller
            control={control}
            name="personality"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionGrid}>
                {PERSONALITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      value === option.value && styles.optionButtonActive,
                      pressed && styles.optionButtonPressed
                    ]}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.optionButtonText,
                        value === option.value && styles.optionButtonTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        {/* Energy Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Enerji Seviyesi</Text>
          <Controller
            control={control}
            name="energy"
            render={({ field: { value, onChange } }) => (
              <View style={styles.intensityGrid}>
                {ENERGY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    style={({ pressed }) => [
                      styles.intensityButton,
                      value === option.value && styles.intensityButtonActive,
                      pressed && styles.intensityButtonPressed
                    ]}
                  >
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.intensityButtonText,
                        value === option.value && styles.intensityButtonTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={onPrev}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={!formState.isValid}
          style={({ pressed }) => [
            styles.fixedButton,
            {
              opacity: !formState.isValid || pressed ? 0.7 : 1
            }
          ]}
        >
          <Text style={styles.fixedButtonText}>Devam Et</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background
    },
    container: {
      flex: 1,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 24
    },
    header: {
      marginBottom: 32
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500"
    },
    section: {
      marginBottom: 32
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12
    },
    optionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12
    },
    optionButton: {
      width: "31%",
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 100
    },
    optionButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    optionButtonPressed: {
      opacity: 0.7
    },
    optionEmoji: {
      fontSize: 32,
      marginBottom: 8
    },
    optionButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center"
    },
    optionButtonTextActive: {
      color: colors.buttonPrimaryText,
      fontWeight: "700"
    },
    intensityGrid: {
      flexDirection: "row",
      gap: 12
    },
    intensityButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 80
    },
    intensityButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    intensityButtonPressed: {
      opacity: 0.7
    },
    intensityButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: 8
    },
    intensityButtonTextActive: {
      color: colors.buttonPrimaryText,
      fontWeight: "700"
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      marginBottom: 32
    },
    backButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backButtonPressed: {
      opacity: 0.7
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accentSoft
    },
    nextButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight
    },
    nextButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 20
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 16,
      paddingBottom: Platform.OS === "ios" ? 32 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    backButton: {
      flex: 0.3,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backButtonPressed: {
      opacity: 0.7
    },
    backButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.accentSoft
    },
    fixedButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight
    },
    fixedButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 20
    }
  });
}
