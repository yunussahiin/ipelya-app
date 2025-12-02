/**
 * BroadcastChannelHeader
 *
 * Amaç: Yayın kanalı header
 * Tarih: 2025-12-02 (V3 güncelleme)
 *
 * Özellikler:
 * - Kanal adına tıklayınca settings'e git
 * - Bildirim toggle butonu
 * - Üç nokta menüsü kaldırıldı
 */

import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Bell, BellOff, BarChart3, Clock, Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useToast } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";
import type { BroadcastChannel } from "@ipelya/types";

interface BroadcastChannelHeaderProps {
  channel?: BroadcastChannel;
  isCreator?: boolean;
  onOpenScheduled?: () => void;
  onOpenAnalytics?: () => void;
}

export function BroadcastChannelHeader({
  channel,
  isCreator = false,
  onOpenScheduled,
  onOpenAnalytics
}: BroadcastChannelHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Bildirim toggle
  const toggleNotifications = useCallback(async () => {
    if (isToggling || !channel?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsToggling(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const newValue = !notificationsEnabled;

      // Üyelik kaydını güncelle
      await supabase
        .from("broadcast_channel_members")
        .update({ notifications_enabled: newValue })
        .eq("channel_id", channel.id)
        .eq("user_id", user.id);

      setNotificationsEnabled(newValue);
      showToast({
        type: "info",
        message: newValue ? "Bildirimler açıldı" : "Bildirimler kapatıldı"
      });
    } catch (error) {
      console.error("Toggle notifications error:", error);
    } finally {
      setIsToggling(false);
    }
  }, [channel?.id, notificationsEnabled, isToggling, showToast]);

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

      {/* Kanal bilgisi - tıklayınca settings'e git */}
      <Pressable
        style={styles.channelInfo}
        onPress={() => router.push(`/(broadcast)/${channel?.id}/settings`)}
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

      {/* Creator kısayol butonları */}
      {isCreator && (
        <View style={styles.creatorActions}>
          {/* Analytics */}
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              console.log("📊 [Header] Analytics button pressed");
              onOpenAnalytics?.();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BarChart3 size={20} color={colors.textPrimary} />
          </Pressable>

          {/* Zamanlanmış Mesajlar */}
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              console.log("⏰ [Header] Scheduled button pressed");
              onOpenScheduled?.();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Clock size={20} color={colors.accent} />
          </Pressable>

          {/* Ayarlar */}
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              console.log("⚙️ [Header] Settings button pressed");
              router.push(`/(broadcast)/${channel?.id}/settings`);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      )}

      {/* Bildirim butonu - sadece üyeler için */}
      {!isCreator && (
        <Pressable
          style={styles.notificationButton}
          onPress={toggleNotifications}
          disabled={isToggling}
        >
          {notificationsEnabled ? (
            <Bell size={22} color={colors.textPrimary} />
          ) : (
            <BellOff size={22} color={colors.textMuted} />
          )}
        </Pressable>
      )}
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
  notificationButton: {
    padding: 8
  },
  creatorActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  actionButton: {
    padding: 8
  }
});
