/**
 * AudioPlayer
 *
 * WhatsApp tarzı ses mesajı oynatıcı
 * - Play/Pause
 * - Progress bar
 * - Süre göstergesi
 */

import { memo, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
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
  const progressAnim = useRef(new Animated.Value(0)).current;

  // expo-audio player
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  // Derived state
  const isPlaying = status.playing;
  const isLoading = status.isBuffering || !status.isLoaded;
  const position = status.currentTime * 1000; // saniye -> milisaniye
  const duration = (status.duration || initialDuration || 0) * 1000; // saniye -> milisaniye

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

  // Reset progress when finished
  useEffect(() => {
    if (status.didJustFinish) {
      progressAnim.setValue(0);
    }
  }, [status.didJustFinish, progressAnim]);

  // Play/Pause handler
  const handlePlay = useCallback(() => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        // Eğer ses bittiyse başa sar
        if (status.didJustFinish) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (error) {
      console.error("[AudioPlayer] Error:", error);
    }
  }, [isPlaying, player, status.didJustFinish]);

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
