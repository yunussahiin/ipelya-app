/**
 * SubscriberBadge
 *
 * Amaç: Abone rozeti
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface SubscriberBadgeProps {
  tierName?: string;
  compact?: boolean;
}

export const SubscriberBadge = memo(function SubscriberBadge({
  tierName,
  compact = false
}: SubscriberBadgeProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: colors.highlight }]}>
        <Ionicons name="star" size={10} color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.highlight }]}>
      <Ionicons name="star" size={12} color="#fff" />
      <Text style={styles.text}>{tierName || "Abone"}</Text>
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
  compactBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  }
});

export default SubscriberBadge;
