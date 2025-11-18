/**
 * Unfollow Bottom Sheet Component
 * Displays user info and unfollow confirmation
 */

import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView
} from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import type { FollowerProfile } from "@/hooks/useFollowers";

export interface UnfollowSheetProps {
  visible: boolean;
  user: FollowerProfile | null;
  loading: boolean;
  onUnfollow: () => Promise<void>;
  onClose: () => void;
}

export function UnfollowSheet({ visible, user, loading, onUnfollow, onClose }: UnfollowSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={15} style={styles.overlay}>
        <Pressable
          style={[styles.overlayPressable, { backgroundColor: "rgba(0, 0, 0, 0.2)" }]}
          onPress={onClose}
        />
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Pressable onPress={(e) => e.stopPropagation()}>
            {user && (
              <>
                {/* User Info Section */}
                <View style={styles.userInfoSection}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {user.display_name?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.displayName}>{user.display_name}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                  <Pressable
                    style={[styles.unfollowButton, loading && styles.buttonDisabled]}
                    onPress={onUnfollow}
                    disabled={loading}
                    accessible={true}
                    accessibilityLabel="Takibi bırak"
                    accessibilityRole="button"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Text style={styles.unfollowText}>Takibi Bırak</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.cancelButton}
                    onPress={onClose}
                    accessible={true}
                    accessibilityLabel="İptal"
                    accessibilityRole="button"
                  >
                    <Text style={styles.cancelText}>İptal</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end"
    },
    overlayPressable: {
      flex: 1
    },
    sheet: {
      borderRadius: 24,
      marginHorizontal: 12,
      marginBottom: 12,
      paddingHorizontal: 0,
      paddingTop: 20,
      paddingBottom: 24
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 24
    },
    userInfoSection: {
      alignItems: "center",
      marginBottom: 28,
      gap: 12
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
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
      fontSize: 32,
      fontWeight: "700"
    },
    displayName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600"
    },
    buttonGroup: {
      gap: 10,
      paddingHorizontal: 16
    },
    unfollowButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1.5,
      borderColor: "#ef4444",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48
    },
    unfollowText: {
      color: "#ef4444",
      fontSize: 14,
      fontWeight: "600"
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48
    },
    cancelText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    buttonDisabled: {
      opacity: 0.6
    }
  });
