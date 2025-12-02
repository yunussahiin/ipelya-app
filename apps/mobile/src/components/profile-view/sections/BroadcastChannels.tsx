/**
 * BroadcastChannels Section
 *
 * Amaç: Creator'ın yayın kanallarını profil sayfasında gösterir
 * Tarih: 2025-12-02
 */

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Radio, ChevronRight, Users } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

interface BroadcastChannel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  access_type: "public" | "subscribers_only" | "tier_specific";
}

interface BroadcastChannelsProps {
  userId: string;
  isCreator: boolean;
  isOwnProfile: boolean;
}

export function BroadcastChannels({ userId, isCreator, isOwnProfile }: BroadcastChannelsProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isCreator && userId) {
      loadChannels();
    } else {
      setIsLoading(false);
    }
  }, [userId, isCreator]);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("broadcast_channels")
        .select("id, name, description, avatar_url, member_count, access_type")
        .eq("creator_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setChannels(data);
      }
    } catch (e) {
      console.error("Broadcast channels load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Creator değilse veya kanal yoksa gösterme
  if (!isCreator || isLoading) return null;

  // Kendi profiliyse ve kanal yoksa "Kanal Oluştur" butonu göster
  if (isOwnProfile && channels.length === 0) {
    return (
      <View style={[styles.container, { borderColor: colors.border }]}>
        <Pressable
          style={[styles.createButton, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/(broadcast)/create")}
        >
          <Radio size={20} color={colors.accent} />
          <Text style={[styles.createText, { color: colors.textPrimary }]}>
            Yayın Kanalı Oluştur
          </Text>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>
      </View>
    );
  }

  // Kanal yoksa hiçbir şey gösterme
  if (channels.length === 0) return null;

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <Radio size={18} color={colors.textPrimary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Yayın Kanalları</Text>
      </View>

      {channels.map((channel) => (
        <Pressable
          key={channel.id}
          style={[styles.channelItem, { backgroundColor: colors.surface }]}
          onPress={() => router.push(`/(broadcast)/${channel.id}`)}
        >
          <Image
            source={{ uri: channel.avatar_url || undefined }}
            style={[styles.channelAvatar, { backgroundColor: colors.backgroundRaised }]}
            contentFit="cover"
          />
          <View style={styles.channelInfo}>
            <Text style={[styles.channelName, { color: colors.textPrimary }]} numberOfLines={1}>
              {channel.name}
            </Text>
            <View style={styles.channelMeta}>
              <Users size={12} color={colors.textMuted} />
              <Text style={[styles.memberCount, { color: colors.textMuted }]}>
                {channel.member_count} üye
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>
      ))}

      {/* Kendi profiliyse "Tümünü Gör" veya "Yeni Kanal" */}
      {isOwnProfile && (
        <Pressable style={styles.footerButton} onPress={() => router.push("/(broadcast)")}>
          <Text style={[styles.footerText, { color: colors.accent }]}>Tüm Kanalları Yönet</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  title: {
    fontSize: 15,
    fontWeight: "600"
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  channelAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10
  },
  channelInfo: {
    flex: 1
  },
  channelName: {
    fontSize: 15,
    fontWeight: "500"
  },
  channelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2
  },
  memberCount: {
    fontSize: 13
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12
  },
  createText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500"
  },
  footerButton: {
    paddingVertical: 12,
    alignItems: "center"
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600"
  }
});

export default BroadcastChannels;
