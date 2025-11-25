import { useCallback, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { CreatorAvatar, FollowButton, StatsBadge } from "./shared";
import type { Creator } from "./types";

interface RisingStarsGridProps {
  creators: Creator[];
  title?: string;
  onSeeAll?: () => void;
  onFollow?: (creatorId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = 200;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function RisingStarCard({
  creator,
  onFollow
}: {
  creator: Creator;
  onFollow?: (creatorId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${creator.username}`);
  }, [creator.username, router]);

  const handleFollow = useCallback(() => {
    onFollow?.(creator.id);
  }, [creator.id, onFollow]);

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Image
        source={{ uri: creator.coverUrl || undefined }}
        style={styles.coverImage}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
        locations={[0.3, 0.7, 1]}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.creatorRow}>
          <CreatorAvatar
            uri={creator.avatarUrl}
            size={36}
            isOnline={creator.isOnline}
            isVerified={creator.isVerified}
            showRing={false}
          />
          <View style={styles.textContainer}>
            <Text style={styles.displayName} numberOfLines={1}>
              {creator.displayName}
            </Text>
            <StatsBadge type="likes" count={creator.likeCount} size="small" />
          </View>
        </View>
        <FollowButton
          isFollowing={creator.isFollowing}
          onPress={handleFollow}
          size="small"
          variant="outline"
        />
      </View>
    </AnimatedPressable>
  );
}

export function RisingStarsGrid({
  creators,
  title = "Yükselen Yıldızlar",
  onSeeAll,
  onFollow
}: RisingStarsGridProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      <View style={styles.grid}>
        {creators.slice(0, 4).map((creator) => (
          <RisingStarCard key={creator.id} creator={creator} onFollow={onFollow} />
        ))}
      </View>
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
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 16,
      gap: 16
    }
  });

const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: colors.surface
    },
    coverImage: {
      ...StyleSheet.absoluteFillObject
    },
    gradient: {
      ...StyleSheet.absoluteFillObject
    },
    content: {
      flex: 1,
      justifyContent: "flex-end",
      padding: 12
    },
    creatorRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10
    },
    textContainer: {
      marginLeft: 10,
      flex: 1
    },
    displayName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
      marginBottom: 2
    }
  });
