/**
 * VideoPreview
 *
 * Video önizleme component'i
 * - expo-video ile video playback
 * - Play/Pause kontrolü
 * - Video bilgisi gösterimi
 *
 * NOT: Video filtreleri şimdilik desteklenmiyor (FFmpeg gerektirir)
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated as RNAnimated,
  Platform
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEventListener } from "expo";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Play, Pause, RotateCcw } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const LOG_PREFIX = "[VideoPreview]";

export interface VideoPreviewRef {
  /** Video URI'sini döndür (video için filtre yok) */
  exportVideo: () => Promise<string | null>;
  /** Video durumunu al */
  getPlaybackStatus: () => { isPlaying: boolean; position: number; duration: number };
}

interface VideoPreviewProps {
  /** Video URI'si */
  uri: string;
  /** Video süresi (saniye) */
  duration?: number;
  /** Alt boşluk (TabBar için) */
  bottomInset?: number;
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  const animatedValue = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        RNAnimated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={styles.loadingContainer}>
      <RNAnimated.View style={[styles.loadingSkeleton, { opacity }]} />
      <Text style={styles.loadingText}>Video yükleniyor...</Text>
    </View>
  );
}

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * VideoPreview Component
 */
export const VideoPreview = forwardRef<VideoPreviewRef, VideoPreviewProps>(function VideoPreview(
  { uri, duration: initialDuration, bottomInset = 0 },
  ref
) {
  // State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [showControls, setShowControls] = useState(true);

  const normalizedUri = uri.startsWith("file://") ? uri : `file://${uri}`;

  // Video player (expo-video)
  const player = useVideoPlayer(normalizedUri, (p) => {
    p.loop = true;
    p.play();
  });

  // Status change listener
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay") {
      setIsLoading(false);
      if (player.duration > 0) {
        setDuration(player.duration);
      }
    }
  });

  // Playing change listener
  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });

  // Time update listener
  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    setPosition(currentTime);
  });

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying, player]);

  // Replay video
  const handleReplay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.replay();
  }, [player]);

  // Toggle controls visibility
  const handleToggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Export video (no filters for now)
  const exportVideo = useCallback(async (): Promise<string | null> => {
    console.log(`${LOG_PREFIX} Exporting video (no filters)`);
    // Video için filtre uygulamıyoruz, orijinal URI'yi döndür
    return uri;
  }, [uri]);

  // Get playback status
  const getPlaybackStatus = useCallback(() => {
    return { isPlaying, position, duration };
  }, [isPlaying, position, duration]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportVideo,
    getPlaybackStatus
  }));

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Pressable style={styles.videoContainer} onPress={handleToggleControls}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          surfaceType={Platform.OS === "android" ? "textureView" : undefined}
        />

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSkeleton />
          </View>
        )}

        {/* Play/Pause overlay */}
        {showControls && !isLoading && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.controlsOverlay}
          >
            <Pressable style={styles.playButton} onPress={togglePlayPause}>
              {isPlaying ? (
                <Pause size={40} color="#FFF" fill="#FFF" />
              ) : (
                <Play size={40} color="#FFF" fill="#FFF" />
              )}
            </Pressable>
          </Animated.View>
        )}
      </Pressable>

      {/* Bottom controls */}
      {showControls && !isLoading && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.bottomControls, { paddingBottom: bottomInset }]}
        >
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatDuration(position)}</Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>
          </View>

          {/* Replay button */}
          <Pressable style={styles.replayButton} onPress={handleReplay}>
            <RotateCcw size={20} color="#FFF" />
            <Text style={styles.replayText}>Başa Sar</Text>
          </Pressable>

          {/* Info text */}
          <Text style={styles.infoText}>Video filtreleri yakında eklenecek</Text>
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#FFF",
    marginTop: 12,
    fontSize: 14
  },
  loadingSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center"
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32
  },
  progressContainer: {
    marginBottom: 12
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  timeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  },
  replayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8
  },
  replayText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500"
  },
  infoText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8
  }
});

export default VideoPreview;
