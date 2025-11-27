/**
 * RecordingIndicator
 *
 * Video kayıt göstergesi
 * - Kırmızı nokta (pulse animasyonu)
 * - Süre göstergesi (00:00 formatı)
 * - Duraklatma/Devam/İptal butonları
 */

import { memo, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { Pause, Play, X, Camera } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RecordingIndicatorProps } from "../types";

const LOG_PREFIX = "[RecordingIndicator]";

function RecordingIndicatorComponent({
  duration,
  isPaused = false,
  onPause,
  onResume,
  onCancel,
  onSnapshot
}: RecordingIndicatorProps) {
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

  /**
   * Pause/Resume handler
   */
  const handlePauseResume = () => {
    console.log(`${LOG_PREFIX} Pause/Resume pressed, isPaused:`, isPaused);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  };

  /**
   * Cancel handler
   */
  const handleCancel = () => {
    console.log(`${LOG_PREFIX} Cancel pressed`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCancel?.();
  };

  /**
   * Snapshot handler
   */
  const handleSnapshot = () => {
    console.log(`${LOG_PREFIX} Snapshot pressed`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSnapshot?.();
  };

  return (
    <View style={styles.container}>
      {/* İptal butonu */}
      {onCancel && (
        <Pressable style={styles.actionButton} onPress={handleCancel}>
          <X size={16} color="#FF3B30" />
        </Pressable>
      )}

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

      {/* Pause/Resume butonu */}
      {(onPause || onResume) && (
        <Pressable style={styles.actionButton} onPress={handlePauseResume}>
          {isPaused ? (
            <Play size={16} color="#FFF" fill="#FFF" />
          ) : (
            <Pause size={16} color="#FFF" fill="#FFF" />
          )}
        </Pressable>
      )}

      {/* Snapshot butonu */}
      {onSnapshot && (
        <Pressable style={styles.snapshotButton} onPress={handleSnapshot}>
          <Camera size={18} color="#FFF" />
        </Pressable>
      )}
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
    paddingHorizontal: 12,
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
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  snapshotButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF"
  }
});

export const RecordingIndicator = memo(RecordingIndicatorComponent);
