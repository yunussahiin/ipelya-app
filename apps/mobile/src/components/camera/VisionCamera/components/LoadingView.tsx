/**
 * LoadingView
 *
 * Kamera yüklenirken gösterilen ekran
 * - Skeleton animasyonu (ActivityIndicator yerine)
 * - Türkçe metin
 * - Theme desteği
 */

import { memo, useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Camera as CameraIcon } from "lucide-react-native";
import { UI_TEXTS } from "../types";

interface LoadingViewProps {
  /** Theme renkleri */
  colors: {
    background: string;
    textMuted: string;
    surface: string;
  };
}

function LoadingViewComponent({ colors }: LoadingViewProps) {
  // Pulse animasyonu
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Camera Icon */}
      <Animated.View style={{ opacity: pulseAnim }}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <CameraIcon size={48} color={colors.textMuted} />
        </View>
      </Animated.View>

      {/* Loading Text */}
      <Animated.Text style={[styles.loadingText, { color: colors.textMuted, opacity: pulseAnim }]}>
        {UI_TEXTS.loading}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12
  }
});

export const LoadingView = memo(LoadingViewComponent);
