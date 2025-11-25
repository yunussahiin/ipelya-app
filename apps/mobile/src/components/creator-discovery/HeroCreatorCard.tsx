import { useCallback, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { CreatorAvatar, FollowButton, StatsBadge } from "./shared";
import type { Creator } from "./types";

interface HeroCreatorCardProps {
  creator: Creator;
  scrollY?: { value: number };
  onFollow?: (creatorId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HEIGHT = 320;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeroCreatorCard({ creator, scrollY, onFollow }: HeroCreatorCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const scaleValue = interpolate(
      scrollY.value,
      [-100, 0, 100],
      [1.1, 1, 0.95],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(scrollY.value, [0, 100], [0, -20], Extrapolation.CLAMP);

    return {
      transform: [{ scale: scaleValue }, { translateY }]
    };
  });

  const animatedPressStyle = useAnimatedStyle(() => ({
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
      style={[styles.container, animatedCardStyle, animatedPressStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Image
        source={{ uri: creator.coverUrl || undefined }}
        style={styles.coverImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.creatorInfo}>
          <CreatorAvatar
            uri={creator.avatarUrl}
            size={64}
            isOnline={creator.isOnline}
            isVerified={creator.isVerified}
          />
          <View style={styles.textContainer}>
            <Text style={styles.displayName}>{creator.displayName}</Text>
            <Text style={styles.username}>@{creator.username}</Text>
            <View style={styles.statsRow}>
              <StatsBadge type="likes" count={creator.likeCount} />
              <StatsBadge type="followers" count={creator.followerCount} />
            </View>
          </View>
        </View>
        <FollowButton isFollowing={creator.isFollowing} onPress={handleFollow} size="large" />
      </View>
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: SCREEN_WIDTH - 32,
      height: CARD_HEIGHT,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: colors.surface,
      marginHorizontal: 16
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
      padding: 20
    },
    creatorInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16
    },
    textContainer: {
      marginLeft: 14,
      flex: 1
    },
    displayName: {
      fontSize: 22,
      fontWeight: "700",
      color: "#FFFFFF"
    },
    username: {
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 6
    }
  });
