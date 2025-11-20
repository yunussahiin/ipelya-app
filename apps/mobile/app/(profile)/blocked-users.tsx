/**
 * Blocked Users Screen
 * Engellenen kullanıcıların listesi
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
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useBlockedUsers, type BlockedUser } from "@/hooks/useBlockedUsers";
import { useBlockUser } from "@/hooks/useBlockUser";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { blockedUsers, loading, error, loadBlockedUsers, clearError } = useBlockedUsers();
  const { unblockUser, blocking } = useBlockUser();
  const [unblockingUsers, setUnblockingUsers] = useState<Set<string>>(new Set());
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Reload blocked users on mount
  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = useCallback(
    async (userId: string) => {
      setUnblockingUsers((prev) => new Set(prev).add(userId));
      try {
        const success = await unblockUser(userId);
        if (success) {
          // Reload list after unblock
          await loadBlockedUsers();
        }
      } finally {
        setUnblockingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    },
    [unblockUser, loadBlockedUsers]
  );

  const renderBlockedUser = useCallback(
    ({ item }: { item: BlockedUser }) => {
      const isUnblocking = unblockingUsers.has(item.blocked_id);
      const profile = item.blocked_profile;

      return (
        <View style={styles.userItem}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                accessible={true}
                accessibilityLabel={`${profile.display_name} profil fotoğrafı`}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.displayName} numberOfLines={1}>
              {profile?.display_name || "Anonim Kullanıcı"}
            </Text>
            <Text style={styles.blockedDate}>
              {new Date(item.created_at).toLocaleDateString("tr-TR")}
            </Text>
            {item.reason && (
              <Text style={styles.reason} numberOfLines={1}>
                Neden: {item.reason}
              </Text>
            )}
          </View>

          {/* Unblock Button */}
          <Pressable
            style={[styles.unblockButton, isUnblocking && styles.buttonDisabled]}
            onPress={() => handleUnblock(item.blocked_id)}
            disabled={isUnblocking || blocking}
            accessible={true}
            accessibilityLabel="Engeli kaldır"
            accessibilityRole="button"
          >
            {isUnblocking ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RotateCcw size={16} color={colors.accent} />
            )}
          </Pressable>
        </View>
      );
    },
    [unblockingUsers, blocking, handleUnblock, colors, styles]
  );

  return (
    <PageScreen showNavigation={false}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border }
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel="Geri git"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Engellenen Kullanıcılar
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error */}
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

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={5} height={80} borderRadius={12} />
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Engellenen kullanıcı yok
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlockedUser}
          keyExtractor={(item) => item.blocked_id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          scrollEnabled={true}
        />
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700"
    },
    errorBox: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "#ef4444",
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12
    },
    errorText: {
      color: "#ef4444",
      fontSize: 13,
      fontWeight: "500"
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "500"
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 12
    },
    avatarContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden"
    },
    avatar: {
      width: "100%",
      height: "100%"
    },
    avatarPlaceholder: {
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center"
    },
    avatarPlaceholderText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700"
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
    blockedDate: {
      color: colors.textSecondary,
      fontSize: 12
    },
    reason: {
      color: colors.textSecondary,
      fontSize: 11,
      fontStyle: "italic"
    },
    unblockButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center"
    },
    buttonDisabled: {
      opacity: 0.6
    },
    separator: {
      height: 1,
      marginVertical: 8
    }
  });
