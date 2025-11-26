/**
 * RecordingIndicator
 *
 * Video kayıt göstergesi
 * - Kırmızı nokta (pulse animasyonu)
 * - Süre göstergesi (00:00 formatı)
 * - Duraklatma durumu
 */

import { memo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Pause } from "lucide-react-native";
import type { RecordingIndicatorProps } from "../types";

function RecordingIndicatorComponent({ duration, isPaused = false }: RecordingIndicatorProps) {
  // Pulse animasyonu
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPaused) {
      // Kayıt sırasında pulse animasyonu
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
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
      // Duraklatıldığında animasyonu durdur
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isPaused, pulseAnim]);

  /**
   * Süreyi formatla (00:00)
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Kırmızı nokta veya pause ikonu */}
      {isPaused ? (
        <Pause size={14} color="#FF3B30" fill="#FF3B30" />
      ) : (
        <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
      )}

      {/* Süre */}
      <Text style={styles.durationText}>{formatDuration(duration)}</Text>

      {/* Duraklatma etiketi */}
      {isPaused && <Text style={styles.pausedText}>Duraklatıldı</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF3B30"
  },
  durationText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  },
  pausedText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500"
  }
});

export const RecordingIndicator = memo(RecordingIndicatorComponent);
