/**
 * ReelsCreator Component
 *
 * Reels video oluşturma - Video seçimi ve düzenleme
 * Instagram Reels tarzı
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { X, Camera, ChevronDown, Sparkles, Layout, Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { VisionCamera, CapturedMedia } from "@/components/camera";
import type { CreatedContent } from "./index";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_SIZE = SCREEN_WIDTH / GRID_COLUMNS;

interface ReelsCreatorProps {
  onComplete: (content: CreatedContent) => void;
  onClose: () => void;
}

interface VideoAsset {
  id: string;
  uri: string;
  width: number;
  height: number;
  duration: number;
  thumbnailUri?: string;
}

export function ReelsCreator({ onComplete, onClose }: ReelsCreatorProps) {
  const { colors } = useTheme();
  const [videoAssets, setVideoAssets] = useState<VideoAsset[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Load videos from gallery
  React.useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted");

      if (status === "granted") {
        const media = await MediaLibrary.getAssetsAsync({
          mediaType: ["video"],
          first: 50,
          sortBy: [MediaLibrary.SortBy.creationTime]
        });

        const assets: VideoAsset[] = media.assets.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          duration: asset.duration || 0
        }));

        setVideoAssets(assets);
      }
      setLoading(false);
    })();
  }, []);

  // Handle video selection
  const handleSelectVideo = useCallback(
    (video: VideoAsset) => {
      Haptics.selectionAsync();
      setSelectedVideo(video);

      // Auto-complete for now
      onComplete({
        type: "reels",
        media: [
          {
            type: "video",
            path: video.uri,
            width: video.width,
            height: video.height,
            duration: video.duration
          }
        ]
      });
    },
    [onComplete]
  );

  // Handle camera capture
  const handleCameraCapture = useCallback(
    (media: CapturedMedia) => {
      if (media.type === "video") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete({
          type: "reels",
          media: [
            {
              type: "video",
              path: media.path,
              width: media.width,
              height: media.height,
              duration: media.duration
            }
          ]
        });
      }
      setShowCamera(false);
    },
    [onComplete]
  );

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render video grid item
  const renderVideoItem = ({ item }: { item: VideoAsset }) => (
    <Pressable style={styles.gridItem} onPress={() => handleSelectVideo(item)}>
      <Image source={{ uri: item.uri }} style={styles.gridImage} contentFit="cover" />
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
      </View>
      {selectedVideo?.id === item.id && (
        <View style={[styles.selectedOverlay, { borderColor: colors.accent }]} />
      )}
    </Pressable>
  );

  // Show camera view
  if (showCamera) {
    return (
      <VisionCamera
        mode="video"
        initialPosition="back"
        enableAudio={true}
        showControls={true}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
        maxVideoDuration={90} // Reels için 90 saniye
        bottomInset={70}
        previewBottomInset={65}
      />
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
          Galeri erişimi gerekli
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} style={styles.headerButton}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Yeni Video</Text>
        <Pressable style={styles.headerButton}>
          <Settings size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={[styles.quickAction, { backgroundColor: colors.surfaceAlt }]}>
          <Sparkles size={18} color={colors.textPrimary} />
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Edits</Text>
          <View style={[styles.quickActionBadge, { backgroundColor: colors.accent }]} />
        </Pressable>
        <Pressable style={[styles.quickAction, { backgroundColor: colors.surfaceAlt }]}>
          <Layout size={18} color={colors.textPrimary} />
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Şablonlar</Text>
        </Pressable>
      </View>

      {/* Album Selector */}
      <Pressable style={styles.albumSelector}>
        <Text style={[styles.albumText, { color: colors.textPrimary }]}>Son Kaydedilenler</Text>
        <ChevronDown size={18} color={colors.textPrimary} />
      </Pressable>

      {/* Video Grid */}
      <View style={styles.gridContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={videoAssets}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Pressable
                style={[styles.cameraGridItem, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setShowCamera(true)}
              >
                <Camera size={32} color={colors.textMuted} />
              </Pressable>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centered: {
    justifyContent: "center",
    alignItems: "center"
  },
  permissionText: {
    fontSize: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 0.5
  },
  headerButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600"
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500"
  },
  quickActionBadge: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  albumSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4
  },
  albumText: {
    fontSize: 15,
    fontWeight: "600"
  },
  gridContainer: {
    flex: 1
  },
  loader: {
    marginTop: 40
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.5,
    padding: 2,
    position: "relative"
  },
  gridImage: {
    flex: 1,
    borderRadius: 4
  },
  cameraGridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.5,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    margin: 2
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  durationText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "500"
  },
  selectedOverlay: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 3,
    borderRadius: 4
  }
});
