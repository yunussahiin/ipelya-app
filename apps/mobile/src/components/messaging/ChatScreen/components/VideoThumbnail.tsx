/**
 * VideoThumbnail
 *
 * expo-video'nun generateThumbnailsAsync ile video thumbnail oluşturur
 */

import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoThumbnail as VideoThumbnailType } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

interface VideoThumbnailProps {
  uri: string;
  width?: number;
  height?: number;
  duration?: number;
  onPress?: () => void;
  /** Compact mode - küçük thumbnail'lar için (play button ve label gizlenir) */
  compact?: boolean;
}

function VideoThumbnailComponent({
  uri,
  width = 200,
  height = 150,
  duration,
  onPress,
  compact = false
}: VideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<VideoThumbnailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Player oluştur (sadece thumbnail için)
  const player = useVideoPlayer(uri);

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      try {
        // Video yüklenene kadar bekle
        if (player.status !== "readyToPlay") {
          return;
        }

        const thumbnails = await player.generateThumbnailsAsync([0], {
          maxWidth: width,
          maxHeight: height
        });

        if (isMounted && thumbnails.length > 0) {
          setThumbnail(thumbnails[0]);
          setIsLoading(false);
          console.log("[VideoThumbnail] Generated thumbnail:", {
            uri,
            width: thumbnails[0].width,
            height: thumbnails[0].height
          });
        }
      } catch (err) {
        console.error("[VideoThumbnail] Error generating thumbnail:", err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    // Status değiştiğinde thumbnail oluştur
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        generateThumbnail();
      } else if (status === "error") {
        setError(true);
        setIsLoading(false);
      }
    });

    // İlk kontrol
    if (player.status === "readyToPlay") {
      generateThumbnail();
    }

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [player, uri, width, height]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.8 } : {};

  return (
    <Container style={[styles.container, { width, height }]} {...containerProps}>
      {/* Thumbnail veya Placeholder */}
      {thumbnail && !error ? (
        <Image
          source={thumbnail}
          style={styles.thumbnail}
          contentFit="cover"
          // Prevent flash on re-render
          cachePolicy="memory-disk"
          recyclingKey={uri}
          transition={0}
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: isLoading ? "#2a2a2a" : "#1a1a1a" }]}>
          {isLoading ? (
            <View style={styles.loadingIndicator} />
          ) : (
            <Ionicons name="videocam" size={32} color="rgba(255,255,255,0.5)" />
          )}
        </View>
      )}

      {/* Play Button Overlay - compact modda küçük, normal modda büyük */}
      <View style={styles.playOverlay} pointerEvents="none">
        <View style={compact ? styles.playButtonCompact : styles.playButton}>
          <Ionicons name="play" size={compact ? 16 : 28} color="#FFF" />
        </View>
      </View>

      {/* Duration Badge - sadece normal modda */}
      {!compact && duration && duration > 0 && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
      )}

      {/* Video Label - sadece normal modda */}
      {!compact && (
        <View style={styles.videoLabel} pointerEvents="none">
          <Ionicons name="videocam" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.videoLabelText}>Video</Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a"
  },
  thumbnail: {
    width: "100%",
    height: "100%"
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)"
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  playButtonCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  durationText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "500"
  },
  videoLabel: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  videoLabelText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginLeft: 4
  }
});

export const VideoThumbnail = memo(VideoThumbnailComponent);
