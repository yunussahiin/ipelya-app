/**
 * Live Session List
 * Aktif canlı yayınları listeleyen component
 * FlatList + Realtime + Pull to refresh
 */

import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useLiveSessions, type LiveSessionItem } from "@/hooks/live";

interface LiveSessionListProps {
  onSessionPress: (session: LiveSessionItem) => void;
  sessionType?: "video_live" | "audio_room" | "all";
  accessType?: "public" | "subscribers_only" | "pay_per_view" | "all";
  ListHeaderComponent?: React.ReactElement;
  contentContainerStyle?: object;
}

export function LiveSessionList({
  onSessionPress,
  sessionType = "all",
  accessType = "all",
  ListHeaderComponent,
  contentContainerStyle
}: LiveSessionListProps) {
  const { colors } = useTheme();
  const { sessions, isLoading, refresh } = useLiveSessions({
    sessionType,
    accessType,
    limit: 50
  });

  // Session item render
  const renderSessionItem = useCallback(
    ({ item }: { item: LiveSessionItem }) => (
      <SessionCard session={item} onPress={() => onSessionPress(item)} />
    ),
    [onSessionPress]
  );

  // Empty state
  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: `${colors.accent}15` }]}>
          <Ionicons name="radio-outline" size={40} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Aktif Yayın Yok</Text>
        <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
          Şu anda aktif canlı yayın bulunmuyor. Aşağı çekerek yenileyebilirsiniz.
        </Text>
      </View>
    ),
    [colors]
  );

  return (
    <FlatList
      data={sessions}
      renderItem={renderSessionItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={!isLoading ? renderEmptyComponent : null}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
      }
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

// Session Card Component
function SessionCard({ session, onPress }: { session: LiveSessionItem; onPress: () => void }) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Live indicator pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulseAnim]);

  // Access type info
  const getAccessInfo = () => {
    switch (session.accessType) {
      case "subscribers_only":
        return { icon: "star", label: "Abonelere Özel", color: "#F59E0B" };
      case "pay_per_view":
        return { icon: "ticket", label: `${session.ppvCoinPrice} Coin`, color: "#8B5CF6" };
      default:
        return { icon: "globe-outline", label: "Herkese Açık", color: "#10B981" };
    }
  };

  const accessInfo = getAccessInfo();

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {session.thumbnailUrl ? (
          <Image source={{ uri: session.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name={session.sessionType === "audio_room" ? "mic" : "videocam"}
              size={32}
              color={colors.textMuted}
            />
          </View>
        )}

        {/* Live badge */}
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.liveIndicator, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>CANLI</Text>
        </View>

        {/* Viewer count */}
        <View style={styles.viewerBadge}>
          <Ionicons name="eye" size={12} color="#fff" />
          <Text style={styles.viewerText}>{formatViewerCount(session.viewerCount)}</Text>
        </View>

        {/* Session type badge */}
        <View style={[styles.typeBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <Ionicons
            name={session.sessionType === "audio_room" ? "headset" : "videocam"}
            size={12}
            color="#fff"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Creator info */}
        <View style={styles.creatorRow}>
          {session.creator.avatarUrl ? (
            <Image source={{ uri: session.creator.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
          )}
          <Text style={[styles.creatorName, { color: colors.textPrimary }]} numberOfLines={1}>
            {session.creator.displayName}
          </Text>
          {session.creator.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {session.title}
        </Text>

        {/* Access badge */}
        <View style={[styles.accessBadge, { backgroundColor: `${accessInfo.color}15` }]}>
          <Ionicons name={accessInfo.icon as any} size={12} color={accessInfo.color} />
          <Text style={[styles.accessText, { color: accessInfo.color }]}>{accessInfo.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// Format viewer count
function formatViewerCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 100
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  },
  card: {
    borderRadius: 16,
    overflow: "hidden"
  },
  thumbnailContainer: {
    aspectRatio: 16 / 9,
    position: "relative"
  },
  thumbnail: {
    width: "100%",
    height: "100%"
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff"
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  },
  viewerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  viewerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  typeBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    padding: 12
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  creatorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600"
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 8
  },
  accessBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  accessText: {
    fontSize: 11,
    fontWeight: "600"
  }
});

export default LiveSessionList;
