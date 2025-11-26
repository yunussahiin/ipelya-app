/**
 * MediaGallery
 *
 * Amaç: Sohbetteki medya galerisi
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 48) / 3;

interface MediaGalleryProps {
  conversationId: string;
}

export function MediaGallery({ conversationId }: MediaGalleryProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Medya mesajlarını getir
  const { data: mediaMessages } = useQuery({
    queryKey: ["conversation-media", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, media_url, media_thumbnail_url, content_type")
        .eq("conversation_id", conversationId)
        .in("content_type", ["image", "video"])
        .order("created_at", { ascending: false })
        .limit(9);

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId
  });

  if (!mediaMessages || mediaMessages.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Medya</Text>
        <Pressable onPress={() => router.push(`/messages/${conversationId}/media`)}>
          <Text style={[styles.seeAll, { color: colors.accent }]}>Tümünü Gör</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {mediaMessages.slice(0, 9).map((media) => (
          <Pressable key={media.id} style={styles.mediaItem}>
            <Image
              source={{ uri: media.media_thumbnail_url || media.media_url }}
              style={[styles.mediaImage, { backgroundColor: colors.backgroundRaised }]}
              contentFit="cover"
            />
            {media.content_type === "video" && (
              <View style={styles.videoOverlay}>
                <Ionicons name="play" size={24} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    padding: 12
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  seeAll: {
    fontSize: 14
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: "hidden"
  },
  mediaImage: {
    width: "100%",
    height: "100%"
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)"
  }
});
