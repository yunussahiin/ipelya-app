/**
 * FlipCameraButton
 *
 * Ön/arka kamera geçiş butonu
 * - Döndürme animasyonu
 * - Haptic feedback
 */

import { memo, useRef } from "react";
import { Pressable, StyleSheet, Animated } from "react-native";
import { RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface FlipCameraButtonProps {
  /** Kamera çevirme fonksiyonu */
  onFlip: () => void;
  /** Kayıt sırasında devre dışı */
  disabled?: boolean;
}

function FlipCameraButtonComponent({ onFlip, disabled = false }: FlipCameraButtonProps) {
  // Döndürme animasyonu
  const rotateAnim = useRef(new Animated.Value(0)).current;

  /**
   * Çevirme handler
   */
  const handleFlip = () => {
    if (disabled) return;

    Haptics.selectionAsync();

    // Döndürme animasyonu
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      rotateAnim.setValue(0);
    });

    onFlip();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"]
  });

  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handleFlip}
      disabled={disabled}
      accessibilityLabel="Kamerayı çevir"
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <RotateCcw size={28} color={disabled ? "rgba(255,255,255,0.5)" : "#FFF"} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },
  buttonDisabled: {
    opacity: 0.5
  }
});

export const FlipCameraButton = memo(FlipCameraButtonComponent);
