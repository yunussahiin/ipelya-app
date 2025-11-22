import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/theme/ThemeProvider";
import { AuthTextField } from "@/components/forms/AuthTextField";
import { useOnboardingStore, type GenderOption } from "@/store/onboarding.store";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

const schema = z.object({
  displayName: z.string().min(2, "En az 2 karakter").max(50, "En fazla 50 karakter"),
  bio: z.string().max(150, "En fazla 150 karakter"),
  gender: z.enum([
    "erkek",
    "kadın",
    "non-binary",
    "genderqueer",
    "agender",
    "belirtmek-istemiyorum"
  ] as const)
});

type FormValues = z.infer<typeof schema>;

const GENDER_OPTIONS: { label: string; value: GenderOption }[] = [
  { label: "Erkek", value: "erkek" },
  { label: "Kadın", value: "kadın" },
  { label: "Non-Binary", value: "non-binary" },
  { label: "Genderqueer", value: "genderqueer" },
  { label: "Agender", value: "agender" },
  { label: "Belirtmek İstemiyorum", value: "belirtmek-istemiyorum" }
];

interface OnboardingStep1Props {
  onNext: () => void;
}

export function OnboardingStep1({ onNext }: OnboardingStep1Props) {
  const { colors } = useTheme();
  const { step1, updateStep1 } = useOnboardingStore();
  const { syncStep } = useOnboardingSync();

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: step1.displayName,
      bio: step1.bio,
      gender: step1.gender || "belirtmek-istemiyorum"
    },
    mode: "onBlur"
  });

  const onSubmit = handleSubmit(async (data) => {
    updateStep1({
      displayName: data.displayName,
      bio: data.bio,
      gender: data.gender
    });

    // Sync to database
    try {
      await syncStep(1);
      console.log("✅ Step 1 Supabase'e kaydedildi");
    } catch (error) {
      console.error("❌ Step 1 sync hatası:", error);
    }

    onNext();
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profilini Oluştur</Text>
          <Text style={styles.subtitle}>Seni tanıyalım</Text>
        </View>

        {/* Display Name */}
        <Controller
          control={control}
          name="displayName"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <View style={styles.inputWrapper}>
              <AuthTextField
                label="Görünen Ad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Örn: Ayşe"
                icon="person-outline"
                error={fieldState.error?.message}
              />
            </View>
          )}
        />

        {/* Bio */}
        <Controller
          control={control}
          name="bio"
          render={({ field: { value, onChange, onBlur }, fieldState }) => (
            <View style={styles.inputWrapper}>
              <AuthTextField
                label="Bio"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Kendin hakkında kısa bir şeyler yaz"
                icon="document-text-outline"
                error={fieldState.error?.message}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        />

        {/* Gender Selection */}
        <View style={styles.genderSection}>
          <Text style={styles.sectionLabel}>Cinsiyet</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => onChange(option.value)}
                    style={({ pressed }) => [
                      styles.genderButton,
                      value === option.value && styles.genderButtonActive,
                      pressed && styles.genderButtonPressed
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        value === option.value && styles.genderButtonTextActive
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

      {/* Fixed Bottom Button */}
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
    inputWrapper: {
      marginBottom: 20
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500"
    },
    genderSection: {
      marginTop: 24,
      marginBottom: 32
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12
    },
    genderGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24
    },
    genderButton: {
      width: "48%",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 56
    },
    genderButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    genderButtonPressed: {
      opacity: 0.7
    },
    genderButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      textAlign: "center"
    },
    genderButtonTextActive: {
      color: colors.buttonPrimaryText,
      fontWeight: "700"
    },
    nextButton: {
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 14 : 16,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight,
      marginTop: 16,
      marginBottom: 32
    },
    nextButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 16,
      lineHeight: 24
    },
    fixedButton: {
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight,
      marginHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      marginVertical: 16,
      marginBottom: Platform.OS === "ios" ? 32 : 16
    },
    fixedButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 16,
      lineHeight: 24
    }
  });
}
