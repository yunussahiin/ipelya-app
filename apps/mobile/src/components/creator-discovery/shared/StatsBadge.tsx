import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { Heart, Users } from "lucide-react-native";

interface StatsBadgeProps {
  type: "followers" | "likes";
  count: number;
  size?: "small" | "medium";
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function StatsBadge({ type, count, size = "medium" }: StatsBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const iconSize = size === "small" ? 12 : 14;

  return (
    <View style={styles.container}>
      {type === "followers" ? (
        <Users size={iconSize} color={colors.textSecondary} />
      ) : (
        <Heart size={iconSize} color={colors.accent} fill={colors.accent} />
      )}
      <Text style={styles.text}>{formatCount(count)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, size: "small" | "medium") =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: size === "small" ? 3 : 4
    },
    text: {
      fontSize: size === "small" ? 11 : 13,
      fontWeight: "500",
      color: colors.textSecondary
    }
  });
