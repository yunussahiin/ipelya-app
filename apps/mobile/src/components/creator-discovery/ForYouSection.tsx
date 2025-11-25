import { useCallback, useMemo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { CreatorAvatar, StatsBadge } from "./shared";
import { CATEGORIES, type Creator } from "./types";

interface ForYouSectionProps {
  creators: Creator[];
  title?: string;
  onSeeAll?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 240;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ForYouCard({ creator }: { creator: Creator }) {
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

  const categoryLabel = CATEGORIES.find((c) => c.id === creator.category)?.label || "";

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
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
        locations={[0.2, 0.6, 1]}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <CreatorAvatar
            uri={creator.avatarUrl}
            size={48}
            isOnline={creator.isOnline}
            isVerified={creator.isVerified}
          />
          <View style={styles.textContainer}>
            <Text style={styles.displayName}>{creator.displayName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{categoryLabel}</Text>
              <Text style={styles.separator}>•</Text>
              <StatsBadge type="followers" count={creator.followerCount} size="small" />
            </View>
          </View>
        </View>
        <Pressable style={styles.discoverButton}>
          <Text style={styles.discoverText}>Keşfet</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

export function ForYouSection({ creators, title = "Senin İçin", onSeeAll }: ForYouSectionProps) {
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
      <View style={styles.cardList}>
        {creators.slice(0, 3).map((creator) => (
          <ForYouCard key={creator.id} creator={creator} />
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
    cardList: {
      paddingHorizontal: 16,
      gap: 16
    }
  });

const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 20,
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
      padding: 16
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12
    },
    textContainer: {
      marginLeft: 12,
      flex: 1
    },
    displayName: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF"
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      gap: 6
    },
    category: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)"
    },
    separator: {
      fontSize: 13,
      color: "rgba(255,255,255,0.5)"
    },
    discoverButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      gap: 6
    },
    discoverText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF"
    }
  });
