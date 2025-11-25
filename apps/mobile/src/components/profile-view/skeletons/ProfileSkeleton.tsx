/**
 * ProfileSkeleton Component
 * Full page loading skeleton for profile screen
 * Combines HeaderSkeleton + ActionsSkeleton + TabsSkeleton
 */

import { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { HeaderSkeleton } from "./HeaderSkeleton";
import { TabsSkeleton } from "./TabsSkeleton";

interface ProfileSkeletonProps {
  showTopBar?: boolean;
}

export function ProfileSkeleton({ showTopBar = true }: ProfileSkeletonProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
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
      {/* Top Bar Skeleton */}
      {showTopBar && (
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Animated.View style={[styles.usernameSkeleton, { opacity }]} />
            <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
            <Animated.View style={[styles.statusDot, { opacity }]} />
          </View>
          <View style={styles.topBarRight}>
            <Animated.View style={[styles.iconButton, { opacity }]} />
            <Animated.View style={[styles.iconButton, { opacity }]} />
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Header Skeleton */}
        <HeaderSkeleton />

        {/* Actions Skeleton */}
        <View style={styles.actionsContainer}>
          <Animated.View style={[styles.primaryButton, { opacity }]} />
          <Animated.View style={[styles.secondaryButton, { opacity }]} />
          <Animated.View style={[styles.secondaryButton, { opacity }]} />
        </View>

        {/* Highlights Skeleton */}
        <View style={styles.highlightsContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.highlightItem}>
              <Animated.View style={[styles.highlightCircle, { opacity }]} />
              <Animated.View style={[styles.highlightLabel, { opacity }]} />
            </View>
          ))}
        </View>

        {/* Tabs Skeleton */}
        <TabsSkeleton />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { top: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.background
    },
    topBarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    topBarRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    usernameSkeleton: {
      width: 120,
      height: 24,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    chevronSkeleton: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.surface
    },
    scrollView: {
      flex: 1
    },
    actionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      marginTop: 16
    },
    primaryButton: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.surface
    },
    secondaryButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.surface
    },
    highlightsContainer: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 16
    },
    highlightItem: {
      alignItems: "center",
      gap: 8
    },
    highlightCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface
    },
    highlightLabel: {
      width: 48,
      height: 12,
      borderRadius: 4,
      backgroundColor: colors.surface
    }
  });

export default ProfileSkeleton;
