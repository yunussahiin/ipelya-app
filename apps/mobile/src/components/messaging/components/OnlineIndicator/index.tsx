/**
 * OnlineIndicator
 *
 * Amaç: Kullanıcı online durumu göstergesi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useUserOnlineStatus } from "@/hooks/messaging";
import { formatRelativeTime } from "@/utils/date";

// =============================================
// TYPES
// =============================================

interface OnlineIndicatorProps {
  userId: string;
  showText?: boolean;
  size?: "small" | "medium" | "large";
}

// =============================================
// COMPONENT
// =============================================

export const OnlineIndicator = memo(function OnlineIndicator({
  userId,
  showText = false,
  size = "medium"
}: OnlineIndicatorProps) {
  const { colors } = useTheme();
  const { isOnline, lastSeen } = useUserOnlineStatus(userId);

  const dotSize = {
    small: 8,
    medium: 12,
    large: 16
  }[size];

  const borderWidth = {
    small: 1.5,
    medium: 2,
    large: 2.5
  }[size];

  if (!showText) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            borderWidth,
            borderColor: colors.background,
            backgroundColor: isOnline ? colors.success : colors.textMuted
          }
        ]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: isOnline ? colors.success : colors.textMuted
          }
        ]}
      />
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {isOnline
          ? "Çevrimiçi"
          : lastSeen
            ? `Son görülme: ${formatRelativeTime(lastSeen)}`
            : "Çevrimdışı"}
      </Text>
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center"
  },
  dot: {},
  text: {
    fontSize: 12,
    marginLeft: 6
  }
});

export default OnlineIndicator;
