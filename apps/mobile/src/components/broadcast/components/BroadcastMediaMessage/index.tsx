/**
 * BroadcastMediaMessage
 *
 * Amaç: Yayın kanalı medya mesajı görüntüleyici
 * Tarih: 2025-12-02
 *
 * Özellikler:
 * - Resim görüntüleme (tam ekran açılabilir)
 * - Video oynatma
 * - Ses mesajı oynatma
 */

import { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { Play, Pause, X, Volume2 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BroadcastMediaMessageProps {
  type: "image" | "video" | "voice";
  uri: string;
  thumbnailUri?: string;
  duration?: number; // ms
  width?: number;
  height?: number;
}

export function BroadcastMediaMessage({
  type,
  uri,
  thumbnailUri,
  duration,
  width,
  height
}: BroadcastMediaMessageProps) {
  const { colors } = useTheme();
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const videoRef = useRef<Video>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Resim tam ekran aç
  const openFullscreen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFullscreen(true);
  }, []);

  // Video oynat/duraklat
  const toggleVideo = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Ses oynat/duraklat
  const toggleAudio = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying && soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
            } else if (status.durationMillis) {
              setPlaybackProgress(status.positionMillis / status.durationMillis);
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, [uri, isPlaying]);

  // Video status update
  const onVideoStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  }, []);

  // Süre formatla
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Resim
  if (type === "image") {
    return (
      <>
        <Pressable onPress={openFullscreen}>
          <Image source={{ uri: thumbnailUri || uri }} style={styles.image} contentFit="cover" />
        </Pressable>

        {/* Tam ekran modal */}
        <Modal
          visible={showFullscreen}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFullscreen(false)}
        >
          <View style={styles.fullscreenContainer}>
            <Pressable style={styles.closeButton} onPress={() => setShowFullscreen(false)}>
              <X size={28} color="#fff" />
            </Pressable>
            <Image source={{ uri }} style={styles.fullscreenImage} contentFit="contain" />
          </View>
        </Modal>
      </>
    );
  }

  // Video
  if (type === "video") {
    return (
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          posterSource={{ uri: thumbnailUri }}
          usePoster={!isPlaying}
          onPlaybackStatusUpdate={onVideoStatusUpdate}
        />
        <Pressable style={styles.playOverlay} onPress={toggleVideo}>
          {!isPlaying && (
            <View style={styles.playButton}>
              <Play size={32} color="#fff" fill="#fff" />
            </View>
          )}
        </Pressable>
        {duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
        )}
      </View>
    );
  }

  // Ses
  if (type === "voice") {
    return (
      <View style={[styles.voiceContainer, { backgroundColor: colors.backgroundRaised }]}>
        <Pressable
          style={[styles.voicePlayButton, { backgroundColor: colors.accent }]}
          onPress={toggleAudio}
        >
          {isPlaying ? (
            <Pause size={20} color="#fff" />
          ) : (
            <Play size={20} color="#fff" fill="#fff" />
          )}
        </Pressable>

        {/* Progress bar */}
        <View style={styles.voiceProgress}>
          <View style={[styles.voiceProgressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.voiceProgressFill,
                { backgroundColor: colors.accent, width: `${playbackProgress * 100}%` }
              ]}
            />
          </View>
          <Text style={[styles.voiceDuration, { color: colors.textMuted }]}>
            {duration ? formatDuration(duration) : "0:00"}
          </Text>
        </View>

        <Volume2 size={16} color={colors.textMuted} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Image
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 8
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },

  // Video
  videoContainer: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    position: "relative"
  },
  video: {
    width: "100%",
    height: "100%"
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center"
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500"
  },

  // Voice
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    marginTop: 8,
    gap: 12
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  voiceProgress: {
    flex: 1,
    gap: 4
  },
  voiceProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden"
  },
  voiceProgressFill: {
    height: "100%",
    borderRadius: 2
  },
  voiceDuration: {
    fontSize: 11
  }
});

export default BroadcastMediaMessage;
