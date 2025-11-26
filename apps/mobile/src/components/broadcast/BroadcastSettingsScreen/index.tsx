/**
 * BroadcastSettingsScreen
 *
 * Amaç: Yayın kanalı ayarları ekranı
 * Tarih: 2025-11-26
 */

import { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useBroadcastStore } from "@/store/messaging";
import { useLeaveBroadcastChannel } from "@/hooks/messaging";
import { Ionicons } from "@expo/vector-icons";
import { SettingsItem } from "../../messaging/ChatSettingsScreen/components/SettingsItem";

// =============================================
// COMPONENT
// =============================================

export function BroadcastSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();

  // Kanal bilgisi
  const channel = useBroadcastStore((s) =>
    [...s.myChannels, ...s.joinedChannels].find((c) => c.id === channelId)
  );

  const { mutate: leaveChannel } = useLeaveBroadcastChannel();

  // Owner mı?
  const isOwner = channel?.creator_id === channel?.id; // TODO: Fix

  // Kanaldan ayrıl
  const handleLeave = useCallback(() => {
    Alert.alert("Kanaldan Ayrıl", "Bu kanaldan ayrılmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Ayrıl",
        style: "destructive",
        onPress: () => {
          leaveChannel({ channel_id: channelId || "" });
          router.back();
          router.back();
        }
      }
    ]);
  }, [channelId, leaveChannel, router]);

  // Kanalı sil
  const handleDelete = useCallback(() => {
    Alert.alert("Kanalı Sil", "Bu kanal kalıcı olarak silinecek. Devam etmek istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          // TODO: Delete channel
          router.back();
          router.back();
        }
      }
    ]);
  }, [router]);

  const accessLabel = {
    public: "Herkese Açık",
    subscribers_only: "Sadece Aboneler",
    tier_specific: "Belirli Tier"
  }[channel?.access_type || "public"];

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

      {/* Channel info */}
      <View style={styles.channelSection}>
        <Image
          source={{ uri: channel?.avatar_url || undefined }}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
          contentFit="cover"
          placeholderContentFit="cover"
        />
        <Text style={[styles.name, { color: colors.textPrimary }]}>{channel?.name || "Kanal"}</Text>
        {channel?.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {channel.description}
          </Text>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {channel?.member_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Üye</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {channel?.message_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mesaj</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingsItem
          icon="globe-outline"
          label="Erişim Tipi"
          value={accessLabel}
          onPress={() => {}}
        />
        <SettingsItem
          icon="people-outline"
          label="Üyeler"
          onPress={() => router.push(`/broadcast/${channelId}/members`)}
        />
        <SettingsItem icon="notifications-outline" label="Bildirimler" onPress={() => {}} />
      </View>

      {/* Owner settings */}
      {isOwner && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingsItem icon="create-outline" label="Kanalı Düzenle" onPress={() => {}} />
          <SettingsItem icon="shield-outline" label="Moderatörler" onPress={() => {}} />
        </View>
      )}

      {/* Danger zone */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        {!isOwner && (
          <SettingsItem
            icon="exit-outline"
            label="Kanaldan Ayrıl"
            onPress={handleLeave}
            destructive
          />
        )}
        {isOwner && (
          <SettingsItem
            icon="trash-outline"
            label="Kanalı Sil"
            onPress={handleDelete}
            destructive
          />
        )}
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
  channelSection: {
    alignItems: "center",
    paddingVertical: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: 12
  },
  name: {
    fontSize: 22,
    fontWeight: "600"
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32
  },
  stats: {
    flexDirection: "row",
    gap: 32,
    marginTop: 16
  },
  stat: {
    alignItems: "center"
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600"
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden"
  }
});

export default BroadcastSettingsScreen;
