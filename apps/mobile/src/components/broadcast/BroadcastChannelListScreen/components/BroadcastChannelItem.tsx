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

  const getAccessInfo = () => {
    switch (channel.access_type) {
      case "public":
        return { icon: "globe-outline" as const, label: "Herkese Açık", color: "#10B981" };
      case "subscribers_only":
        return { icon: "star" as const, label: "Abonelere Özel", color: "#F59E0B" };
      case "tier_specific":
        return { icon: "lock-closed" as const, label: "Özel Tier", color: "#8B5CF6" };
      default:
        return { icon: "globe-outline" as const, label: "Herkese Açık", color: "#10B981" };
    }
  };

  const accessInfo = getAccessInfo();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.8 }
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {channel.avatar_url ? (
          <Image source={{ uri: channel.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Ionicons name="megaphone" size={24} color="#fff" />
          </View>
        )}
        {isMine && (
          <View style={[styles.ownerBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="star" size={10} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {channel.name}
          </Text>
          {isMine && (
            <View style={[styles.mineBadge, { backgroundColor: `${colors.accent}20` }]}>
              <Text style={[styles.mineBadgeText, { color: colors.accent }]}>Kanalım</Text>
            </View>
          )}
        </View>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={1}>
          {channel.description || "Yayın kanalı"}
        </Text>

        <View style={styles.metaRow}>
          {/* Stats */}
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
          </View>

          {/* Access Badge */}
          <View style={[styles.accessBadge, { backgroundColor: `${accessInfo.color}15` }]}>
            <Ionicons name={accessInfo.icon} size={10} color={accessInfo.color} />
            <Text style={[styles.accessText, { color: accessInfo.color }]}>{accessInfo.label}</Text>
          </View>
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
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    gap: 12
  },
  avatarContainer: {
    position: "relative"
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  ownerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000"
  },
  content: {
    flex: 1
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1
  },
  mineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  mineBadgeText: {
    fontSize: 10,
    fontWeight: "700"
  },
  description: {
    fontSize: 13,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
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
  accessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  accessText: {
    fontSize: 10,
    fontWeight: "600"
  }
});
