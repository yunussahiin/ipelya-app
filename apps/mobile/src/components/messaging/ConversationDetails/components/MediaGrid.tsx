/**
 * MediaGrid
 * Amaç: Paylaşılan medya grid görünümü
 */

import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { Play, Image as ImageIcon, Video, Mic, Link, LucideIcon } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate
} from "react-native-reanimated";
import { useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

// Skeleton Item Component
function SkeletonItem() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7])
  }));

  return <Animated.View style={[styles.item, styles.skeletonItem, animatedStyle]} />;
}

interface MediaItem {
  id: string;
  type: "image" | "video" | "audio" | "link";
  url: string;
  thumbnail_url?: string;
  duration?: number;
}

type MediaTabType = "images" | "videos" | "audio" | "links";

interface MediaGridProps {
  items: MediaItem[];
  onItemPress: (item: MediaItem, index: number) => void;
  activeTab: MediaTabType;
  isLoading?: boolean;
}

const emptyStates: Record<MediaTabType, { icon: LucideIcon; text: string }> = {
  images: { icon: ImageIcon, text: "Henüz paylaşılan görsel yok." },
  videos: { icon: Video, text: "Henüz paylaşılan video yok." },
  audio: { icon: Mic, text: "Henüz paylaşılan ses kaydı yok." },
  links: { icon: Link, text: "Henüz paylaşılan link yok." }
};

export function MediaGrid({ items, onItemPress, activeTab, isLoading }: MediaGridProps) {
  const { colors } = useTheme();

  // Loading skeleton
  if (isLoading && items.length === 0) {
    return (
      <View style={styles.container}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonItem key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    const { icon: Icon, text } = emptyStates[activeTab];
    return (
      <View style={styles.emptyContainer}>
        <Icon size={48} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          style={[styles.item, { backgroundColor: colors.surface }]}
          onPress={() => onItemPress(item, index)}
        >
          {item.type === "image" && (
            <Image
              source={{ uri: item.thumbnail_url || item.url }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}

          {item.type === "video" && (
            <View style={styles.videoItem}>
              <View style={[styles.placeholderItem, { backgroundColor: "#1a1a1a" }]}>
                <Video size={28} color="rgba(255,255,255,0.5)" />
              </View>
              <View style={styles.videoOverlay}>
                <View style={styles.playIcon}>
                  <Play size={16} color="#fff" fill="#fff" />
                </View>
              </View>
              {item.duration && item.duration > 0 && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {Math.floor(item.duration / 60)}:
                    {String(Math.floor(item.duration % 60)).padStart(2, "0")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.type === "audio" && (
            <View style={[styles.placeholderItem, { backgroundColor: `${colors.accent}15` }]}>
              <Mic size={28} color={colors.accent} />
            </View>
          )}

          {item.type === "link" && (
            <View style={[styles.placeholderItem, { backgroundColor: colors.surface }]}>
              <Link size={28} color={colors.textMuted} />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 0.5
  },
  skeletonItem: {
    backgroundColor: "#2a2a2a"
  },
  thumbnail: {
    width: "100%",
    height: "100%"
  },
  placeholderItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  videoItem: {
    width: "100%",
    height: "100%",
    position: "relative"
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center"
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3
  },
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500"
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12
  }
});

export type { MediaItem, MediaTabType };
