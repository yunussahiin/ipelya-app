/**
 * ChatHeader
 *
 * Amaç: Sohbet ekranı header
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversationStore } from "@/store/messaging";
import { useUserOnlineStatus } from "@/hooks/messaging";
import { Ionicons } from "@expo/vector-icons";

interface ChatHeaderProps {
  conversationId: string;
}

export function ChatHeader({ conversationId }: ChatHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Sohbet bilgisi
  const conversation = useConversationStore((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );

  // Online durumu
  const otherUserId = conversation?.other_participant?.user_id || "";
  const { isOnline, lastSeen } = useUserOnlineStatus(otherUserId);

  const displayName =
    conversation?.name || conversation?.other_participant?.display_name || "Sohbet";
  const avatarUrl = conversation?.avatar_url || conversation?.other_participant?.avatar_url;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
      </Pressable>

      {/* User info */}
      <Pressable
        style={styles.userInfo}
        onPress={() => router.push(`/messages/${conversationId}/settings`)}
      >
        <Image
          source={{ uri: avatarUrl || undefined }}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
          contentFit="cover"
          placeholderContentFit="cover"
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.status, { color: colors.textMuted }]}>
            {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
          </Text>
        </View>
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton}>
          <Ionicons name="call-outline" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
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
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  textContainer: {
    marginLeft: 10,
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: "600"
  },
  status: {
    fontSize: 12,
    marginTop: 2
  },
  actions: {
    flexDirection: "row"
  },
  actionButton: {
    padding: 8,
    marginLeft: 4
  }
});
