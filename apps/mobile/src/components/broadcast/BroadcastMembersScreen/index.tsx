/**
 * BroadcastMembersScreen
 *
 * Amaç: Yayın kanalı üyeleri ekranı
 * Tarih: 2025-11-26
 * Güncelleme: 2025-12-02 - Üye yönetimi eklendi
 */

import { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { VolumeX, Ban, UserX, Volume2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useManageBroadcastMember } from "@/hooks/messaging";
import { useToast } from "@/components/ui";
import { useBroadcastStore } from "@/store/messaging";
import type { BroadcastMemberRole } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastMember {
  id: string;
  user_id: string;
  role: BroadcastMemberRole;
  joined_at: string;
  is_muted?: boolean;
  muted_until?: string;
  is_banned?: boolean;
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
  const { showToast } = useToast();

  // Current user
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  // Kanal bilgisi - owner kontrolü için
  const channel = useBroadcastStore((s) =>
    [...s.myChannels, ...s.joinedChannels].find((c) => c.id === channelId)
  );
  const isOwner = channel?.creator_id === userId;

  // Seçili üye ve action menu
  const [selectedMember, setSelectedMember] = useState<BroadcastMember | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Üye yönetimi hook
  const { mutate: manageMember, isPending: isManaging } = useManageBroadcastMember();

  // Üyeleri getir (Edge Function ile)
  const {
    data: members,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["broadcast-members", channelId],
    queryFn: async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-broadcast-members?channel_id=${channelId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) throw new Error("Üyeler yüklenemedi");

      const result = await res.json();
      return result.data || [];
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

  // Üye action menu aç
  const openMemberMenu = (member: BroadcastMember) => {
    if (!isOwner || member.role === "owner") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMember(member);
    setShowActionMenu(true);
  };

  // Üye sustur
  const handleMute = (hours?: number) => {
    if (!selectedMember || !channelId) return;
    manageMember(
      {
        channelId,
        memberId: selectedMember.user_id,
        action: "mute",
        durationHours: hours
      },
      {
        onSuccess: () => {
          showToast({
            type: "success",
            message: hours ? `Üye ${hours} saat susturuldu` : "Üye susturuldu"
          });
          setShowActionMenu(false);
          refetch();
        },
        onError: (err) => showToast({ type: "error", message: err.message })
      }
    );
  };

  // Susturmayı kaldır
  const handleUnmute = () => {
    if (!selectedMember || !channelId) return;
    manageMember(
      { channelId, memberId: selectedMember.user_id, action: "unmute" },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Susturma kaldırıldı" });
          setShowActionMenu(false);
          refetch();
        },
        onError: (err) => showToast({ type: "error", message: err.message })
      }
    );
  };

  // Üye engelle
  const handleBan = () => {
    if (!selectedMember || !channelId) return;
    manageMember(
      { channelId, memberId: selectedMember.user_id, action: "ban" },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Üye engellendi" });
          setShowActionMenu(false);
          refetch();
        },
        onError: (err) => showToast({ type: "error", message: err.message })
      }
    );
  };

  // Engeli kaldır
  const handleUnban = () => {
    if (!selectedMember || !channelId) return;
    manageMember(
      { channelId, memberId: selectedMember.user_id, action: "unban" },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Engel kaldırıldı" });
          setShowActionMenu(false);
          refetch();
        },
        onError: (err) => showToast({ type: "error", message: err.message })
      }
    );
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
              {item.is_muted && (
                <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                  <VolumeX size={10} color="#fff" />
                </View>
              )}
              {item.is_banned && (
                <View style={[styles.statusBadge, { backgroundColor: "#EF4444" }]}>
                  <Ban size={10} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[styles.username, { color: colors.textMuted }]}>
              @{item.profile?.username || "user"}
            </Text>
          </View>
          {isOwner && item.role !== "owner" && (
            <Pressable style={styles.menuButton} onPress={() => openMemberMenu(item)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      );
    },
    [colors, isOwner]
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />

      {/* Member Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowActionMenu(false)} />
        <View style={[styles.actionMenuContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />

          {/* Üye bilgisi */}
          {selectedMember && (
            <View style={styles.selectedMemberInfo}>
              <Text style={[styles.selectedMemberName, { color: colors.textPrimary }]}>
                {selectedMember.profile?.display_name}
              </Text>
              <Text style={[styles.selectedMemberUsername, { color: colors.textMuted }]}>
                @{selectedMember.profile?.username}
              </Text>
            </View>
          )}

          {/* Sustur / Susturmayı Kaldır */}
          {selectedMember?.is_muted ? (
            <Pressable style={styles.actionMenuItem} onPress={handleUnmute} disabled={isManaging}>
              <Volume2 size={22} color={colors.success} />
              <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
                Susturmayı Kaldır
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.actionMenuItem}
                onPress={() => handleMute(1)}
                disabled={isManaging}
              >
                <VolumeX size={22} color={colors.warning} />
                <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
                  1 Saat Sustur
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionMenuItem}
                onPress={() => handleMute(24)}
                disabled={isManaging}
              >
                <VolumeX size={22} color={colors.warning} />
                <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
                  24 Saat Sustur
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionMenuItem}
                onPress={() => handleMute()}
                disabled={isManaging}
              >
                <VolumeX size={22} color={colors.warning} />
                <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
                  Süresiz Sustur
                </Text>
              </Pressable>
            </>
          )}

          {/* Engelle / Engeli Kaldır */}
          {selectedMember?.is_banned ? (
            <Pressable style={styles.actionMenuItem} onPress={handleUnban} disabled={isManaging}>
              <UserX size={22} color={colors.success} />
              <Text style={[styles.actionMenuText, { color: colors.textPrimary }]}>
                Engeli Kaldır
              </Text>
            </Pressable>
          ) : (
            <Pressable style={styles.actionMenuItem} onPress={handleBan} disabled={isManaging}>
              <Ban size={22} color="#EF4444" />
              <Text style={[styles.actionMenuText, { color: "#EF4444" }]}>Üyeyi Engelle</Text>
            </Pressable>
          )}

          {/* İptal */}
          <Pressable
            style={[styles.actionMenuItem, styles.actionMenuCancel]}
            onPress={() => setShowActionMenu(false)}
          >
            <Text
              style={[
                styles.actionMenuText,
                { color: colors.textMuted, textAlign: "center", flex: 1 }
              ]}
            >
              İptal
            </Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
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
  },
  statusBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center"
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  actionMenuContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingTop: 8
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16
  },
  selectedMemberInfo: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 8
  },
  selectedMemberName: {
    fontSize: 16,
    fontWeight: "600"
  },
  selectedMemberUsername: {
    fontSize: 13,
    marginTop: 2
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: "500"
  },
  actionMenuCancel: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginTop: 8,
    justifyContent: "center"
  }
});

export default BroadcastMembersScreen;
