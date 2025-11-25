/**
 * ProfileBadges Component
 * Verified, Creator, and other badges
 */

import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BadgeCheck, Sparkles, Crown } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface ProfileBadgesProps {
  isVerified?: boolean;
  isCreator?: boolean;
  isPremium?: boolean;
  size?: "small" | "medium" | "large";
}

export function ProfileBadges({
  isVerified = false,
  isCreator = false,
  isPremium = false,
  size = "medium"
}: ProfileBadgesProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const iconSize = size === "small" ? 12 : size === "medium" ? 14 : 16;

  const hasBadges = isVerified || isCreator || isPremium;

  if (!hasBadges) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {isVerified && (
        <View style={[styles.badge, styles.verifiedBadge]}>
          <BadgeCheck size={iconSize} color="#FFFFFF" />
          {size !== "small" && <Text style={styles.badgeText}>Doğrulanmış</Text>}
        </View>
      )}

      {isCreator && (
        <View style={[styles.badge, styles.creatorBadge]}>
          <Sparkles size={iconSize} color="#FFFFFF" />
          {size !== "small" && <Text style={styles.badgeText}>Creator</Text>}
        </View>
      )}

      {isPremium && (
        <View style={[styles.badge, styles.premiumBadge]}>
          <Crown size={iconSize} color="#FFFFFF" />
          {size !== "small" && <Text style={styles.badgeText}>Premium</Text>}
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors, size: "small" | "medium" | "large") => {
  const padding = size === "small" ? 4 : size === "medium" ? 6 : 8;
  const fontSize = size === "small" ? 10 : size === "medium" ? 11 : 12;
  const gap = size === "small" ? 4 : 6;

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: padding,
      paddingHorizontal: padding + 4,
      borderRadius: 12
    },
    badgeText: {
      fontSize,
      fontWeight: "600",
      color: "#FFFFFF"
    },
    verifiedBadge: {
      backgroundColor: "#3B82F6" // Blue for verified
    },
    creatorBadge: {
      backgroundColor: colors.accent
    },
    premiumBadge: {
      backgroundColor: colors.warning
    }
  });
};
