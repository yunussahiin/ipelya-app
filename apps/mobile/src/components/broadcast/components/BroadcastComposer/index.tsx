/**
 * BroadcastComposer
 *
 * Amaç: Creator mesaj gönderme alanı
 * Tarih: 2025-12-02 (V3 - Medya desteği)
 *
 * Özellikler:
 * - Metin mesajı
 * - Resim/Video/Ses mesajı
 * - Anket oluşturma
 * - Zamanlanmış mesaj
 */

import { useState, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { X, Mic, Clock } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useSendBroadcastMessage, useScheduleBroadcastMessage } from "@/hooks/messaging";
import { useToast } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { BroadcastMediaPicker, SelectedMedia } from "../BroadcastMediaPicker";
import { supabase } from "@/lib/supabaseClient";

// =============================================
// TYPES
// =============================================

interface BroadcastComposerProps {
  channelId: string;
  onOpenSchedule?: () => void;
  scheduledDate?: Date | null;
  onClearSchedule?: () => void;
}

// =============================================
// COMPONENT
// =============================================

export function BroadcastComposer({
  channelId,
  onOpenSchedule,
  scheduledDate: externalScheduledDate,
  onClearSchedule
}: BroadcastComposerProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use external scheduled date if provided
  const scheduledDate = externalScheduledDate;

  const { mutate: sendMessage, isPending } = useSendBroadcastMessage();
  const { mutate: scheduleMessage, isPending: isScheduling } = useScheduleBroadcastMessage();

  // Medya yükle
  const uploadMedia = useCallback(
    async (media: SelectedMedia): Promise<string | null> => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) return null;

        const fileExt = media.uri.split(".").pop() || "jpg";
        const fileName = `${channelId}/${Date.now()}.${fileExt}`;
        const filePath = `broadcast-media/${fileName}`;

        // Fetch file as blob
        const response = await fetch(media.uri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { error } = await supabase.storage.from("media").upload(filePath, blob, {
          contentType: media.mimeType || "application/octet-stream",
          upsert: false
        });

        if (error) {
          console.error("Upload error:", error);
          return null;
        }

        // Get public URL
        const {
          data: { publicUrl }
        } = supabase.storage.from("media").getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error("Upload error:", error);
        return null;
      }
    },
    [channelId]
  );

  // Mesaj gönder
  const handleSend = useCallback(async () => {
    if ((!text.trim() && !selectedMedia) || isPending || isUploading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let mediaUrl: string | undefined;
    let contentType = "text";

    // Medya varsa yükle
    if (selectedMedia) {
      setIsUploading(true);
      mediaUrl = (await uploadMedia(selectedMedia)) || undefined;
      setIsUploading(false);

      if (!mediaUrl) {
        showToast({ type: "error", message: "Medya yüklenemedi" });
        return;
      }

      contentType = selectedMedia.type === "voice" ? "voice" : selectedMedia.type;
    }

    sendMessage({
      channel_id: channelId,
      content: text.trim() || undefined,
      content_type: contentType,
      media_url: mediaUrl,
      media_metadata: selectedMedia
        ? {
            type: selectedMedia.type,
            duration: selectedMedia.duration,
            width: selectedMedia.width,
            height: selectedMedia.height
          }
        : undefined
    });

    setText("");
    setSelectedMedia(null);
  }, [text, selectedMedia, channelId, sendMessage, isPending, isUploading, uploadMedia, showToast]);

  // Medya seçildi
  const handleMediaSelect = useCallback((media: SelectedMedia) => {
    setSelectedMedia(media);
    setShowMediaPicker(false);
  }, []);

  // Medya kaldır
  const handleRemoveMedia = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  // Anket oluştur
  const handleCreatePoll = useCallback(() => {
    setShowPollCreator(true);
    // TODO: Poll creator modal
  }, []);

  // Zamanlanmış mesaj gönder
  const handleScheduleSend = useCallback(async () => {
    if (!scheduledDate || (!text.trim() && !selectedMedia)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let mediaUrl: string | undefined;
    let contentType = "text";

    if (selectedMedia) {
      setIsUploading(true);
      mediaUrl = (await uploadMedia(selectedMedia)) || undefined;
      setIsUploading(false);

      if (!mediaUrl) {
        showToast({ type: "error", message: "Medya yüklenemedi" });
        return;
      }
      contentType = selectedMedia.type;
    }

    scheduleMessage(
      {
        channelId,
        content: text.trim() || undefined,
        contentType,
        mediaUrl,
        scheduledAt: scheduledDate
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Mesaj zamanlandı" });
          setText("");
          setSelectedMedia(null);
          onClearSchedule?.();
        },
        onError: (err) => showToast({ type: "error", message: err.message })
      }
    );
  }, [
    scheduledDate,
    text,
    selectedMedia,
    channelId,
    scheduleMessage,
    uploadMedia,
    showToast,
    onClearSchedule
  ]);

  const hasContent = text.trim().length > 0 || selectedMedia !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Seçili medya önizleme */}
      {selectedMedia && (
        <View style={styles.mediaPreview}>
          {selectedMedia.type === "image" && (
            <Image
              source={{ uri: selectedMedia.uri }}
              style={styles.previewImage}
              contentFit="cover"
            />
          )}
          {selectedMedia.type === "video" && (
            <View
              style={[
                styles.previewImage,
                { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }
              ]}
            >
              <Ionicons name="videocam" size={24} color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>Video</Text>
            </View>
          )}
          {selectedMedia.type === "voice" && (
            <View
              style={[
                styles.previewImage,
                { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }
              ]}
            >
              <Mic size={24} color={colors.accent} />
              <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                {Math.round((selectedMedia.duration || 0) / 1000)}s
              </Text>
            </View>
          )}
          <Pressable style={styles.removeMedia} onPress={handleRemoveMedia}>
            <X size={14} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Zamanlanmış mesaj göstergesi */}
      {scheduledDate && (
        <View style={[styles.scheduledBanner, { backgroundColor: colors.surface }]}>
          <Clock size={14} color={colors.accent} />
          <Text style={[styles.scheduledText, { color: colors.textPrimary }]}>
            {scheduledDate.toLocaleDateString("tr-TR")}{" "}
            {scheduledDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Pressable onPress={onClearSchedule}>
            <X size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        {/* Media button */}
        <Pressable style={styles.actionButton} onPress={() => setShowMediaPicker(true)}>
          <Ionicons name="image-outline" size={24} color={colors.accent} />
        </Pressable>

        {/* Poll button */}
        <Pressable style={styles.actionButton} onPress={handleCreatePoll}>
          <Ionicons name="stats-chart-outline" size={22} color={colors.accent} />
        </Pressable>

        {/* Schedule button */}
        <Pressable
          style={styles.actionButton}
          onPress={onOpenSchedule}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Clock size={22} color={scheduledDate ? colors.accent : colors.textMuted} />
        </Pressable>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Duyuru yaz..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
        </View>

        {/* Send button */}
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: hasContent ? colors.accent : colors.surface }
          ]}
          onPress={hasContent ? (scheduledDate ? handleScheduleSend : handleSend) : undefined}
          disabled={!hasContent || isPending || isUploading || isScheduling}
        >
          {isUploading || isScheduling ? (
            <Ionicons name="hourglass" size={20} color="#fff" />
          ) : scheduledDate ? (
            <Clock size={20} color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={hasContent ? "#fff" : colors.textMuted} />
          )}
        </Pressable>
      </View>

      {/* Media Picker */}
      <BroadcastMediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)"
  },
  mediaPreview: {
    marginBottom: 8,
    marginLeft: 8,
    position: "relative",
    alignSelf: "flex-start"
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  removeMedia: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  actionButton: {
    padding: 8
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    minHeight: 44,
    maxHeight: 120
  },
  input: {
    fontSize: 16,
    maxHeight: 100
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  scheduledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 8
  },
  scheduledText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500"
  }
});

export default BroadcastComposer;
