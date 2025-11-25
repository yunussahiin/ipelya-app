/**
 * ProfileHeader Component
 * Instagram-style profile header with avatar on left, stats on right
 */

import { useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, type SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { ProfileCover, PROFILE_COVER_HEIGHT } from "./ProfileCover";
import { ProfileAvatar, PROFILE_AVATAR_SIZE } from "./ProfileAvatar";
import { ProfileBadges } from "./ProfileBadges";
import type { Profile, ProfileStats } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_OFFSET = PROFILE_AVATAR_SIZE / 2;

interface ProfileHeaderProps {
  profile: Profile;
  stats?: ProfileStats;
  scrollY?: SharedValue<number>;
  onAvatarPress?: () => void;
  onVibePress?: () => void;
  onPostsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// Format number to K/M
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function ProfileHeader({
  profile,
  stats,
  scrollY,
  onAvatarPress,
  onVibePress,
  onPostsPress,
  onFollowersPress,
  onFollowingPress
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleStatPress = (callback?: () => void) => {
    if (callback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      callback();
    }
  };

  return (
    <View style={styles.container}>
      {/* Cover Image */}
      <ProfileCover coverUrl={profile.cover_url} scrollY={scrollY} />

      {/* Profile Content Below Cover */}
      <View style={styles.contentContainer}>
        {/* Row: Avatar + Stats */}
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              displayName={profile.display_name || ""}
              isCreator={profile.role === "creator"}
              onPress={onAvatarPress}
            />
          </View>

          {/* Stats - Instagram style */}
          {stats && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              style={styles.statsContainer}
            >
              <Pressable style={styles.statItem} onPress={() => handleStatPress(onPostsPress)}>
                <Text style={styles.statValue}>{formatNumber(stats.posts_count)}</Text>
                <Text style={styles.statLabel}>gönderi</Text>
              </Pressable>

              <Pressable style={styles.statItem} onPress={() => handleStatPress(onFollowersPress)}>
                <Text style={styles.statValue}>{formatNumber(stats.followers_count)}</Text>
                <Text style={styles.statLabel}>takipçi</Text>
              </Pressable>

              <Pressable style={styles.statItem} onPress={() => handleStatPress(onFollowingPress)}>
                <Text style={styles.statValue}>{formatNumber(stats.following_count)}</Text>
                <Text style={styles.statLabel}>takip</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.infoContainer}>
          {/* Name Row */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {profile.display_name}
            </Text>
            <ProfileBadges
              isVerified={profile.is_verified}
              isCreator={profile.role === "creator"}
              size="small"
            />
          </Animated.View>

          {/* Username */}
          {profile.username && (
            <Animated.Text entering={FadeInDown.delay(200).duration(300)} style={styles.username}>
              @{profile.username}
            </Animated.Text>
          )}

          {/* Bio */}
          {profile.bio && (
            <Animated.Text
              entering={FadeInDown.delay(250).duration(300)}
              style={styles.bio}
              numberOfLines={3}
            >
              {profile.bio}
            </Animated.Text>
          )}

          {/* Location & Vibe Row */}
          <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.metaRow}>
            {profile.location && <Text style={styles.metaText}>📍 {profile.location}</Text>}
            {profile.favorite_vibe && (
              <Pressable onPress={onVibePress} style={styles.vibeButton}>
                <Text style={styles.metaText}>✨ {profile.favorite_vibe}</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: SCREEN_WIDTH
    },
    contentContainer: {
      marginTop: -AVATAR_OFFSET
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16
    },
    avatarWrapper: {
      marginRight: 24
    },
    statsContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingTop: AVATAR_OFFSET,
      paddingBottom: 8
    },
    statItem: {
      alignItems: "center",
      paddingHorizontal: 8
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2
    },
    infoContainer: {
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 8
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    },
    displayName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      flexShrink: 1
    },
    username: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8
    },
    bio: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: 8
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 4
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary
    },
    vibeButton: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: colors.surface
    }
  });

export { PROFILE_COVER_HEIGHT, PROFILE_AVATAR_SIZE };
