/**
 * AudioRecorder
 *
 * WhatsApp tarzı ses kaydı component'i
 * - Kayıt başlat/durdur
 * - Önizleme + Gönder/İptal
 * - Süre göstergesi
 */

import { memo, useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import {
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ThemeColors } from "@/theme/ThemeProvider";

interface AudioRecorderProps {
  colors: ThemeColors;
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

type RecorderState = "idle" | "recording" | "preview";

function AudioRecorderComponent({ colors, onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // expo-audio recorder
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // expo-audio player for preview
  const player = useAudioPlayer(recordedUri ? { uri: recordedUri } : null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation
  useEffect(() => {
    if (state === "recording") {
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
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Check permission
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        console.log("[AudioRecorder] Permission denied");
        return;
      }

      // Configure audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true
      });

      // Start recording
      console.log("[AudioRecorder] Starting recording...");
      await recorder.prepareToRecordAsync();
      recorder.record();

      setState("recording");
      setDuration(0);
      setRecordedUri(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      console.log("[AudioRecorder] Recording started");
    } catch (error) {
      console.error("[AudioRecorder] Failed to start recording:", error);
    }
  }, [recorder]);

  // Stop recording - go to preview
  const stopRecording = useCallback(async () => {
    try {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      console.log("[AudioRecorder] Stopping recording...");

      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false
      });

      const uri = recorder.uri;

      if (!uri || duration < 1) {
        console.log("[AudioRecorder] Recording too short");
        setState("idle");
        return;
      }

      console.log("[AudioRecorder] Recording saved:", uri);
      setRecordedUri(uri);
      setState("preview");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[AudioRecorder] Failed to stop recording:", error);
      setState("idle");
    }
  }, [duration, recorder]);

  // Send recording
  const sendRecording = useCallback(async () => {
    // Stop playback if playing
    if (player) {
      player.pause();
    }

    if (recordedUri && duration > 0) {
      console.log("[AudioRecorder] Sending:", recordedUri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRecordingComplete(recordedUri, duration);
    }
  }, [recordedUri, duration, onRecordingComplete, player]);

  // Play/Pause preview
  const togglePlayback = useCallback(() => {
    if (!recordedUri || !player) return;

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("[AudioRecorder] Playback error:", error);
    }
  }, [recordedUri, isPlaying, player]);

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    // Stop playback
    if (player) {
      try {
        player.pause();
      } catch {}
    }

    // Stop if recording
    if (recorder.isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        await recorder.stop();
      } catch {}
    }

    setState("idle");
    setDuration(0);
    setRecordedUri(null);
    setIsPlaying(false);
    onCancel();
  }, [onCancel, player, recorder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recorder.isRecording) {
        recorder.stop();
      }
    };
  }, [recorder]);

  // Auto-start recording on mount
  useEffect(() => {
    startRecording();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {state === "recording" && (
        <View style={styles.recordingContainer}>
          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
            <Ionicons name="close" size={24} color="#FF3B30" />
          </TouchableOpacity>

          {/* Duration */}
          <View style={styles.durationContainer}>
            <Animated.View
              style={[
                styles.recordingDot,
                { backgroundColor: "#FF3B30", transform: [{ scale: pulseAnim }] }
              ]}
            />
            <Text style={[styles.durationText, { color: colors.textPrimary }]}>
              {formatDuration(duration)}
            </Text>
          </View>

          {/* Stop button */}
          <TouchableOpacity
            style={[styles.stopButton, { backgroundColor: "#FF3B30" }]}
            onPress={stopRecording}
          >
            <Ionicons name="stop" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {state === "preview" && (
        <View style={styles.previewContainer}>
          {/* Delete button */}
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>

          {/* Duration */}
          <View style={styles.previewInfo}>
            <Ionicons name="mic" size={20} color={colors.textSecondary} />
            <Text style={[styles.previewText, { color: colors.textPrimary }]}>
              Ses kaydı • {formatDuration(duration)}
            </Text>
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.accent }]}
            onPress={sendRecording}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {state === "idle" && (
        <View style={styles.idleContainer}>
          <Text style={[styles.hintText, { color: colors.textMuted }]}>Kayıt başlatılıyor...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  idleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  previewContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  durationText: {
    fontSize: 18,
    fontWeight: "600",
    fontVariant: ["tabular-nums"]
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  previewInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  previewText: {
    fontSize: 15,
    fontWeight: "500"
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  hintText: {
    fontSize: 14
  }
});

export const AudioRecorder = memo(AudioRecorderComponent);
