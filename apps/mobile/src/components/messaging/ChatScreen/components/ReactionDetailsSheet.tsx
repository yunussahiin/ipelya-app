/**
 * ReactionDetailsSheet
 *
 * Reaksiyona tıklandığında açılan bottom sheet
 * Hangi kullanıcının hangi reaksiyonu verdiğini gösterir
 */

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

interface ReactionUser {
  id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    username: string;
  } | null;
}

interface ReactionDetailsSheetProps {
  visible: boolean;
  messageId: string | null;
  colors: ThemeColors;
  currentUserId?: string;
  onClose: () => void;
  onRemoveReaction: (emoji: string) => void;
}

function ReactionDetailsSheetComponent({
  visible,
  messageId,
  colors,
  currentUserId,
  onClose,
  onRemoveReaction
}: ReactionDetailsSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["40%"], []);

  // Fetch reaction details
  const { data: reactions, isLoading } = useQuery({
    queryKey: ["reaction-details", messageId],
    queryFn: async () => {
      if (!messageId) return [];

      // Önce reaksiyonları çek
      const { data: reactionsData, error: reactionsError } = await supabase
        .from("message_reactions")
        .select("id, user_id, emoji, created_at")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (reactionsError) {
        console.error("[ReactionDetails] Reactions query error:", reactionsError);
        throw reactionsError;
      }

      if (!reactionsData?.length) return [];

      // Sonra profilleri çek (user_id ile, id değil!)
      const userIds = [...new Set(reactionsData.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, username")
        .in("user_id", userIds);

      // Profilleri user_id ile map'e çevir
      const profileMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

      // Reaksiyonları profil ile birleştir
      return reactionsData.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id) || null
      })) as ReactionUser[];
    },
    enabled: visible && !!messageId
  });

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    if (!reactions) return new Map<string, ReactionUser[]>();

    const map = new Map<string, ReactionUser[]>();
    for (const reaction of reactions) {
      const existing = map.get(reaction.emoji) || [];
      map.set(reaction.emoji, [...existing, reaction]);
    }
    return map;
  }, [reactions]);

  // All unique emojis
  const emojis = useMemo(() => Array.from(groupedReactions.keys()), [groupedReactions]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleRemoveOwnReaction = useCallback(
    (emoji: string) => {
      onRemoveReaction(emoji);
      onClose();
    },
    [onRemoveReaction, onClose]
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      bottomInset={insets.bottom}
      detached={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {reactions?.length || 0} İfade
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Emoji tabs */}
        <View style={styles.emojiTabs}>
          {emojis.map((emoji) => (
            <View key={emoji} style={[styles.emojiTab, { backgroundColor: colors.surface }]}>
              <Text style={styles.emojiText}>{emoji}</Text>
              <Text style={[styles.emojiCount, { color: colors.textSecondary }]}>
                {groupedReactions.get(emoji)?.length || 0}
              </Text>
            </View>
          ))}
        </View>

        {/* User list */}
        {isLoading ? (
          <View style={styles.userList}>
            {/* Skeleton */}
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.userRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.skeletonAvatar, { backgroundColor: colors.surface }]} />
                <View style={styles.userInfo}>
                  <View
                    style={[styles.skeletonText, { backgroundColor: colors.surface, width: 120 }]}
                  />
                  <View
                    style={[
                      styles.skeletonText,
                      { backgroundColor: colors.surface, width: 80, marginTop: 4 }
                    ]}
                  />
                </View>
                <View style={[styles.skeletonEmoji, { backgroundColor: colors.surface }]} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.userList}>
            {reactions?.map((reaction) => {
              const isOwnReaction = reaction.user_id === currentUserId;
              const profile = Array.isArray(reaction.profile)
                ? reaction.profile[0]
                : reaction.profile;

              return (
                <Pressable
                  key={reaction.id}
                  style={[styles.userRow, { borderBottomColor: colors.border }]}
                  onPress={
                    isOwnReaction ? () => handleRemoveOwnReaction(reaction.emoji) : undefined
                  }
                >
                  {/* Avatar */}
                  {profile?.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                      <Ionicons name="person" size={20} color="#fff" />
                    </View>
                  )}

                  {/* User info */}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {isOwnReaction ? "Siz" : profile?.display_name || "Kullanıcı"}
                    </Text>
                    {isOwnReaction && (
                      <Text style={[styles.removeHint, { color: colors.textMuted }]}>
                        Kaldırmak için dokunun
                      </Text>
                    )}
                  </View>

                  {/* Emoji */}
                  <Text style={styles.userEmoji}>{reaction.emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "center"
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  emojiTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  emojiTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4
  },
  emojiText: {
    fontSize: 18
  },
  emojiCount: {
    fontSize: 14,
    fontWeight: "500"
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center"
  },
  userList: {
    gap: 0
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  userInfo: {
    flex: 1,
    marginLeft: 12
  },
  userName: {
    fontSize: 15,
    fontWeight: "500"
  },
  removeHint: {
    fontSize: 12,
    marginTop: 2
  },
  userEmoji: {
    fontSize: 24
  },
  // Skeleton styles
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  skeletonText: {
    height: 14,
    borderRadius: 4
  },
  skeletonEmoji: {
    width: 24,
    height: 24,
    borderRadius: 12
  }
});

export const ReactionDetailsSheet = memo(ReactionDetailsSheetComponent);
