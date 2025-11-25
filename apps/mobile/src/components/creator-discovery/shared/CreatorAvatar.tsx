import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { BadgeCheck } from "lucide-react-native";

interface CreatorAvatarProps {
  uri: string | null;
  size?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  showRing?: boolean;
}

export function CreatorAvatar({
  uri,
  size = 56,
  isOnline = false,
  isVerified = false,
  showRing = true
}: CreatorAvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const ringSize = size + 6;
  const onlineIndicatorSize = size * 0.22;

  return (
    <View style={styles.container}>
      {showRing && (
        <LinearGradient
          colors={
            isOnline ? [colors.accent, colors.accentSoft] : [colors.border, colors.borderMuted]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
        />
      )}
      <View style={styles.avatarContainer}>
        <Image
          source={uri ? { uri } : undefined}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
      </View>
      {isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2
            }
          ]}
        />
      )}
      {isVerified && (
        <View style={styles.verifiedBadge}>
          <BadgeCheck size={size * 0.28} color={colors.accent} fill={colors.background} />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, size: number) =>
  StyleSheet.create({
    container: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center"
    },
    ring: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center"
    },
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surface,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.background
    },
    avatar: {
      width: "100%",
      height: "100%"
    },
    onlineIndicator: {
      position: "absolute",
      bottom: 2,
      right: 2,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.background
    },
    verifiedBadge: {
      position: "absolute",
      bottom: -2,
      right: -2
    }
  });
