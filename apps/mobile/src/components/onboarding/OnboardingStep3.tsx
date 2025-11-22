import { View, Text, StyleSheet, ScrollView, Pressable, Platform, TextInput } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import * as LocalAuthentication from "expo-local-authentication";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useOnboardingSync } from "@/hooks/useOnboardingSync";
import { useOnboardingService } from "@/hooks/useOnboardingService";
import { LAYOUT_CONSTANTS } from "@/theme/layout";
import { Ionicons } from "@expo/vector-icons";
import { hashPin } from "@/utils/crypto";

const schema = z
  .object({
    shadowPin: z.string().regex(/^\d{4,6}$/, "4-6 rakam gir"),
    shadowPinConfirm: z.string()
  })
  .refine((data) => data.shadowPin === data.shadowPinConfirm, {
    message: "PIN'ler eşleşmiyor",
    path: ["shadowPinConfirm"]
  });

type FormValues = z.infer<typeof schema>;

interface OnboardingStep3Props {
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingStep3({ onNext, onPrev }: OnboardingStep3Props) {
  const { colors } = useTheme();
  const { step3, updateStep3 } = useOnboardingStore();
  const { syncStep, userId } = useOnboardingSync();
  const { saveShadowPin } = useOnboardingService();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled) {
        setBiometricAvailable(true);
        // Detect biometric type
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("face_id");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("fingerprint");
        }
      }
    } catch (error) {
      console.error("Biometric check error:", error);
    }
  };

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      shadowPin: step3.shadowPin,
      shadowPinConfirm: step3.shadowPinConfirm
    },
    mode: "onBlur"
  });

  const onSubmit = handleSubmit(async (data) => {
    updateStep3({
      shadowPin: data.shadowPin,
      shadowPinConfirm: data.shadowPinConfirm,
      biometricEnabled: step3.biometricEnabled,
      biometricType: step3.biometricType
    });

    // Sync to database
    try {
      await syncStep(3);
      console.log("✅ Step 3 Supabase'e kaydedildi");

      // PIN'i hash'le ve kaydet
      if (userId) {
        try {
          const hashedPin = await hashPin(data.shadowPin);
          await saveShadowPin(userId, hashedPin);
          console.log("✅ Shadow PIN hash'lendi ve kaydedildi");
        } catch (pinError) {
          console.error("❌ PIN hash'leme hatası:", pinError);
        }
      }
    } catch (error) {
      console.error("❌ Step 3 sync hatası:", error);
    }

    onNext();
  });

  const toggleBiometric = async () => {
    // Eğer biometric'i etkinleştiriyorsak, önce test et
    if (!step3.biometricEnabled && biometricAvailable) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Biometric doğrulamasını test et",
          fallbackLabel: "PIN kullan",
          disableDeviceFallback: false // Expo Go'da Face ID yok, PIN'e fallback et
        });

        if (result.success) {
          console.log("✅ Biometric doğrulama başarılı");
          updateStep3({
            shadowPin: step3.shadowPin,
            shadowPinConfirm: step3.shadowPinConfirm,
            biometricEnabled: true,
            biometricType: biometricType as any
          });
        } else {
          console.log("❌ Biometric doğrulama başarısız");
        }
      } catch (error) {
        console.error("❌ Biometric doğrulama hatası:", error);
      }
    } else {
      // Biometric'i devre dışı bırak
      updateStep3({
        shadowPin: step3.shadowPin,
        shadowPinConfirm: step3.shadowPinConfirm,
        biometricEnabled: false,
        biometricType: null
      });
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Shadow PIN Oluştur</Text>
          <Text style={styles.subtitle}>Gizli kimliğine erişim kontrolü</Text>
        </View>

        {/* PIN Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PIN (4-6 rakam)</Text>
          <Controller
            control={control}
            name="shadowPin"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View>
                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={[styles.pinInput, fieldState.error && styles.pinInputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="••••"
                    secureTextEntry={!showPin}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable onPress={() => setShowPin(!showPin)} style={styles.visibilityButton}>
                    <Ionicons
                      name={showPin ? "eye" : "eye-off"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
                {fieldState.error && (
                  <Text style={styles.errorText}>{fieldState.error.message}</Text>
                )}
              </View>
            )}
          />
        </View>

        {/* PIN Confirm */}
        <View style={styles.section}>
          <View style={styles.confirmHeader}>
            <Text style={styles.sectionLabel}>PIN Doğrulama</Text>
            {control._formValues.shadowPin && control._formValues.shadowPinConfirm && (
              <View style={styles.matchIndicator}>
                {control._formValues.shadowPin === control._formValues.shadowPinConfirm ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                    <Text style={[styles.matchText, { color: colors.accent }]}>Eşleşti</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color={colors.warning} />
                    <Text style={[styles.matchText, { color: colors.warning }]}>Eşleşmiyor</Text>
                  </>
                )}
              </View>
            )}
          </View>
          <Controller
            control={control}
            name="shadowPinConfirm"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <View>
                <View style={styles.pinInputContainer}>
                  <TextInput
                    style={[styles.pinInput, fieldState.error && styles.pinInputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="••••"
                    secureTextEntry={!showPinConfirm}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Pressable
                    onPress={() => setShowPinConfirm(!showPinConfirm)}
                    style={styles.visibilityButton}
                  >
                    <Ionicons
                      name={showPinConfirm ? "eye" : "eye-off"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
                {fieldState.error && (
                  <Text style={styles.errorText}>{fieldState.error.message}</Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Biometric Option */}
        {biometricAvailable && (
          <View style={styles.biometricSection}>
            <View style={styles.biometricHeader}>
              <Text style={styles.sectionLabel}>
                {biometricType === "face_id" ? "🔐 Face ID" : "🔐 Parmak İzi"}
              </Text>
              <Text style={styles.biometricSubtitle}>PIN'e ek olarak kullan</Text>
            </View>

            <Pressable
              onPress={toggleBiometric}
              style={({ pressed }) => [
                styles.biometricToggle,
                step3.biometricEnabled && styles.biometricToggleActive,
                pressed && styles.biometricTogglePressed
              ]}
            >
              <View style={styles.toggleCircle}>
                {step3.biometricEnabled && <View style={styles.toggleCircleInner} />}
              </View>
              <Text style={styles.biometricToggleText}>
                {step3.biometricEnabled ? "Etkinleştirildi" : "Etkinleştir"}
              </Text>
            </Pressable>

            <Text style={styles.biometricInfo}>
              {biometricType === "face_id"
                ? "Face ID ile daha hızlı giriş yap"
                : "Parmak izi ile daha hızlı giriş yap"}
            </Text>
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
        marginBottom: 24
      },
      sectionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12
      },
      pinInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: LAYOUT_CONSTANTS.radiusMedium,
        backgroundColor: colors.cardBackground,
        paddingHorizontal: 12
      },
      pinInput: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 4,
        fontSize: 24,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
        letterSpacing: 8
      },
      pinInputError: {
        borderColor: colors.warning,
        backgroundColor: `${colors.warning}15`
      },
      visibilityButton: {
        padding: 8,
        marginLeft: 8
      },
      confirmHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
      },
      matchIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
      },
      matchText: {
        fontSize: 12,
        fontWeight: "600"
      },
      errorText: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: "500"
      },
      biometricSection: {
        backgroundColor: `${colors.accent}10`,
        borderRadius: LAYOUT_CONSTANTS.radiusMedium,
        padding: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: `${colors.accent}30`
      },
      biometricHeader: {
        marginBottom: 16
      },
      biometricSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: "500",
        marginTop: 4
      },
      biometricToggle: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: LAYOUT_CONSTANTS.radiusMedium,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.cardBackground,
        marginBottom: 12
      },
      biometricToggleActive: {
        backgroundColor: `${colors.accent}20`,
        borderColor: colors.accent
      },
      biometricTogglePressed: {
        opacity: 0.7
      },
      toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.accent,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center"
      },
      toggleCircleInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accent
      },
      biometricToggleText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textPrimary
      },
      biometricInfo: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: "500",
        lineHeight: 18
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
}
