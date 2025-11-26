/**
 * BroadcastChannelHeader
 *
 * Amaç: Yayın kanalı header
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastChannel } from "@ipelya/types";

interface BroadcastChannelHeaderProps {
  channel?: BroadcastChannel;
}

export function BroadcastChannelHeader({ channel }: BroadcastChannelHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const accessIcon = {
    public: "globe-outline",
    subscribers_only: "lock-closed-outline",
    tier_specific: "star-outline"
  }[channel?.access_type || "public"] as keyof typeof Ionicons.glyphMap;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
      </Pressable>

      <Pressable
        style={styles.channelInfo}
        onPress={() => router.push(`/broadcast/${channel?.id}/settings`)}
      >
        <Image
          source={{ uri: channel?.avatar_url || undefined }}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
          contentFit="cover"
          placeholderContentFit="cover"
        />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {channel?.name || "Kanal"}
            </Text>
            <Ionicons name={accessIcon} size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.memberCount, { color: colors.textMuted }]}>
            {channel?.member_count || 0} üye
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.menuButton}
        onPress={() => router.push(`/broadcast/${channel?.id}/settings`)}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  backButton: {
    padding: 4
  },
  channelInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8
  },
  textContainer: {
    marginLeft: 10,
    flex: 1
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  name: {
    fontSize: 16,
    fontWeight: "600"
  },
  memberCount: {
    fontSize: 12,
    marginTop: 2
  },
  menuButton: {
    padding: 8
  }
});
