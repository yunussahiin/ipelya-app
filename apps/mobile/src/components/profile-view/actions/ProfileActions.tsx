/**
 * ProfileActions Component
 * Container for profile action buttons
 * - Own profile: Edit Profile, Settings
 * - Other profile: Follow, Message, More
 */

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Settings, UserPen, Share2, Crown } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { FollowButton } from "./FollowButton";
import { MessageButton } from "./MessageButton";
import { MoreMenuButton, MoreMenu } from "./MoreMenu";
import type { FollowStatus, MoreMenuAction, ViewMode } from "../types";

interface ProfileActionsProps {
  viewMode: ViewMode;
  followStatus?: FollowStatus;
  isFollowLoading?: boolean;
  isCreator?: boolean;
  isSubscribed?: boolean;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onSubscribePress?: () => void;
  onMoreAction?: (action: MoreMenuAction) => void;
  onEditProfilePress?: () => void;
  onSettingsPress?: () => void;
  onShareProfilePress?: () => void;
}

export function ProfileActions({
  viewMode,
  followStatus,
  isFollowLoading = false,
  isCreator = false,
  isSubscribed = false,
  onFollowPress,
  onMessagePress,
  onSubscribePress,
  onMoreAction,
  onEditProfilePress,
  onSettingsPress,
  onShareProfilePress
}: ProfileActionsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMoreAction = (action: MoreMenuAction) => {
    onMoreAction?.(action);
  };

  const handlePress = (callback?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback?.();
  };

  // Own profile - Edit Profile & Settings
  if (viewMode === "own") {
    return (
      <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.container}>
        {/* Edit Profile Button */}
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={() => handlePress(onEditProfilePress)}
        >
          <UserPen size={18} color={colors.textPrimary} />
          <Text style={styles.buttonText}>Profili Düzenle</Text>
        </Pressable>

        {/* Share Profile Button */}
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handlePress(onShareProfilePress)}
        >
          <Share2 size={18} color={colors.textPrimary} />
        </Pressable>

        {/* Settings Button */}
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handlePress(onSettingsPress)}
        >
          <Settings size={18} color={colors.textPrimary} />
        </Pressable>
      </Animated.View>
    );
  }

  // Other profile - Follow, Message, More
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.container}>
      {/* Follow Button */}
      <View style={styles.primaryAction}>
        <FollowButton
          isFollowing={followStatus?.isFollowing ?? false}
          isLoading={isFollowLoading}
          onPress={onFollowPress ?? (() => {})}
        />
      </View>

      {/* Subscribe Button - Only for creators */}
      {isCreator && (
        <Pressable
          style={[styles.button, isSubscribed ? styles.subscribedButton : styles.subscribeButton]}
          onPress={() => handlePress(onSubscribePress)}
        >
          <Crown size={16} color={isSubscribed ? colors.textPrimary : "#FFFFFF"} />
          <Text style={[styles.buttonText, !isSubscribed && styles.subscribeButtonText]}>
            {isSubscribed ? "Abone" : "Abone Ol"}
          </Text>
        </Pressable>
      )}

      {/* Message Button */}
      <MessageButton onPress={onMessagePress ?? (() => {})} />

      {/* More Button */}
      <MoreMenuButton onPress={() => setMenuVisible(true)} />

      {/* More Menu */}
      <MoreMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMoreAction}
        isOwnProfile={false}
      />
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      marginTop: 16
    },
    primaryAction: {
      flex: 1
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 36,
      borderRadius: 8,
      gap: 8
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    secondaryButton: {
      width: 36,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    subscribeButton: {
      paddingHorizontal: 16,
      backgroundColor: colors.accent,
      gap: 6
    },
    subscribedButton: {
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6
    },
    subscribeButtonText: {
      color: "#FFFFFF"
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    }
  });
