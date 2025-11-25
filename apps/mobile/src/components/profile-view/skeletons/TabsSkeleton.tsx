/**
 * TabsSkeleton Component
 * Loading skeleton for profile tabs and grid content
 */

import { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View, Dimensions } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

interface TabsSkeletonProps {
  tabCount?: number;
  gridRows?: number;
}

export function TabsSkeleton({ tabCount = 5, gridRows = 3 }: TabsSkeletonProps) {
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

  const gridItems = Array.from({ length: gridRows * 3 }, (_, i) => i);
  const tabs = Array.from({ length: tabCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Tab Bar Skeleton */}
      <View style={styles.tabBar}>
        {tabs.map((i) => (
          <View key={i} style={styles.tabItem}>
            <Animated.View style={[styles.tabIcon, { opacity }]} />
          </View>
        ))}
      </View>

      {/* Grid Skeleton */}
      <View style={styles.grid}>
        {gridItems.map((i) => (
          <Animated.View key={i} style={[styles.gridItem, { opacity }]} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1
    },
    tabBar: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 2
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12
    },
    tabIcon: {
      width: 24,
      height: 24,
      borderRadius: 4,
      backgroundColor: colors.surface
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP
    },
    gridItem: {
      width: ITEM_SIZE,
      height: ITEM_SIZE,
      backgroundColor: colors.surface
    }
  });

export default TabsSkeleton;
