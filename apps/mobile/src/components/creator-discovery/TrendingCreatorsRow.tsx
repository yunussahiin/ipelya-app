import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { CreatorAvatar, StatsBadge } from "./shared";
import type { Creator } from "./types";

interface TrendingCreatorsRowProps {
  creators: Creator[];
  title?: string;
  onSeeAll?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrendingCreatorItem({ creator }: { creator: Creator }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createItemStyles(colors), [colors]);
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${creator.username}`);
  }, [creator.username, router]);

  return (
    <AnimatedPressable
      style={[styles.itemContainer, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <CreatorAvatar
        uri={creator.avatarUrl}
        size={72}
        isOnline={creator.isOnline}
        isVerified={creator.isVerified}
      />
      <Text style={styles.displayName} numberOfLines={1}>
        {creator.displayName}
      </Text>
      <StatsBadge type="likes" count={creator.likeCount} size="small" />
    </AnimatedPressable>
  );
}

export function TrendingCreatorsRow({
  creators,
  title = "Trend Olanlar",
  onSeeAll
}: TrendingCreatorsRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderItem = useCallback(
    ({ item }: { item: Creator }) => <TrendingCreatorItem creator={item} />,
    []
  );

  const keyExtractor = useCallback((item: Creator) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <Pressable style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>Tümü</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      <FlatList
        data={creators}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={96}
        decelerationRate="fast"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 24
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 16
    }
  });

const createItemStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    itemContainer: {
      alignItems: "center",
      width: 80
    },
    displayName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: 8,
      textAlign: "center"
    }
  });
