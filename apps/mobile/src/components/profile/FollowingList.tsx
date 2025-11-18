/**
 * Following List Component
 * Displays list of users being followed with unfollow action
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
import { MessageCircle, MoreVertical } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useFollowers, type FollowerProfile } from "@/hooks/useFollowers";
import { SortSheet } from "./SortSheet";
import { UnfollowSheet } from "./UnfollowSheet";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

export interface FollowingListProps {
  userId: string;
}

type SortOption = "default" | "newest" | "oldest";

export function FollowingList({ userId }: FollowingListProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { following, loading, error, loadFollowing, unfollow, clearError } = useFollowers();
  const [unfollowLoading, setUnfollowLoading] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [selectedUser, setSelectedUser] = useState<FollowerProfile | null>(null);
  const [showUnfollowSheet, setShowUnfollowSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load following on mount
  useEffect(() => {
    loadFollowing(userId);
  }, [userId, loadFollowing]);

  const handleUnfollow = useCallback(
    async (followingId: string) => {
      setUnfollowLoading((prev) => ({ ...prev, [followingId]: true }));
      try {
        await unfollow(followingId);
      } finally {
        setUnfollowLoading((prev) => ({ ...prev, [followingId]: false }));
      }
    },
    [unfollow]
  );

  const renderFollowing = useCallback(
    ({ item }: { item: FollowerProfile }) => {
      const isLoading = unfollowLoading[item.user_id];

      return (
        <Pressable
          style={styles.followingItem}
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
            <Pressable
              style={[styles.messageButton, isLoading && styles.buttonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/messages/${item.user_id}`);
              }}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Mesaj gönder"
              accessibilityRole="button"
            >
              <MessageCircle size={16} color={colors.background} />
              <Text style={styles.messageButtonText}>Mesaj</Text>
            </Pressable>

            <Pressable
              style={[styles.moreButton, isLoading && styles.buttonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedUser(item);
                setShowUnfollowSheet(true);
              }}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Seçenekler"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <MoreVertical size={18} color={colors.accent} />
              )}
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [unfollowLoading, handleUnfollow, colors, styles]
  );

  const sortedFollowing = following.slice().sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    }
    return 0;
  });

  const handleConfirmUnfollow = async () => {
    if (selectedUser) {
      await handleUnfollow(selectedUser.user_id);
      setShowUnfollowSheet(false);
      setSelectedUser(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Sort Button */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Takip Edilen</Text>
        <Pressable
          style={styles.sortButton}
          onPress={() => setShowSortSheet(true)}
          accessible={true}
          accessibilityLabel="Sırala"
          accessibilityRole="button"
        >
          <Text style={styles.sortButtonText}>Sırala</Text>
        </Pressable>
      </View>

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

      {loading && !following.length ? (
        <SkeletonLoader count={5} height={70} borderRadius={12} />
      ) : following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz kimseyi takip etmiyor</Text>
        </View>
      ) : (
        <FlatList
          data={sortedFollowing}
          renderItem={renderFollowing}
          keyExtractor={(item) => item.user_id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Sort Sheet */}
      <SortSheet
        visible={showSortSheet}
        selectedSort={sortBy}
        onSelect={setSortBy}
        onClose={() => setShowSortSheet(false)}
      />

      {/* Unfollow Sheet */}
      <UnfollowSheet
        visible={showUnfollowSheet}
        user={selectedUser}
        loading={selectedUser ? unfollowLoading[selectedUser.user_id] : false}
        onUnfollow={handleConfirmUnfollow}
        onClose={() => setShowUnfollowSheet(false)}
      />
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
    followingItem: {
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
    unfollowButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    unfollowButtonDisabled: {
      opacity: 0.6
    },
    unfollowButtonText: {
      color: colors.textSecondary,
      fontSize: 18,
      fontWeight: "600"
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600"
    },
    sortButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    sortButtonText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600"
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
    moreButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    buttonDisabled: {
      opacity: 0.6
    }
  });
