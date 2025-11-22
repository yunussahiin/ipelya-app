import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

const schema = z.object({
  tosAccepted: z.boolean().refine((val) => val === true, {
    message: "Kullanım Şartlarını kabul etmelisin"
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: "Gizlilik Politikasını kabul etmelisin"
  }),
  antiScreenshotAccepted: z.boolean().refine((val) => val === true, {
    message: "Ekran Görüntüsü Korumasını kabul etmelisin"
  }),
  firewallAccepted: z.boolean().refine((val) => val === true, {
    message: "Güvenlik Duvarını kabul etmelisin"
  })
});

type FormValues = z.infer<typeof schema>;

interface OnboardingStep4Props {
  onNext: () => void;
  onPrev: () => void;
}

const POLICIES = [
  {
    key: "tosAccepted",
    title: "Kullanım Şartları",
    description: "Hizmet şartlarını ve kurallarını oku ve kabul et",
    icon: "📋"
  },
  {
    key: "privacyAccepted",
    title: "Gizlilik Politikası",
    description: "Verilerinizin nasıl kullanıldığını öğren",
    icon: "🔒"
  },
  {
    key: "antiScreenshotAccepted",
    title: "Ekran Görüntüsü Koruması",
    description: "Shadow profilin korunması için gerekli",
    icon: "📸"
  },
  {
    key: "firewallAccepted",
    title: "Güvenlik Duvarı",
    description: "Kötü amaçlı aktivitelere karşı koruma",
    icon: "🛡️"
  }
];

export function OnboardingStep4({ onNext, onPrev }: OnboardingStep4Props) {
  const { colors } = useTheme();
  const { step4, updateStep4 } = useOnboardingStore();
  const { syncStep } = useOnboardingSync();

  const { control, handleSubmit, formState, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tosAccepted: step4.tosAccepted || false,
      privacyAccepted: step4.privacyAccepted || false,
      antiScreenshotAccepted: step4.antiScreenshotAccepted || false,
      firewallAccepted: step4.firewallAccepted || false
    },
    mode: "onChange"
  });

  const handleAcceptAll = async () => {
    setValue("tosAccepted", true);
    setValue("privacyAccepted", true);
    setValue("antiScreenshotAccepted", true);
    setValue("firewallAccepted", true);
    // Trigger validation and submit
    const isValid = await trigger();
    if (isValid) {
      // Get the form data and submit
      const formData = {
        tosAccepted: true,
        privacyAccepted: true,
        antiScreenshotAccepted: true,
        firewallAccepted: true
      };
      updateStep4(formData);
      // Small delay to ensure Zustand state is updated
      await new Promise((resolve) => setTimeout(resolve, 50));
      try {
        await syncStep(4);
        console.log("✅ Step 4 Supabase'e kaydedildi");
      } catch (error) {
        console.error("❌ Step 4 sync hatası:", error);
      }
      onNext();
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    // Update Zustand store
    updateStep4({
      tosAccepted: data.tosAccepted,
      privacyAccepted: data.privacyAccepted,
      antiScreenshotAccepted: data.antiScreenshotAccepted,
      firewallAccepted: data.firewallAccepted
    });

    // Sync to database with form data directly
    try {
      // Wait a bit for Zustand to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      await syncStep(4);
      console.log("✅ Step 4 Supabase'e kaydedildi");
    } catch (error) {
      console.error("❌ Step 4 sync hatası:", error);
    }

    onNext();
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Onaylar</Text>
          <Text style={styles.subtitle}>Lütfen tüm politikaları kabul et</Text>
        </View>

        {/* Policies */}
        <View style={styles.policiesContainer}>
          {POLICIES.map((policy) => (
            <Controller
              key={policy.key}
              control={control}
              name={policy.key as keyof FormValues}
              render={({ field: { value, onChange }, fieldState }) => (
                <Pressable
                  onPress={() => onChange(!value)}
                  style={({ pressed }) => [styles.policyItem, pressed && styles.policyItemPressed]}
                >
                  <View style={styles.checkbox}>
                    {value && <View style={styles.checkboxInner} />}
                  </View>

                  <View style={styles.policyContent}>
                    <View style={styles.policyHeader}>
                      <Text style={styles.policyIcon}>{policy.icon}</Text>
                      <Text style={styles.policyTitle}>{policy.title}</Text>
                    </View>
                    <Text style={styles.policyDescription}>{policy.description}</Text>
                  </View>

                  {fieldState.error && <Text style={styles.errorText}>!</Text>}
                </Pressable>
              )}
            />
          ))}
        </View>

        {/* Accept All Button */}
        {!formState.isValid && (
          <Pressable
            onPress={handleAcceptAll}
            style={({ pressed }) => [
              styles.acceptAllButton,
              pressed && styles.acceptAllButtonPressed
            ]}
          >
            <Text style={styles.acceptAllButtonText}>✓ Tümünü Kabul Et</Text>
          </Pressable>
        )}

        {/* All Accepted Info */}
        {formState.isValid && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ Tüm onaylar kabul edildi</Text>
          </View>
        )}
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
    policiesContainer: {
      marginBottom: 24,
      gap: 12
    },
    policyItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground
    },
    policyItemPressed: {
      opacity: 0.7
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 4,
      backgroundColor: colors.accent
    },
    policyContent: {
      flex: 1
    },
    policyHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4
    },
    policyIcon: {
      fontSize: 16,
      marginRight: 8
    },
    policyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    policyDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "400",
      lineHeight: 18
    },
    errorText: {
      fontSize: 18,
      color: colors.warning,
      fontWeight: "700",
      marginLeft: 8
    },
    successBox: {
      backgroundColor: `${colors.accent}15`,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      marginBottom: 24
    },
    successText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "600"
    },
    acceptAllButton: {
      backgroundColor: `${colors.accent}20`,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent,
      marginBottom: 20
    },
    acceptAllButtonPressed: {
      opacity: 0.7
    },
    acceptAllButtonText: {
      color: colors.accent,
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 20
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
