/**
 * ChatSettingsScreen
 *
 * Amaç: Sohbet ayarları ekranı
 * Tarih: 2025-11-26
 *
 * Bildirim ayarları, medya galerisi, sohbet silme/arşivleme.
 */

import { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useConversationStore } from "@/store/messaging";
import { useArchiveConversation, useMuteConversation } from "@/hooks/messaging";
import { Ionicons } from "@expo/vector-icons";
import { SettingsItem } from "./components/SettingsItem";
import { MediaGallery } from "./components/MediaGallery";

// =============================================
// COMPONENT
// =============================================

export function ChatSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // Sohbet bilgisi
  const conversation = useConversationStore((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );

  const { mutate: archiveConversation } = useArchiveConversation();
  const { mutate: muteConversation } = useMuteConversation();

  const displayName =
    conversation?.name || conversation?.other_participant?.display_name || "Sohbet";
  const avatarUrl = conversation?.avatar_url || conversation?.other_participant?.avatar_url;

  // Arşivle
  const handleArchive = useCallback(() => {
    Alert.alert("Sohbeti Arşivle", "Bu sohbeti arşivlemek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Arşivle",
        onPress: () => {
          archiveConversation({ conversationId: conversationId || "", archive: true });
          router.back();
          router.back();
        }
      }
    ]);
  }, [conversationId, archiveConversation, router]);

  // Sessize al/aç
  const handleMute = useCallback(() => {
    const isMuted = conversation?.is_muted ?? false;
    muteConversation({
      conversationId: conversationId || "",
      mute: !isMuted
    });
  }, [conversationId, conversation?.is_muted, muteConversation]);

  // Sil
  const handleDelete = useCallback(() => {
    Alert.alert("Sohbeti Sil", "Bu sohbet kalıcı olarak silinecek. Devam etmek istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          // TODO: Delete conversation
          router.back();
          router.back();
        }
      }
    ]);
  }, [router]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Profile section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: avatarUrl || undefined }}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
          contentFit="cover"
          placeholderContentFit="cover"
        />
        <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
        {conversation?.other_participant?.username && (
          <Text style={[styles.username, { color: colors.textMuted }]}>
            @{conversation.other_participant.username}
          </Text>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction}>
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="call-outline" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Ara</Text>
        </Pressable>
        <Pressable style={styles.quickAction}>
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="videocam-outline" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Görüntülü</Text>
        </Pressable>
        <Pressable style={styles.quickAction}>
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="person-outline" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Profil</Text>
        </Pressable>
      </View>

      {/* Settings */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingsItem
          icon="notifications-outline"
          label={conversation?.is_muted ? "Bildirimleri Aç" : "Sessize Al"}
          onPress={handleMute}
        />
        <SettingsItem icon="search-outline" label="Sohbette Ara" onPress={() => {}} />
      </View>

      {/* Media gallery */}
      <MediaGallery conversationId={conversationId || ""} />

      {/* Danger zone */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingsItem icon="archive-outline" label="Sohbeti Arşivle" onPress={handleArchive} />
        <SettingsItem icon="trash-outline" label="Sohbeti Sil" onPress={handleDelete} destructive />
        <SettingsItem
          icon="ban-outline"
          label="Kullanıcıyı Engelle"
          onPress={() => {}}
          destructive
        />
      </View>
    </ScrollView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 100
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  backButton: {
    padding: 4
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12
  },
  name: {
    fontSize: 22,
    fontWeight: "600"
  },
  username: {
    fontSize: 14,
    marginTop: 4
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 16
  },
  quickAction: {
    alignItems: "center"
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6
  },
  quickActionText: {
    fontSize: 12
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden"
  }
});

export default ChatSettingsScreen;
