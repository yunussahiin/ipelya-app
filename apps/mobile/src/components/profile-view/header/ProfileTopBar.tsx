/**
 * ProfileTopBar Component
 * Top navigation bar with username, shadow profile switcher, and action buttons
 *
 * Features:
 * - Username with dropdown for shadow profile switch
 * - Online indicator (green dot for real, red for shadow)
 * - Lock icon for private profile
 * - Create post button (+)
 * - Menu button (hamburger)
 */

import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ChevronDown, Lock, Plus, Menu, User, Ghost, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

type ProfileType = "real" | "shadow";

interface ProfileTopBarProps {
  username: string;
  isOwnProfile: boolean;
  currentProfileType?: ProfileType;
  hasShadowProfile?: boolean;
  isPrivate?: boolean;
  onProfileSwitch?: (type: ProfileType) => void;
  onCreatePost?: () => void;
  onMenuPress?: () => void;
  onBackPress?: () => void;
}

export function ProfileTopBar({
  username,
  isOwnProfile,
  currentProfileType = "real",
  hasShadowProfile = false,
  isPrivate = false,
  onProfileSwitch,
  onCreatePost,
  onMenuPress,
  onBackPress
}: ProfileTopBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const handleUsernamePress = () => {
    if (isOwnProfile && hasShadowProfile) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSwitcherVisible(true);
    }
  };

  const handleProfileSwitch = (type: ProfileType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwitcherVisible(false);
    onProfileSwitch?.(type);
  };

  const handleCreatePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCreatePost?.();
  };

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMenuPress?.();
  };

  return (
    <>
      <View style={styles.container}>
        {/* Left: Username with dropdown */}
        <Pressable
          style={styles.usernameContainer}
          onPress={handleUsernamePress}
          disabled={!isOwnProfile || !hasShadowProfile}
        >
          {isPrivate && <Lock size={16} color={colors.textPrimary} style={styles.lockIcon} />}
          <Text style={styles.username}>{username}</Text>
          {isOwnProfile && hasShadowProfile && <ChevronDown size={20} color={colors.textPrimary} />}
          {/* Profile type indicator dot */}
          <View
            style={[
              styles.statusDot,
              currentProfileType === "shadow" ? styles.shadowDot : styles.realDot
            ]}
          />
        </Pressable>

        {/* Right: Action buttons */}
        <View style={styles.actionsContainer}>
          {isOwnProfile && (
            <Pressable style={styles.actionButton} onPress={handleCreatePost}>
              <Plus size={26} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          )}
          <Pressable style={styles.actionButton} onPress={handleMenuPress}>
            <Menu size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Profile Switcher Modal */}
      <Modal
        visible={switcherVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSwitcherVisible(false)}>
          <Animated.View entering={FadeInDown.duration(200)} style={styles.switcherContainer}>
            <Text style={styles.switcherTitle}>Profil Seç</Text>

            {/* Real Profile Option */}
            <Pressable style={styles.switcherOption} onPress={() => handleProfileSwitch("real")}>
              <View style={styles.switcherOptionLeft}>
                <View style={[styles.optionIcon, styles.realIcon]}>
                  <User size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.optionTitle}>{username}</Text>
                  <Text style={styles.optionSubtitle}>Ana Profil</Text>
                </View>
              </View>
              {currentProfileType === "real" && <Check size={20} color={colors.accent} />}
            </Pressable>

            {/* Shadow Profile Option */}
            <Pressable style={styles.switcherOption} onPress={() => handleProfileSwitch("shadow")}>
              <View style={styles.switcherOptionLeft}>
                <View style={[styles.optionIcon, styles.shadowIcon]}>
                  <Ghost size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Gizli Profil</Text>
                  <Text style={styles.optionSubtitle}>Shadow Mode</Text>
                </View>
              </View>
              {currentProfileType === "shadow" && <Check size={20} color={colors.accent} />}
            </Pressable>

            {/* Info text */}
            <Text style={styles.infoText}>
              Shadow profilde paylaşımların ve etkileşimlerin gizli kalır.
            </Text>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, insets: { top: number }) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background
    },
    usernameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    lockIcon: {
      marginRight: 4
    },
    username: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 6
    },
    realDot: {
      backgroundColor: "#22C55E" // Green
    },
    shadowDot: {
      backgroundColor: "#EF4444" // Red
    },
    actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    actionButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center"
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24
    },
    switcherContainer: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      gap: 16
    },
    switcherTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 4
    },
    switcherOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.background
    },
    switcherOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    optionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center"
    },
    realIcon: {
      backgroundColor: "#3B82F6" // Blue
    },
    shadowIcon: {
      backgroundColor: "#8B5CF6" // Purple
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary
    },
    optionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2
    },
    infoText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 18
    }
  });

export default ProfileTopBar;
