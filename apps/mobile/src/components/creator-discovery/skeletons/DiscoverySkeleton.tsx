import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { colors } = useTheme();
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
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          opacity
        },
        style
      ]}
    />
  );
}

function HeroSkeleton() {
  return (
    <View style={heroStyles.container}>
      <SkeletonBox width={SCREEN_WIDTH - 32} height={320} borderRadius={24} />
    </View>
  );
}

function TrendingRowSkeleton() {
  const styles = useMemo(() => createTrendingStyles(), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBox width={120} height={24} borderRadius={8} />
        <SkeletonBox width={60} height={20} borderRadius={6} />
      </View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.item}>
            <SkeletonBox width={72} height={72} borderRadius={36} />
            <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonBox width={40} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

function CategoryChipsSkeleton() {
  return (
    <View style={categoryStyles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonBox key={i} width={80} height={36} borderRadius={18} />
      ))}
    </View>
  );
}

function GridSkeleton() {
  const styles = useMemo(() => createGridStyles(), []);

  const cardWidth = (SCREEN_WIDTH - 48) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBox width={140} height={24} borderRadius={8} />
        <SkeletonBox width={60} height={20} borderRadius={6} />
      </View>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} width={cardWidth} height={200} borderRadius={16} />
        ))}
      </View>
    </View>
  );
}

function ForYouSkeleton() {
  const styles = useMemo(() => createForYouStyles(), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonBox width={100} height={24} borderRadius={8} />
        <SkeletonBox width={60} height={20} borderRadius={6} />
      </View>
      <View style={styles.cardList}>
        {[1, 2].map((i) => (
          <SkeletonBox key={i} width={SCREEN_WIDTH - 32} height={240} borderRadius={20} />
        ))}
      </View>
    </View>
  );
}

export function DiscoverySkeleton() {
  return (
    <View style={containerStyles.container}>
      <HeroSkeleton />
      <TrendingRowSkeleton />
      <CategoryChipsSkeleton />
      <GridSkeleton />
      <ForYouSkeleton />
    </View>
  );
}

const containerStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16
  }
});

const heroStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16
  }
});

const categoryStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10
  }
});

const createTrendingStyles = () =>
  StyleSheet.create({
    container: {
      marginTop: 24
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 16
    },
    row: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 16
    },
    item: {
      alignItems: "center"
    }
  });

const createGridStyles = () =>
  StyleSheet.create({
    container: {
      marginTop: 24
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 16
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 16,
      gap: 16
    }
  });

const createForYouStyles = () =>
  StyleSheet.create({
    container: {
      marginTop: 24
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 16
    },
    cardList: {
      paddingHorizontal: 16,
      gap: 16
    }
  });
