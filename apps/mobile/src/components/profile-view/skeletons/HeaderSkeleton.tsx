/**
 * HeaderSkeleton Component
 * Loading skeleton for profile header section
 */

import { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_HEIGHT = 180;
const AVATAR_SIZE = 100;

export function HeaderSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <View style={styles.container}>
      {/* Cover Skeleton */}
      <Animated.View style={[styles.cover, { opacity }]} />

      {/* Avatar and Stats Row */}
      <View style={styles.headerRow}>
        {/* Avatar Skeleton */}
        <Animated.View style={[styles.avatar, { opacity }]} />

        {/* Stats Skeleton */}
        <View style={styles.statsContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statItem}>
              <Animated.View style={[styles.statValue, { opacity }]} />
              <Animated.View style={[styles.statLabel, { opacity }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        {/* Name Row */}
        <View style={styles.nameRow}>
          <Animated.View style={[styles.nameSkeleton, { opacity }]} />
          <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
        </View>

        {/* Username */}
        <Animated.View style={[styles.usernameSkeleton, { opacity }]} />

        {/* Bio */}
        <Animated.View style={[styles.bioLine1, { opacity }]} />
        <Animated.View style={[styles.bioLine2, { opacity }]} />

        {/* Meta Row */}
        <View style={styles.metaRow}>
          <Animated.View style={[styles.metaItem, { opacity }]} />
          <Animated.View style={[styles.metaItem, { opacity }]} />
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
    cover: {
      width: SCREEN_WIDTH,
      height: COVER_HEIGHT,
      backgroundColor: colors.surface
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      marginTop: -50
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.surface,
      marginRight: 24
    },
    statsContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 50,
      paddingBottom: 8
    },
    statItem: {
      alignItems: "center",
      gap: 4
    },
    statValue: {
      width: 32,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    statLabel: {
      width: 48,
      height: 14,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    infoContainer: {
      paddingTop: 16,
      paddingHorizontal: 16,
      gap: 8
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    nameSkeleton: {
      width: 140,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    badgeSkeleton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface
    },
    usernameSkeleton: {
      width: 100,
      height: 16,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    bioLine1: {
      width: "90%",
      height: 14,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    bioLine2: {
      width: "70%",
      height: 14,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    metaRow: {
      flexDirection: "row",
      gap: 16,
      marginTop: 4
    },
    metaItem: {
      width: 80,
      height: 14,
      borderRadius: 4,
      backgroundColor: colors.surface
    }
  });

export default HeaderSkeleton;
