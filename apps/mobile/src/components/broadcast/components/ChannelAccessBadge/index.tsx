/**
 * ChannelAccessBadge
 *
 * Amaç: Erişim tipi rozeti
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastAccessType } from "@ipelya/types";

interface ChannelAccessBadgeProps {
  accessType: BroadcastAccessType;
  showLabel?: boolean;
}

const ACCESS_CONFIG = {
  public: {
    icon: "globe-outline" as const,
    label: "Herkese Açık",
    color: "#4CAF50"
  },
  subscribers_only: {
    icon: "lock-closed-outline" as const,
    label: "Sadece Aboneler",
    color: "#FF9800"
  },
  tier_specific: {
    icon: "star-outline" as const,
    label: "Özel Tier",
    color: "#9C27B0"
  }
};

export const ChannelAccessBadge = memo(function ChannelAccessBadge({
  accessType,
  showLabel = false
}: ChannelAccessBadgeProps) {
  const { colors } = useTheme();
  const config = ACCESS_CONFIG[accessType];

  if (!showLabel) {
    return <Ionicons name={config.icon} size={14} color={colors.textMuted} />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Ionicons name={config.icon} size={12} color="#fff" />
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  label: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  }
});

export default ChannelAccessBadge;
