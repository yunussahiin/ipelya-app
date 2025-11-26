/**
 * BroadcastMembersScreen
 *
 * Amaç: Yayın kanalı üyeleri ekranı
 * Tarih: 2025-11-26
 */

import { useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastMemberRole } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastMember {
  id: string;
  user_id: string;
  role: BroadcastMemberRole;
  joined_at: string;
  profile: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

// =============================================
// COMPONENT
// =============================================

export function BroadcastMembersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();

  // Üyeleri getir
  const { data: members, isLoading } = useQuery({
    queryKey: ["broadcast-members", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_channel_members")
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          profile:profiles!user_id (
            display_name,
            username,
            avatar_url
          )
        `
        )
        .eq("channel_id", channelId)
        .is("left_at", null)
        .order("role", { ascending: true })
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data as unknown as BroadcastMember[];
    },
    enabled: !!channelId
  });

  // Rol badge
  const getRoleBadge = (role: BroadcastMemberRole) => {
    switch (role) {
      case "owner":
        return { label: "Sahip", color: colors.accent };
      case "moderator":
        return { label: "Moderatör", color: colors.success };
      case "subscriber":
        return { label: "Abone", color: colors.highlight };
      default:
        return null;
    }
  };

  // Render member
  const renderMember = useCallback(
    ({ item }: { item: BroadcastMember }) => {
      const badge = getRoleBadge(item.role);

      return (
        <View style={styles.memberItem}>
          <Image
            source={{ uri: item.profile?.avatar_url || undefined }}
            style={[styles.avatar, { backgroundColor: colors.surface }]}
            contentFit="cover"
            placeholderContentFit="cover"
          />
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {item.profile?.display_name || "Kullanıcı"}
              </Text>
              {badge && (
                <View style={[styles.badge, { backgroundColor: badge.color }]}>
                  <Text style={styles.badgeText}>{badge.label}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.username, { color: colors.textMuted }]}>
              @{item.profile?.username || "user"}
            </Text>
          </View>
          <Pressable style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      );
    },
    [colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Üyeler</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Member count */}
      <View style={styles.countContainer}>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {members?.length || 0} üye
        </Text>
      </View>

      {/* Members list */}
      <FlashList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        estimatedItemSize={60}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  backButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  placeholder: {
    width: 36
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  listContent: {
    paddingBottom: 100
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  name: {
    fontSize: 16,
    fontWeight: "500"
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  },
  username: {
    fontSize: 14,
    marginTop: 2
  },
  menuButton: {
    padding: 8
  }
});

export default BroadcastMembersScreen;
