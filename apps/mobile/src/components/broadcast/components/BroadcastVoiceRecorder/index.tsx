/**
 * BroadcastVoiceRecorder
 *
 * Amaç: Yayın kanalı için ses kaydedici
 * Tarih: 2025-12-02
 *
 * Özellikler:
 * - Ses kaydı başlat/durdur
 * - Kayıt süresi gösterimi
 * - Dalga formu animasyonu
 * - Max 60 saniye kayıt
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Mic, Square, X } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

const MAX_DURATION = 60000; // 60 saniye

interface BroadcastVoiceRecorderProps {
  onRecorded: (uri: string, duration: number) => void;
  onCancel: () => void;
}

export function BroadcastVoiceRecorder({ onRecorded, onCancel }: BroadcastVoiceRecorderProps) {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animasyon
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value
  }));

  // Kayıt başlat
  const startRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // İzin kontrolü
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      // Audio mode ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      // Kayıt başlat
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      // Animasyon başlat
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 500 }), withTiming(0.3, { duration: 500 })),
        -1
      );

      // Timer başlat
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 100;
        });
      }, 100);
    } catch (error) {
      console.error("Recording error:", error);
    }
  }, []);

  // Kayıt durdur
  const stopRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 0.5;

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        setIsRecording(false);

        if (uri && duration > 500) {
          onRecorded(uri, duration);
        }
      }
    } catch (error) {
      console.error("Stop recording error:", error);
    }
  }, [duration, onRecorded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // Süre formatla
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {/* Süre */}
      <Text style={[styles.duration, { color: colors.textPrimary }]}>
        {formatDuration(duration)}
      </Text>

      {/* Dalga animasyonu */}
      <View style={styles.waveContainer}>
        {isRecording && (
          <Animated.View style={[styles.pulse, { backgroundColor: colors.accent }, pulseStyle]} />
        )}
        <View
          style={[styles.micCircle, { backgroundColor: isRecording ? "#ef4444" : colors.accent }]}
        >
          <Mic size={32} color="#fff" />
        </View>
      </View>

      {/* Butonlar */}
      <View style={styles.buttons}>
        <Pressable
          style={[styles.cancelButton, { backgroundColor: colors.backgroundRaised }]}
          onPress={onCancel}
        >
          <X size={24} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? "#ef4444" : colors.accent }
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square size={24} color="#fff" fill="#fff" />
          ) : (
            <Mic size={24} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* İpucu */}
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {isRecording ? "Durdurmak için dokun" : "Kaydetmek için dokun"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center"
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
    marginBottom: 30
  },
  waveContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30
  },
  pulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center"
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center"
  },
  hint: {
    fontSize: 14,
    marginTop: 20
  }
});

export default BroadcastVoiceRecorder;
