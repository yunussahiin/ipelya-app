/**
 * CreateMiniPostModal Component
 *
 * Amaç: Mini post (kısa metin) oluşturma modal'ı
 *
 * Özellikler:
 * - Short text input (max 280 chars)
 * - Background color selection
 * - Emoji picker
 * - API entegrasyonu
 * - Theme-aware styling
 *
 * Props:
 * - visible: boolean
 * - onDismiss: Dismiss callback
 * - onSuccess: Success callback
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from "react-native";
import * as Haptics from "expo-haptics";
import { X, Type, Palette } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { createMiniPost } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

interface CreateMiniPostModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const BACKGROUND_COLORS = [
  { id: "gradient_pink", colors: ["#FF6B9D", "#FF8E72"], label: "Pembe" },
  { id: "gradient_blue", colors: ["#4ECDC4", "#44A3AA"], label: "Mavi" },
  { id: "gradient_purple", colors: ["#A78BFA", "#8B5CF6"], label: "Mor" },
  { id: "gradient_orange", colors: ["#F59E0B", "#EF4444"], label: "Turuncu" },
  { id: "gradient_green", colors: ["#10B981", "#059669"], label: "Yeşil" },
  { id: "solid_dark", colors: ["#1F2937", "#1F2937"], label: "Koyu" }
];

const QUICK_EMOJIS = ["😊", "❤️", "🔥", "✨", "💪", "🎉", "💭", "🌟"];

export function CreateMiniPostModal({ visible, onDismiss, onSuccess }: CreateMiniPostModalProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  const MAX_LENGTH = 280;

  // Add emoji to content
  const handleAddEmoji = (emoji: string) => {
    if (content.length + emoji.length <= MAX_LENGTH) {
      Haptics.selectionAsync();
      setContent(content + emoji);
    }
  };

  // Reset form
  const resetForm = () => {
    setContent("");
    setSelectedBg(BACKGROUND_COLORS[0]);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("❌ Hata", "Lütfen bir şeyler yazın.");
      return;
    }

    setLoading(true);
    try {
      const response = await createMiniPost(supabaseUrl, accessToken, {
        content: content.trim(),
        background_style: selectedBg.id
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Başarılı", "Mini post paylaşıldı!");
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        onSuccess?.();
        onDismiss();
      } else {
        Alert.alert("❌ Hata", response.error || "Post oluşturulamadı");
      }
    } catch (error) {
      Alert.alert("❌ Hata", "Bir sorun oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View
          style={[styles.modal, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitle}>
              <Type size={20} color={colors.accent} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Mini Post</Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: selectedBg.colors[0] }]}>
            <Text style={styles.previewText}>{content || "Bir şeyler yaz..."}</Text>
          </View>

          {/* Content input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  color: colors.textPrimary
                }
              ]}
              value={content}
              onChangeText={setContent}
              placeholder="Ne düşünüyorsun?"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_LENGTH}
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>
              {content.length}/{MAX_LENGTH}
            </Text>
          </View>

          {/* Quick emojis */}
          <View style={styles.emojisContainer}>
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleAddEmoji(emoji)}
                style={styles.emojiButton}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Background selection */}
          <View style={styles.bgSection}>
            <View style={styles.bgHeader}>
              <Palette size={16} color={colors.textSecondary} />
              <Text style={[styles.bgLabel, { color: colors.textSecondary }]}>Arka Plan</Text>
            </View>
            <View style={styles.bgOptions}>
              {BACKGROUND_COLORS.map((bg) => (
                <Pressable
                  key={bg.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedBg(bg);
                  }}
                  style={[
                    styles.bgOption,
                    { backgroundColor: bg.colors[0] },
                    selectedBg.id === bg.id && styles.bgOptionSelected
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Submit button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={!content.trim() || loading}
              style={[
                styles.submitButton,
                { backgroundColor: selectedBg.colors[0] },
                (!content.trim() || loading) && { opacity: 0.5 }
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Paylaş</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  preview: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center"
  },
  previewText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center"
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top"
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4
  },
  emojisContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  emojiButton: {
    padding: 8
  },
  emoji: {
    fontSize: 24
  },
  bgSection: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  bgHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10
  },
  bgLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  bgOptions: {
    flexDirection: "row",
    gap: 10
  },
  bgOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent"
  },
  bgOptionSelected: {
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  footer: {
    padding: 16,
    paddingBottom: 32
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
