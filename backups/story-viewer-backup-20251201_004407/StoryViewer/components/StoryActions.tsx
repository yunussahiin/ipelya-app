/**
 * StoryActions Component
 * Alt kısımdaki reply input ve action butonları
 *
 * ⚠️ SADECE BAŞKASININ STORY'SİNDE GÖSTERİLİR
 * - Mesaj gönder input'u
 * - Kalp butonu
 * - Paylaş butonu
 *
 * Kendi story'mizde bu component KULLANILMAZ!
 * Kendi story'mizde sadece StoryInsightsSheet açılır.
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Heart, Send } from "lucide-react-native";

interface StoryActionsProps {
  paddingBottom: number;
  onReply?: () => void;
  onLike?: () => void;
  onShare?: () => void;
}

function StoryActionsComponent({ paddingBottom, onReply, onLike, onShare }: StoryActionsProps) {
  return (
    <View style={[styles.container, { paddingBottom }]}>
      <Pressable style={styles.replyButton} onPress={onReply}>
        <Text style={styles.replyText}>Mesaj gönder...</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onLike}>
        <Heart size={28} color="#FFF" />
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onShare}>
        <Send size={26} color="#FFF" />
      </Pressable>
    </View>
  );
}

export const StoryActions = memo(StoryActionsComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    zIndex: 10
  },
  replyButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  replyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14
  },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  }
});
