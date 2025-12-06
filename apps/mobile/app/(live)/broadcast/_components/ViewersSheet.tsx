/**
 * Viewers Sheet
 * İzleyici listesi bottom sheet component'i
 */

import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { VideoTrack, isTrackReference, TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

export interface Viewer {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  joinedAt: string;
}

interface ViewersSheetProps {
  viewers: Viewer[];
  viewerCount: number;
  totalViews?: number; // Toplam izlenme (yayın boyunca)
  peakViewers?: number; // En yüksek anlık izleyici
  // Yayın bilgileri
  broadcastTitle?: string;
  broadcastDuration?: string;
  broadcastType?: "video_live" | "audio_room";
  /** Canlı video track - gerçek zamanlı önizleme için */
  videoTrackRef?: TrackReferenceOrPlaceholder | null;
  /** İzleyiciyi şikayet et */
  onReportViewer?: (viewer: Viewer) => void;
}

export const ViewersSheet = forwardRef<BottomSheet, ViewersSheetProps>(
  (
    {
      viewers,
      viewerCount,
      totalViews = 0,
      peakViewers = 0,
      broadcastTitle,
      broadcastDuration,
      broadcastType = "video_live",
      videoTrackRef,
      onReportViewer
    },
    ref
  ) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const renderViewer = useCallback(
      ({ item }: { item: Viewer }) => (
        <View style={[styles.viewerItem, { borderBottomColor: colors.border }]}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.viewerInfo}>
            <Text style={[styles.viewerName, { color: colors.textPrimary }]}>{item.userName}</Text>
            <Text style={[styles.viewerTime, { color: colors.textMuted }]}>
              {formatJoinTime(item.joinedAt)}
            </Text>
          </View>
          {/* Report Button */}
          {onReportViewer && (
            <Pressable
              style={[styles.reportButton, { backgroundColor: colors.surface }]}
              onPress={() => onReportViewer(item)}
              hitSlop={8}
            >
              <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      ),
      [colors, onReportViewer]
    );

    const formatJoinTime = (joinedAt: string) => {
      const diff = Date.now() - new Date(joinedAt).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Az önce katıldı";
      if (minutes < 60) return `${minutes} dk önce katıldı`;
      return `${Math.floor(minutes / 60)} saat önce katıldı`;
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["50%", "80%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        {/* Yayın Bilgisi Header */}
        {broadcastTitle && (
          <View style={[styles.broadcastInfo, { backgroundColor: colors.surface }]}>
            {/* Canlı Video Preview veya Icon */}
            {videoTrackRef && isTrackReference(videoTrackRef) ? (
              <View style={styles.videoPreviewContainer}>
                <VideoTrack
                  trackRef={videoTrackRef}
                  style={styles.videoPreview}
                  objectFit="cover"
                />
                {/* Canlı badge */}
                <View style={styles.liveIndicator}>
                  <View style={styles.liveIndicatorDot} />
                </View>
              </View>
            ) : (
              <View style={[styles.broadcastIconContainer, { backgroundColor: colors.accentSoft }]}>
                <Ionicons
                  name={broadcastType === "audio_room" ? "mic" : "videocam"}
                  size={24}
                  color={colors.accent}
                />
              </View>
            )}
            <View style={styles.broadcastDetails}>
              <Text
                style={[styles.broadcastTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {broadcastTitle}
              </Text>
              <View style={styles.broadcastMeta}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>CANLI</Text>
                </View>
                {broadcastDuration && (
                  <Text style={[styles.broadcastDuration, { color: colors.textMuted }]}>
                    {broadcastDuration}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* İzleyici Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="people" size={20} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>İzleyiciler</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.countText}>{viewerCount}</Text>
          </View>
        </View>

        {/* İstatistikler */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{viewerCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Şu An</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {peakViewers || viewerCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>En Yüksek</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {totalViews || viewerCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Toplam</Text>
          </View>
        </View>

        {viewers.length > 0 ? (
          <BottomSheetFlatList
            data={viewers}
            renderItem={renderViewer}
            keyExtractor={(item: Viewer) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz izleyici yok</Text>
          </View>
        )}
      </BottomSheet>
    );
  }
);

ViewersSheet.displayName = "ViewersSheet";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  countText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  listContent: {
    paddingHorizontal: 16
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  viewerInfo: {
    flex: 1,
    gap: 2
  },
  viewerName: {
    fontSize: 15,
    fontWeight: "500"
  },
  viewerTime: {
    fontSize: 13
  },
  reportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 15
  },
  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 12
  },
  statDivider: {
    width: 1,
    height: 30
  },
  // Broadcast Info
  broadcastInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    gap: 12
  },
  broadcastIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  videoPreviewContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000"
  },
  videoPreview: {
    width: 72,
    height: 72
  },
  liveIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF2D55"
  },
  broadcastDetails: {
    flex: 1,
    gap: 4
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: "600"
  },
  broadcastMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2D55",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4
  },
  liveDot: {
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
  broadcastDuration: {
    fontSize: 13
  }
});

export default ViewersSheet;
