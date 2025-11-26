/**
 * CaptureButton
 *
 * Fotoğraf çekme / Video kayıt butonu
 * - Fotoğraf: Beyaz daire
 * - Video: Kırmızı daire
 * - Kayıt: Kırmızı kare (durdur)
 * - Haptic feedback
 */

import { memo, useRef, useEffect } from "react";
import { Pressable, StyleSheet, Animated, View } from "react-native";
import { Circle, Square } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { CaptureButtonProps } from "../types";

function CaptureButtonComponent({ mode, isRecording, isCapturing, onPress }: CaptureButtonProps) {
  // Kayıt animasyonu - pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Kayıt sırasında pulse animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  /**
   * Basma handler
   */
  const handlePress = () => {
    if (isCapturing) return;

    // Farklı modlar için farklı haptic
    if (mode === "photo") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    onPress();
  };

  /**
   * Buton içeriğini render et
   */
  const renderContent = () => {
    if (isCapturing) {
      // Yakalama sırasında loading göster
      return (
        <View style={styles.loadingDot}>
          <Animated.View style={[styles.loadingInner, { transform: [{ scale: pulseAnim }] }]} />
        </View>
      );
    }

    if (isRecording) {
      // Kayıt sırasında kare (durdur) göster
      return <Square size={32} color="#FFF" fill="#FFF" />;
    }

    // Normal durum
    return (
      <Circle
        size={mode === "video" ? 32 : 64}
        color="#FFF"
        fill={mode === "video" ? "#FF3B30" : "#FFF"}
      />
    );
  };

  return (
    <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
      <Pressable
        style={[
          styles.button,
          mode === "video" && styles.buttonVideo,
          isRecording && styles.buttonRecording
        ]}
        onPress={handlePress}
        disabled={isCapturing}
        accessibilityLabel={
          mode === "photo" ? "Fotoğraf çek" : isRecording ? "Kaydı durdur" : "Video kaydı başlat"
        }
        accessibilityRole="button"
      >
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "transparent",
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center"
  },
  buttonVideo: {
    borderColor: "#FF3B30"
  },
  buttonRecording: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30"
  },
  loadingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF"
  }
});

export const CaptureButton = memo(CaptureButtonComponent);
