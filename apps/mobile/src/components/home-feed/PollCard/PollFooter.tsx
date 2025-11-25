/**
 * PollFooter Component
 * Anket footer - oy sayısı, detaylar butonu, kalan süre
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Clock, BarChart3 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface PollFooterProps {
  totalVotes: number;
  timeRemaining: string | null;
  isExpired: boolean;
  isOwner: boolean;
  onDetailsPress: () => void;
}

export function PollFooter({
  totalVotes,
  timeRemaining,
  isExpired,
  isOwner,
  onDetailsPress
}: PollFooterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <Text style={[styles.totalVotes, { color: colors.textMuted }]}>
          {totalVotes > 0 ? `${totalVotes} oy` : "Henüz oy yok"}
        </Text>
        {isOwner && (
          <Pressable
            style={[styles.detailsButton, { backgroundColor: colors.accent + "20" }]}
            onPress={onDetailsPress}
          >
            <BarChart3 size={14} color={colors.accent} />
            <Text style={[styles.detailsButtonText, { color: colors.accent }]}>Detaylar</Text>
          </Pressable>
        )}
      </View>
      {timeRemaining && (
        <View style={styles.timeRow}>
          <Clock size={12} color={isExpired ? colors.warning : colors.textMuted} />
          <Text style={[styles.timeText, { color: isExpired ? colors.warning : colors.textMuted }]}>
            {timeRemaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  totalVotes: {
    fontSize: 13
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "500"
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  timeText: {
    fontSize: 13
  }
});
