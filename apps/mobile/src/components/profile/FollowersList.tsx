/**
 * Followers List Component
 * Displays list of followers with follow/unfollow actions
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator
} from "react-native";
import { MessageCircle, UserPlus, UserCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useFollowers, type FollowerProfile } from "@/hooks/useFollowers";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

export interface FollowersListProps {
  userId: string;
  currentUserId?: string;
}

export function FollowersList({ userId, currentUserId }: FollowersListProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { followers, loading, error, loadFollowers, follow, unfollow, clearError } = useFollowers();
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followingLoading, setFollowingLoading] = useState<Record<string, boolean>>({});
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load followers on mount
  useEffect(() => {
    loadFollowers(userId, currentUserId);
  }, [userId, currentUserId, loadFollowers]);

  // Initialize following states from follower data
  useEffect(() => {
    if (followers.length > 0) {
      const newStates: Record<string, boolean> = {};
      followers.forEach((follower) => {
        newStates[follower.user_id] = follower.is_following || false;
      });
      setFollowingStates(newStates);
    }
  }, [followers]);

  const handleFollowToggle = useCallback(
    async (followerId: string) => {
      setFollowingLoading((prev) => ({ ...prev, [followerId]: true }));
      try {
        const isFollowing = followingStates[followerId];
        const success = isFollowing ? await unfollow(followerId) : await follow(followerId);

        if (success) {
          setFollowingStates((prev) => ({
            ...prev,
            [followerId]: !isFollowing
          }));
        }
      } finally {
        setFollowingLoading((prev) => ({ ...prev, [followerId]: false }));
      }
    },
    [followingStates, follow, unfollow]
  );

  const renderFollower = useCallback(
    ({ item }: { item: FollowerProfile }) => {
      const isFollowing = followingStates[item.user_id];
      const isLoading = followingLoading[item.user_id];
      const isCurrentUser = currentUserId === item.user_id;

      return (
        <Pressable
          style={styles.followerItem}
          onPress={() => router.push(`/(profile)/${item.user_id}`)}
          accessible={true}
          accessibilityLabel={`${item.display_name} profiline git`}
          accessibilityRole="button"
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={styles.avatar}
                accessible={true}
                accessibilityLabel={`${item.display_name} profil fotoğrafı`}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {item.display_name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.display_name || "Anonim Kullanıcı"}
            </Text>
            {item.bio && (
              <Text style={styles.bio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
            {item.is_creator && <Text style={styles.creatorBadge}>👑 Creator</Text>}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            {!isCurrentUser && (
              <>
                {isFollowing ? (
                  <Pressable
                    style={[styles.messageButton, isLoading && styles.buttonDisabled]}
                    onPress={() => router.push(`/messages/${item.user_id}`)}
                    disabled={isLoading}
                    accessible={true}
                    accessibilityLabel="Mesaj gönder"
                    accessibilityRole="button"
                  >
                    <MessageCircle size={16} color={colors.accent} />
                    <Text style={styles.messageButtonText}>Mesaj</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[
                    styles.followButton,
                    isFollowing && styles.followButtonActive,
                    isLoading && styles.buttonDisabled
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(item.user_id);
                  }}
                  disabled={isLoading}
                  accessible={true}
                  accessibilityLabel={isFollowing ? "Takipten çık" : "Takip et"}
                  accessibilityRole="button"
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowing ? colors.textPrimary : colors.background}
                    />
                  ) : isFollowing ? (
                    <>
                      <UserCheck size={14} color={colors.textPrimary} />
                      <Text style={styles.followButtonTextActive}>Takip Ediliyor</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} color={colors.background} />
                      <Text style={styles.followButtonText}>Takip Et</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      );
    },
    [followingStates, followingLoading, currentUserId, handleFollowToggle, colors, styles]
  );

  return (
    <View style={styles.container}>
      {error && (
        <Pressable
          style={styles.errorBox}
          onPress={clearError}
          accessible={true}
          accessibilityLabel="Hatayı kapat"
        >
          <Text style={styles.errorText}>{error}</Text>
        </Pressable>
      )}

      {loading && !followers.length ? (
        <SkeletonLoader count={5} height={70} borderRadius={12} />
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz takipçi yok</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollower}
          keyExtractor={(item) => item.user_id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 200
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 200
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500"
    },
    errorBox: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "#ef4444",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16
    },
    errorText: {
      color: "#ef4444",
      fontSize: 13,
      fontWeight: "500"
    },
    followerItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12
    },
    avatarContainer: {
      width: 48,
      height: 48
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface
    },
    avatarPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border
    },
    avatarInitial: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "600"
    },
    infoContainer: {
      flex: 1,
      gap: 4
    },
    displayName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    bio: {
      color: colors.textSecondary,
      fontSize: 12
    },
    creatorBadge: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2
    },
    followButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.accent,
      minWidth: 100,
      justifyContent: "center",
      alignItems: "center"
    },
    followButtonActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    followButtonDisabled: {
      opacity: 0.6
    },
    followButtonText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: "600"
    },
    followButtonTextActive: {
      color: colors.textPrimary
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8
    },
    buttonGroup: {
      gap: 8,
      flexDirection: "row"
    },
    messageButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 80,
      justifyContent: "center"
    },
    messageButtonText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: "600"
    },
    buttonDisabled: {
      opacity: 0.6
    }
  });
