/**
 * BroadcastChannelItem
 *
 * Amaç: Yayın kanalı liste öğesi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastChannel } from "@ipelya/types";

interface BroadcastChannelItemProps {
  channel: BroadcastChannel;
  isMine?: boolean;
  onPress: () => void;
}

export const BroadcastChannelItem = memo(function BroadcastChannelItem({
  channel,
  isMine = false,
  onPress
}: BroadcastChannelItemProps) {
  const { colors } = useTheme();

  const accessIcon = {
    public: "globe-outline",
    subscribers_only: "lock-closed-outline",
    tier_specific: "star-outline"
  }[channel.access_type] as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surface : "transparent" }
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <Image
        source={{ uri: channel.avatar_url || undefined }}
        style={[styles.avatar, { backgroundColor: colors.surface }]}
        contentFit="cover"
        placeholderContentFit="cover"
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {channel.name}
          </Text>
          <Ionicons name={accessIcon} size={14} color={colors.textMuted} />
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
          {channel.description || "Açıklama yok"}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>
              {channel.member_count || 0}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textMuted }]}>
              {channel.message_count || 0}
            </Text>
          </View>
          {isMine && (
            <View style={[styles.ownerBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.ownerText}>Sahip</Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1
  },
  description: {
    fontSize: 13,
    marginTop: 2
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statText: {
    fontSize: 12
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  ownerText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  }
});
