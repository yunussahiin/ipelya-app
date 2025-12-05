/**
 * Live Session List
 * Aktif canlı yayınları listeleyen component
 * FlatList + Realtime + Pull to refresh
 */

import React, { useCallback, useRef, useEffect, useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

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
  const { user } = useAuth();
  const [myActiveSession, setMyActiveSession] = useState<LiveSessionItem | null>(null);

  const { sessions, isLoading, refresh } = useLiveSessions({
    sessionType,
    accessType,
    limit: 50
  });

  // Kullanıcının kendi aktif yayınını çek
  useEffect(() => {
    if (!user?.id) {
      setMyActiveSession(null);
      return;
    }

    const fetchMySession = async () => {
      const { data, error } = await supabase
        .from("live_sessions")
        .select(
          `
          id,
          title,
          session_type,
          access_type,
          ppv_coin_price,
          total_viewers,
          thumbnail_url,
          status,
          started_at,
          creator:profiles!live_sessions_creator_profile_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            is_verified
          )
        `
        )
        .eq("creator_id", user.id)
        .eq("status", "live")
        .maybeSingle();

      if (!error && data) {
        const creator = Array.isArray(data.creator) ? data.creator[0] : data.creator;
        setMyActiveSession({
          id: data.id,
          title: data.title || "Canlı Yayın",
          sessionType: data.session_type,
          accessType: data.access_type,
          status: data.status,
          ppvCoinPrice: data.ppv_coin_price,
          viewerCount: data.total_viewers || 0,
          thumbnailUrl: data.thumbnail_url,
          startedAt: data.started_at,
          creator: {
            id: creator?.id || "",
            userId: creator?.user_id || "",
            displayName: creator?.display_name || "Kullanıcı",
            avatarUrl: creator?.avatar_url,
            isVerified: creator?.is_verified || false
          }
        });
      } else {
        setMyActiveSession(null);
      }
    };

    fetchMySession();

    // Realtime subscription
    const channel = supabase
      .channel("my-live-session")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_sessions",
          filter: `creator_id=eq.${user.id}`
        },
        () => {
          fetchMySession();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Kendi yayınımı listeden çıkar
  const filteredSessions = sessions.filter((s) => s.id !== myActiveSession?.id);

  // Kendi aktif yayınım seçili tab'a uygun mu?
  const showMyActiveSession =
    myActiveSession && (sessionType === "all" || myActiveSession.sessionType === sessionType);

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

  // Custom header with my active session
  const renderHeader = useCallback(
    () => (
      <>
        {ListHeaderComponent}

        {/* Aktif Yayınlarım */}
        {showMyActiveSession && myActiveSession && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Ionicons
                  name={myActiveSession.sessionType === "audio_room" ? "mic" : "radio"}
                  size={16}
                  color={colors.accent}
                />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {myActiveSession.sessionType === "audio_room"
                  ? "Aktif Sesli Odam"
                  : "Aktif Yayınım"}
              </Text>
            </View>
            <SessionCard
              session={myActiveSession}
              onPress={() => onSessionPress(myActiveSession)}
              isOwn
            />
          </View>
        )}

        {/* Diğer Yayınlar Başlığı */}
        {filteredSessions.length > 0 && (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="people" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Canlı Yayınlar</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {filteredSessions.length}
            </Text>
          </View>
        )}
      </>
    ),
    [
      ListHeaderComponent,
      myActiveSession,
      showMyActiveSession,
      filteredSessions.length,
      colors,
      onSessionPress
    ]
  );

  return (
    <FlatList
      data={filteredSessions}
      renderItem={renderSessionItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={!isLoading && !showMyActiveSession ? renderEmptyComponent : null}
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
function SessionCard({
  session,
  onPress,
  isOwn = false
}: {
  session: LiveSessionItem;
  onPress: () => void;
  isOwn?: boolean;
}) {
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

  // Kendi yayınımız için özel görünüm
  if (isOwn) {
    return (
      <Pressable style={[styles.ownCard, { backgroundColor: colors.accent }]} onPress={onPress}>
        <View style={styles.ownCardContent}>
          {/* Sol - Thumbnail veya Avatar */}
          <View style={styles.ownThumbnailContainer}>
            {session.thumbnailUrl ? (
              <Image source={{ uri: session.thumbnailUrl }} style={styles.ownThumbnail} />
            ) : session.creator.avatarUrl ? (
              <Image source={{ uri: session.creator.avatarUrl }} style={styles.ownThumbnail} />
            ) : (
              <View
                style={[
                  styles.ownThumbnailPlaceholder,
                  { backgroundColor: "rgba(255,255,255,0.2)" }
                ]}
              >
                <Ionicons name="videocam" size={24} color="#fff" />
              </View>
            )}
            {/* Live indicator */}
            <Animated.View style={[styles.ownLiveIndicator, { opacity: pulseAnim }]} />
          </View>

          {/* Orta - Bilgiler */}
          <View style={styles.ownInfo}>
            <Text style={styles.ownTitle} numberOfLines={1}>
              {session.title}
            </Text>
            <View style={styles.ownStats}>
              <View style={styles.ownStatItem}>
                <Ionicons name="eye" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.ownStatText}>
                  {formatViewerCount(session.viewerCount)} izleyici
                </Text>
              </View>
              <View style={styles.ownStatItem}>
                <Ionicons name="radio" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.ownStatText}>Canlı</Text>
              </View>
            </View>
          </View>

          {/* Sağ - Yönet butonu */}
          <View style={styles.ownManageButton}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {session.thumbnailUrl ? (
          <Image source={{ uri: session.thumbnailUrl }} style={styles.thumbnail} />
        ) : session.creator.avatarUrl ? (
          // Thumbnail yoksa creator avatar'ını pulse efektiyle göster
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
            {/* Pulse ring efekti */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [1.3, 1]
                      })
                    }
                  ]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRingOuter,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0.4, 1],
                    outputRange: [0, 0.3]
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [1.5, 1.2]
                      })
                    }
                  ]
                }
              ]}
            />
            <Image source={{ uri: session.creator.avatarUrl }} style={styles.creatorAvatarLarge} />
            {/* Video/Audio overlay icon */}
            <View style={styles.mediaTypeOverlay}>
              <Ionicons
                name={session.sessionType === "audio_room" ? "mic" : "videocam"}
                size={20}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          </View>
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
        {/* Creator info + Access badge row */}
        <View style={styles.creatorAccessRow}>
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
          {/* Access badge - sağda */}
          <View style={[styles.accessBadge, { backgroundColor: `${accessInfo.color}15` }]}>
            <Ionicons
              name={accessInfo.icon as keyof typeof Ionicons.glyphMap}
              size={10}
              color={accessInfo.color}
            />
            <Text style={[styles.accessText, { color: accessInfo.color }]}>{accessInfo.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {session.title}
        </Text>
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
  creatorAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)"
  },
  mediaTypeOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  pulseRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FF2D55"
  },
  pulseRingOuter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FF2D55"
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
  creatorAccessRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
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
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1
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
  },
  // Section styles
  sectionContainer: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1
  },
  sectionCount: {
    fontSize: 14
  },
  // Own card styles (kendi yayınımız için)
  ownCard: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16
  },
  ownCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  ownThumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative"
  },
  ownThumbnail: {
    width: "100%",
    height: "100%"
  },
  ownThumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  ownLiveIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff"
  },
  ownInfo: {
    flex: 1
  },
  ownTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4
  },
  ownStats: {
    flexDirection: "row",
    gap: 12
  },
  ownStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  ownStatText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500"
  },
  ownManageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  // Own badge (eski - artık kullanılmıyor)
  ownBadge: {
    position: "absolute",
    top: -1,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
    zIndex: 10
  },
  ownBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  }
});

export default LiveSessionList;
