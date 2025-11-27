/**
 * PreviewControls
 *
 * Önizleme ekranı için kontrol butonları - Instagram tarzı düzen
 * - ↺ (Tekrar) → Sol üst
 * - ✓ (Gönder) → Sağ üst
 */

import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check, RotateCcw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

interface PreviewControlsProps {
  /** Onay butonuna basıldığında */
  onConfirm: () => void;
  /** Tekrar çek butonuna basıldığında */
  onRetake: () => void;
  /** Onay butonu yükleniyor mu */
  isConfirming?: boolean;
  /** Media bilgisi (boyut, süre vb.) */
  mediaInfo?: string;
}

export const PreviewControls = memo(function PreviewControls({
  onConfirm,
  onRetake,
  isConfirming = false,
  mediaInfo
}: PreviewControlsProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleConfirm = useCallback(() => {
    if (isConfirming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  }, [onConfirm, isConfirming]);

  const handleRetake = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetake();
  }, [onRetake]);

  return (
    <>
      {/* Top Bar - Retake (sol) + Info (orta) + Confirm (sağ) */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.topBar, { paddingTop: insets.top + 10 }]}
      >
        {/* Sol: Tekrar Çek */}
        <Pressable
          style={[styles.topButton, isConfirming && styles.disabled]}
          onPress={handleRetake}
          accessibilityLabel="Tekrar çek"
          disabled={isConfirming}
          hitSlop={10}
        >
          <RotateCcw size={22} color="#FFF" />
        </Pressable>

        {/* Orta: Media Info */}
        {mediaInfo && (
          <View style={styles.mediaInfoContainer}>
            <Text style={styles.mediaInfoText}>{mediaInfo}</Text>
          </View>
        )}

        {/* Sağ: Onayla */}
        <Pressable
          style={[
            styles.confirmButton,
            { backgroundColor: colors.accent },
            isConfirming && styles.confirmButtonLoading
          ]}
          onPress={handleConfirm}
          accessibilityLabel="Gönder"
          disabled={isConfirming}
          hitSlop={10}
        >
          {isConfirming ? (
            <View style={styles.loadingIndicator} />
          ) : (
            <Check size={24} color="#FFF" strokeWidth={3} />
          )}
        </Pressable>
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 20
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  topButtonPlaceholder: {
    width: 40,
    height: 40
  },
  mediaInfoContainer: {
    flex: 1,
    alignItems: "center"
  },
  mediaInfoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  confirmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  confirmButtonLoading: {
    opacity: 0.7
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFF",
    borderTopColor: "transparent"
  },
  disabled: {
    opacity: 0.5
  }
});

export default PreviewControls;
