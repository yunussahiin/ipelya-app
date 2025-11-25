/**
 * ProfileStats Component
 * Stats row showing followers, following, posts
 */

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { StatItem } from "./StatItem";
import type { ProfileStats as ProfileStatsType } from "../types";

interface ProfileStatsProps {
  stats: ProfileStatsType;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onPostsPress?: () => void;
}

export function ProfileStats({
  stats,
  onFollowersPress,
  onFollowingPress,
  onPostsPress
}: ProfileStatsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.container}>
      <StatItem value={stats.posts_count} label="Gönderi" onPress={onPostsPress} />

      <View style={styles.divider} />

      <StatItem value={stats.followers_count} label="Takipçi" onPress={onFollowersPress} />

      <View style={styles.divider} />

      <StatItem value={stats.following_count} label="Takip" onPress={onFollowingPress} />
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    divider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border
    }
  });
