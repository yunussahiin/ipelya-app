/**
 * ShadowPinModal Component
 *
 * Shadow mode geçişi için PIN girişi modal'ı. Numeric keypad ile PIN giriş yapılır.
 *
 * Özellikler:
 * - Numeric keypad (0-9, backspace)
 * - PIN maskeleme (dots gösterilir)
 * - Loading state
 * - Error messages
 * - Accessibility support
 *
 * Kullanım:
 * ```tsx
 * <ShadowPinModal
 *   visible={true}
 *   onClose={() => setVisible(false)}
 *   onSubmit={(pin) => handlePinSubmit(pin)}
 * />
 * ```
 */

import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ShadowPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  minLength?: number; // Minimum PIN length (default: 4)
  maxLength?: number; // Maximum PIN length (default: 6)
}

/**
 * ShadowPinModal Component
 *
 * PIN giriş modal'ı. Numeric keypad ile 4-6 digit PIN giriş yapılır.
 * İpelya design system'e uygun olarak tasarlandı.
 */
export function ShadowPinModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
  error,
  minLength = 4,
  maxLength = 6
}: ShadowPinModalProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const MIN_PIN_LENGTH = minLength;
  const MAX_PIN_LENGTH = maxLength;

  /**
   * PIN'e rakam ekle
   */
  const handleDigitPress = (digit: string) => {
    if (pin.length < MAX_PIN_LENGTH) {
      setPin(pin + digit);
      setLocalError(null);
    }
  };

  /**
   * Son rakamı sil
   */
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  /**
   * PIN'i gönder
   */
  const handleSubmit = async () => {
    if (pin.length < MIN_PIN_LENGTH) {
      setLocalError(`PIN en az ${MIN_PIN_LENGTH} haneli olmalı`);
      return;
    }

    try {
      await onSubmit(pin);
      setPin("");
      setLocalError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid PIN";
      setLocalError(message);
    }
  };

  /**
   * Modal'ı kapat
   */
  const handleClose = () => {
    setPin("");
    setLocalError(null);
    onClose();
  };

  const displayPin = "●".repeat(pin.length);
  const emptyDots = "○".repeat(Math.max(0, MIN_PIN_LENGTH - pin.length));

  // Responsive PIN text size
  const pinTextSize = pin.length >= 6 ? 24 : 32;
  const pinLetterSpacing = pin.length >= 6 ? 6 : 12;

  const styles = createStyles(colors, pinTextSize, pinLetterSpacing);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <Text style={styles.title}>Gölge Profil PIN'i</Text>
          <Text style={styles.subtitle}>Gölge profiline erişimi güvenli hale getir</Text>

          {/* PIN Display with Progress */}
          <View style={styles.pinDisplay}>
            <Text style={styles.pinText}>
              {displayPin}
              {emptyDots}
            </Text>
            {pin.length < MIN_PIN_LENGTH && (
              <Text style={styles.pinProgress}>
                {pin.length}/{MIN_PIN_LENGTH} hane
              </Text>
            )}
            {pin.length >= MIN_PIN_LENGTH && pin.length < MAX_PIN_LENGTH && (
              <Text style={styles.pinProgressExtra}>
                +{MAX_PIN_LENGTH - MIN_PIN_LENGTH} hane ekleyebilirsin
              </Text>
            )}
          </View>

          {/* Error Message */}
          {(localError || error) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{localError || error}</Text>
            </View>
          )}

          {/* Numeric Keypad */}
          <View style={styles.keypad}>
            {/* Row 1: 1-3 */}
            <View style={styles.keypadRow}>
              {[1, 2, 3].map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handleDigitPress(digit.toString())}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && styles.keypadButtonPressed,
                    loading && styles.keypadButtonDisabled
                  ]}
                >
                  <Text style={styles.keypadButtonText}>{digit}</Text>
                </Pressable>
              ))}
            </View>

            {/* Row 2: 4-6 */}
            <View style={styles.keypadRow}>
              {[4, 5, 6].map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handleDigitPress(digit.toString())}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && styles.keypadButtonPressed,
                    loading && styles.keypadButtonDisabled
                  ]}
                >
                  <Text style={styles.keypadButtonText}>{digit}</Text>
                </Pressable>
              ))}
            </View>

            {/* Row 3: 7-9 */}
            <View style={styles.keypadRow}>
              {[7, 8, 9].map((digit) => (
                <Pressable
                  key={digit}
                  onPress={() => handleDigitPress(digit.toString())}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.keypadButton,
                    pressed && styles.keypadButtonPressed,
                    loading && styles.keypadButtonDisabled
                  ]}
                >
                  <Text style={styles.keypadButtonText}>{digit}</Text>
                </Pressable>
              ))}
            </View>

            {/* Row 4: 0, Backspace */}
            <View style={styles.keypadRow}>
              <Pressable
                onPress={() => handleDigitPress("0")}
                disabled={loading}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                  loading && styles.keypadButtonDisabled
                ]}
              >
                <Text style={styles.keypadButtonText}>0</Text>
              </Pressable>
              <Pressable
                onPress={handleBackspace}
                disabled={loading || pin.length === 0}
                style={({ pressed }) => [
                  styles.keypadButton,
                  pressed && styles.keypadButtonPressed,
                  (loading || pin.length === 0) && styles.keypadButtonDisabled
                ]}
              >
                <Text style={styles.keypadButtonText}>⌫</Text>
              </Pressable>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <Pressable
              onPress={handleClose}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
            >
              <Text style={styles.buttonSecondaryText}>İptal</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={loading || pin.length < MIN_PIN_LENGTH}
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                pressed && styles.buttonPressed,
                (loading || pin.length < MIN_PIN_LENGTH) && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.backgroundRaised} />
              ) : (
                <Text style={styles.buttonPrimaryText}>Doğrula</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Styles for ShadowPinModal component
 * İpelya design system standartlarına uygun
 */
const createStyles = (colors: any, pinTextSize: number = 32, pinLetterSpacing: number = 12) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center"
    },
    modal: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      padding: 24,
      width: "85%",
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.borderMuted
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: "center"
    },
    subtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 24,
      textAlign: "center"
    },
    pinDisplay: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderMuted
    },
    pinText: {
      fontSize: pinTextSize,
      fontWeight: "600",
      color: colors.textPrimary,
      letterSpacing: pinLetterSpacing,
      marginBottom: 8
    },
    pinProgress: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500"
    },
    pinProgressExtra: {
      fontSize: 12,
      color: colors.accentSoft,
      fontWeight: "500"
    },
    errorContainer: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#ef4444"
    },
    errorText: {
      fontSize: 12,
      color: "#dc2626",
      fontWeight: "500"
    },
    keypad: {
      marginBottom: 24,
      gap: 8
    },
    keypadRow: {
      flexDirection: "row",
      gap: 8
    },
    keypadButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      justifyContent: "center",
      alignItems: "center"
    },
    keypadButtonPressed: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    keypadButtonDisabled: {
      opacity: 0.5
    },
    keypadButtonText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary
    },
    buttons: {
      flexDirection: "row",
      gap: 12
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center"
    },
    buttonSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderMuted
    },
    buttonPrimary: {
      backgroundColor: colors.accent
    },
    buttonPressed: {
      opacity: 0.8
    },
    buttonDisabled: {
      opacity: 0.5
    },
    buttonSecondaryText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    buttonPrimaryText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.backgroundRaised
    }
  });
