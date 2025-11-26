/**
 * AudioPlayer
 *
 * WhatsApp tarzı ses mesajı oynatıcı
 * - Play/Pause
 * - Progress bar
 * - Süre göstergesi
 */

import { memo, useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from "@/theme/ThemeProvider";

interface AudioPlayerProps {
  uri: string;
  duration?: number;
  colors: ThemeColors;
  isOwnMessage?: boolean;
}

function AudioPlayerComponent({
  uri,
  duration: initialDuration,
  colors,
  isOwnMessage = false
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  // initialDuration saniye cinsinden geliyor, milisaniyeye çevir
  const [duration, setDuration] = useState((initialDuration || 0) * 1000);

  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Format time
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Update progress bar
  useEffect(() => {
    if (duration > 0) {
      Animated.timing(progressAnim, {
        toValue: position / duration,
        duration: 100,
        useNativeDriver: false
      }).start();
    }
  }, [position, duration, progressAnim]);

  // Playback status update
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        progressAnim.setValue(0);
      }
    },
    [progressAnim]
  );

  // Load and play
  const handlePlay = useCallback(async () => {
    try {
      if (soundRef.current) {
        // Already loaded, toggle play/pause
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
          } else {
            // Eğer ses bittiyse başa sar
            if (status.didJustFinish || status.positionMillis >= (status.durationMillis || 0)) {
              await soundRef.current.setPositionAsync(0);
            }
            await soundRef.current.playAsync();
          }
        }
        return;
      }

      // Load sound
      setIsLoading(true);
      console.log("[AudioPlayer] Loading:", uri);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoading(false);
      console.log("[AudioPlayer] Playing");
    } catch (error) {
      console.error("[AudioPlayer] Error:", error);
      setIsLoading(false);
    }
  }, [uri, onPlaybackStatusUpdate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const textColor = isOwnMessage ? "#fff" : colors.textPrimary;
  const secondaryColor = isOwnMessage ? "rgba(255,255,255,0.7)" : colors.textMuted;
  const progressBg = isOwnMessage ? "rgba(255,255,255,0.3)" : colors.border;
  const progressFill = isOwnMessage ? "#fff" : colors.accent;

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: progressFill }]}
        onPress={handlePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass" size={20} color={isOwnMessage ? colors.accent : "#fff"} />
        ) : (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color={isOwnMessage ? colors.accent : "#fff"}
          />
        )}
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: progressFill,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"]
                })
              }
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: secondaryColor }]}>
            {formatTime(isPlaying ? position : 0)}
          </Text>
          <Text style={[styles.timeText, { color: secondaryColor }]}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 200
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8
  },
  progressContainer: {
    flex: 1
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 2
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },
  timeText: {
    fontSize: 11
  }
});

export const AudioPlayer = memo(AudioPlayerComponent);
