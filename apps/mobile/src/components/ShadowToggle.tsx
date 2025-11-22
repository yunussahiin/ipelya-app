/**
 * ShadowToggle Component
 *
 * Shadow mode'u aç/kapat için toggle butonu. PIN veya biometric ile doğrulama yapılır.
 * İpelya design system'e uygun olarak tasarlandı.
 *
 * Özellikler:
 * - Biometric desteği (Face ID, Touch ID, Fingerprint)
 * - PIN fallback
 * - Loading state
 * - Error handling
 * - Mode göstergesi
 *
 * Kullanım:
 * ```tsx
 * <ShadowToggle onToggleComplete={() => console.log('Mode changed')} />
 * ```
 */

import React, { useState } from "react";
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useShadowMode } from "@/hooks/useShadowMode";
import { ShadowPinModal } from "./ShadowPinModal";
import { useTheme } from "@/theme/ThemeProvider";

interface ShadowToggleProps {
  onToggleComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * ShadowToggle Component
 *
 * Shadow mode geçişini yönetir. Biometric ve PIN doğrulaması yapılır.
 * İpelya standartlarına uygun UI/UX ile tasarlandı.
 */
export function ShadowToggle({ onToggleComplete, onError }: ShadowToggleProps) {
  const { colors } = useTheme();
  const { enabled, loading, error, toggleShadowMode, verifyBiometric } = useShadowMode();
  const [showPinModal, setShowPinModal] = useState(false);

  /**
   * Mode geçişini başlat
   * 1. Biometric dene
   * 2. Başarılı ise direkt mode geçişi yap
   * 3. Başarısız ise PIN modal göster
   */
  const handleToggle = async () => {
    try {
      console.log("🎭 Shadow mode geçişi başlatılıyor...");
      console.log(`📊 Mevcut mode: ${enabled ? "Shadow" : "Normal"}`);

      // Try biometric first
      try {
        console.log("1️⃣ Biometric doğrulama deneniyor...");
        const biometricSuccess = await verifyBiometric();

        if (biometricSuccess) {
          console.log("✅ Biometric başarılı → Direkt mode geçişi yapılıyor");
          // Biometric başarılı, direkt mode geçişi yap (PIN gerekmez)
          const toggleSuccess = await toggleShadowMode("", true);
          if (toggleSuccess) {
            console.log(`🎭 Mode geçişi tamamlandı: ${enabled ? "Normal" : "Shadow"}`);
            onToggleComplete?.();
          } else {
            console.error("❌ Mode geçişi başarısız");
            onError?.(error || "Mode geçişi başarısız");
          }
          return;
        }
      } catch (bioErr) {
        console.log("⚠️ Biometric hatası:", bioErr);
      }

      console.log("2️⃣ Biometric başarısız → PIN modal gösteriliyor...");
      setShowPinModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Toggle failed";
      console.error("❌ Shadow mode geçişi hatası:", message);
      onError?.(message);
    }
  };

  /**
   * PIN modal'dan PIN geldikten sonra mode geçişi yap
   */
  const handlePinSubmit = async (pin: string) => {
    try {
      console.log("🔑 PIN doğrulanıyor...");
      console.log(`📝 PIN uzunluğu: ${pin.length} hane`);

      const success = await toggleShadowMode(pin);

      if (success) {
        console.log("✅ Shadow mode geçişi başarılı!");
        console.log(`🎭 Yeni mode: ${!enabled ? "Shadow" : "Normal"}`);
        setShowPinModal(false);
        onToggleComplete?.();
      } else {
        console.error("❌ PIN doğrulama başarısız");
        onError?.(error || "PIN doğrulama başarısız");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Toggle failed";
      console.error("❌ PIN submit hatası:", message);
      onError?.(message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 12
    },
    toggle: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    toggleActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    togglePressed: {
      opacity: 0.8
    },
    toggleDisabled: {
      opacity: 0.5
    },
    icon: {
      fontSize: 24,
      width: 40,
      height: 40,
      textAlign: "center",
      textAlignVertical: "center"
    },
    content: {
      flex: 1
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: enabled ? colors.backgroundRaised : colors.textPrimary,
      marginBottom: 2
    },
    subtitle: {
      fontSize: 12,
      color: enabled ? "rgba(255, 255, 255, 0.7)" : colors.textMuted
    },
    loader: {
      width: 20,
      height: 20
    }
  });

  return (
    <>
      <View style={styles.container}>
        <Pressable
          onPress={handleToggle}
          disabled={loading}
          style={({ pressed }) => [
            styles.toggle,
            enabled && styles.toggleActive,
            pressed && styles.togglePressed,
            loading && styles.toggleDisabled
          ]}
        >
          <Text style={styles.icon}>{enabled ? "🎭" : "👤"}</Text>
          <View style={styles.content}>
            <Text style={styles.title}>{enabled ? "Shadow Mode" : "Normal Mode"}</Text>
            <Text style={styles.subtitle}>{enabled ? "Tap to exit" : "Tap to enter"}</Text>
          </View>
          {loading && (
            <ActivityIndicator
              size="small"
              color={enabled ? colors.backgroundRaised : colors.accent}
              style={styles.loader}
            />
          )}
        </Pressable>
      </View>

      <ShadowPinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        loading={loading}
      />
    </>
  );
}
