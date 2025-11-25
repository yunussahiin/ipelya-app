/**
 * TextPostCreator Component (eski adı: MiniPostCreator)
 *
 * Amaç: Metin tabanlı gönderi oluşturma - ContentCreator tab'ı olarak
 *
 * 2 Mod:
 * 1. Renkli Kart - Kısa metin (280 karakter), renkli arka plan
 * 2. Metin - Uzun yazı (2000 karakter), düz görünüm
 *
 * Özellikler:
 * - Mod seçimi (Renkli Kart / Metin)
 * - Background color selection (sadece Renkli Kart modunda)
 * - Emoji picker
 * - Live preview
 * - API entegrasyonu
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { X, Palette, Type, Sparkles, BarChart3, Plus, Trash2 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { createMiniPost, createPost } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import type { CreatedContent } from "./index";

interface MiniPostCreatorProps {
  onComplete: (content: CreatedContent) => void;
  onClose: () => void;
}

// Post türleri
type PostMode = "card" | "text";

const POST_MODES: { id: PostMode; label: string; icon: typeof Sparkles; description: string }[] = [
  { id: "card", label: "Vibe", icon: Sparkles, description: "Kısa ve dikkat çekici" },
  { id: "text", label: "Metin", icon: Type, description: "Uzun yazı ve anket" }
];

const BACKGROUND_COLORS = [
  { id: "gradient_pink", colors: ["#FF6B9D", "#FF8E72"], label: "Pembe" },
  { id: "gradient_blue", colors: ["#4ECDC4", "#44A3AA"], label: "Mavi" },
  { id: "gradient_purple", colors: ["#A78BFA", "#8B5CF6"], label: "Mor" },
  { id: "gradient_orange", colors: ["#F59E0B", "#EF4444"], label: "Turuncu" },
  { id: "gradient_green", colors: ["#10B981", "#059669"], label: "Yeşil" },
  { id: "solid_dark", colors: ["#1F2937", "#1F2937"], label: "Koyu" }
];

const QUICK_EMOJIS = ["😊", "❤️", "🔥", "✨", "💪", "🎉", "💭", "🌟"];

export function MiniPostCreator({ onComplete, onClose }: MiniPostCreatorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<PostMode>("card");
  const [content, setContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false); // Double submit engelleme

  // Anket state (sadece metin modunda)
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Mod'a göre karakter limiti
  const MAX_LENGTH = mode === "card" ? 100 : 480;

  // Add emoji to content
  const handleAddEmoji = (emoji: string) => {
    if (content.length + emoji.length <= MAX_LENGTH) {
      Haptics.selectionAsync();
      setContent(content + emoji);
    }
  };

  // Mod değiştirme
  const handleModeChange = (newMode: PostMode) => {
    Haptics.selectionAsync();
    setMode(newMode);
    // Karakter limitini aşıyorsa kırp
    if (newMode === "card" && content.length > 100) {
      setContent(content.slice(0, 100));
    }
    // Vibe moduna geçince anketi kapat
    if (newMode === "card") {
      setShowPoll(false);
      setPollOptions(["", ""]);
    }
  };

  // Anket toggle
  const togglePoll = () => {
    Haptics.selectionAsync();
    if (showPoll) {
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    } else {
      setShowPoll(true);
    }
  };

  // Anket seçenek ekle
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      Haptics.selectionAsync();
      setPollOptions([...pollOptions, ""]);
    }
  };

  // Anket seçenek sil
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      Haptics.selectionAsync();
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Anket seçenek güncelle
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Submit handler
  const handleSubmit = async () => {
    // Double submit engelle - ref ile anında kontrol (state'ten önce!)
    if (isSubmitting.current) {
      console.log("⚠️ Double submit blocked by ref");
      return;
    }
    if (loading) {
      console.log("⚠️ Double submit blocked by loading state");
      return;
    }

    // Hemen ref'i set et - bu senkron olduğu için anında çalışır
    isSubmitting.current = true;
    // Loading state'i de hemen set et
    setLoading(true);

    if (!content.trim()) {
      isSubmitting.current = false;
      setLoading(false);
      Alert.alert("❌ Hata", "Lütfen bir şeyler yazın.");
      return;
    }

    // Metin modunda anket varsa seçenekleri kontrol et
    if (mode === "text" && showPoll) {
      const filledOptions = pollOptions.filter((opt) => opt.trim());
      if (filledOptions.length < 2) {
        isSubmitting.current = false;
        setLoading(false);
        Alert.alert("❌ Hata", "Anket için en az 2 seçenek girin.");
        return;
      }
    }

    console.log("📤 Submitting post...", { mode, showPoll });
    try {
      let response;

      if (mode === "card") {
        // Vibe modu - createMiniPost API
        response = await createMiniPost(supabaseUrl, accessToken, {
          content: content.trim(),
          background_style: selectedBg.id
        });
      } else {
        // Metin modu - createPost API
        if (showPoll) {
          // Anket varsa - sadece poll oluştur (post oluşturma)
          // content: genel metin/konu başlığı (caption olarak kaydedilir)
          // pollQuestion: anket sorusu (question olarak kaydedilir)
          const question = pollQuestion.trim() || content.trim(); // Anket sorusu yoksa content kullan
          console.log("📊 Creating poll only...", { caption: content.trim(), question });
          response = await createPost(supabaseUrl, accessToken, {
            caption: content.trim(),
            poll_question: question,
            poll_options: pollOptions.filter((opt) => opt.trim())
          });
          console.log("📊 Poll response:", response.success);
        } else {
          // Anket yoksa - normal standard post
          console.log("📝 Creating standard post...");
          response = await createPost(supabaseUrl, accessToken, {
            caption: content.trim(),
            post_type: "standard"
          });
          console.log("📝 Post response:", response.success);
        }
      }

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        onComplete({
          type: mode === "card" ? "mini" : "post",
          caption: content.trim()
        });
      } else {
        Alert.alert("❌ Hata", response.error || "Post oluşturulamadı");
      }
    } catch (error) {
      Alert.alert("❌ Hata", "Bir sorun oluştu");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.backButton}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Yazı</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!content.trim() || loading || isSubmitting.current}
          style={[
            styles.shareButton,
            (!content.trim() || loading || isSubmitting.current) && { opacity: 0.5 }
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[styles.shareButtonText, { color: colors.accent }]}>Paylaş</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mod Seçici */}
        <View style={styles.modeSelector}>
          {POST_MODES.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => handleModeChange(m.id)}
                style={[
                  styles.modeButton,
                  { backgroundColor: isActive ? colors.accent + "20" : colors.surfaceAlt }
                ]}
              >
                <Icon size={20} color={isActive ? colors.accent : colors.textSecondary} />
                <View>
                  <Text
                    style={[
                      styles.modeLabel,
                      { color: isActive ? colors.accent : colors.textPrimary }
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text style={[styles.modeDescription, { color: colors.textMuted }]}>
                    {m.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Preview - Sadece Renkli Kart modunda */}
        {mode === "card" && (
          <View style={[styles.preview, { backgroundColor: selectedBg.colors[0] }]}>
            <Text style={styles.previewText}>{content || "Bir şeyler yaz..."}</Text>
          </View>
        )}

        {/* Content input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                minHeight: mode === "text" ? 200 : 100
              }
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={mode === "card" ? "Kısa bir şey yaz..." : "Ne düşünüyorsun?"}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MAX_LENGTH}
            autoFocus
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>
            {content.length}/{MAX_LENGTH}
          </Text>
        </View>

        {/* Quick emojis - Sadece Vibe modunda */}
        {mode === "card" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.emojisScrollView}
            contentContainerStyle={styles.emojisContainer}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleAddEmoji(emoji)}
                style={styles.emojiButton}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Background selection - Sadece Vibe modunda */}
        {mode === "card" && (
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
        )}

        {/* Anket butonu ve içeriği - Sadece Metin modunda */}
        {mode === "text" && (
          <>
            <Pressable
              onPress={togglePoll}
              style={[
                styles.pollToggle,
                { backgroundColor: showPoll ? colors.accent + "20" : colors.surfaceAlt }
              ]}
            >
              <BarChart3 size={20} color={showPoll ? colors.accent : colors.textSecondary} />
              <Text
                style={[
                  styles.pollToggleText,
                  { color: showPoll ? colors.accent : colors.textPrimary }
                ]}
              >
                {showPoll ? "Anketi Kaldır" : "Anket Ekle"}
              </Text>
            </Pressable>

            {/* Anket seçenekleri */}
            {showPoll && (
              <View style={[styles.pollContainer, { borderColor: colors.border }]}>
                {/* Anket sorusu */}
                <TextInput
                  style={[
                    styles.pollQuestionInput,
                    {
                      backgroundColor: colors.surfaceAlt,
                      color: colors.textPrimary,
                      borderColor: colors.border
                    }
                  ]}
                  placeholder="Anket sorusu..."
                  placeholderTextColor={colors.textMuted}
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                  maxLength={100}
                />

                {/* Seçenekler */}
                {pollOptions.map((option, index) => (
                  <View key={index} style={styles.pollOptionRow}>
                    <TextInput
                      style={[
                        styles.pollOptionInput,
                        {
                          backgroundColor: colors.surfaceAlt,
                          color: colors.textPrimary,
                          borderColor: colors.border
                        }
                      ]}
                      placeholder={`Seçenek ${index + 1}`}
                      placeholderTextColor={colors.textMuted}
                      value={option}
                      onChangeText={(text) => updatePollOption(index, text)}
                      maxLength={50}
                    />
                    {pollOptions.length > 2 && (
                      <Pressable
                        onPress={() => removePollOption(index)}
                        style={[
                          styles.pollRemoveButton,
                          { backgroundColor: colors.warning + "20" }
                        ]}
                      >
                        <Trash2 size={16} color={colors.warning} />
                      </Pressable>
                    )}
                  </View>
                ))}

                {pollOptions.length < 4 && (
                  <Pressable
                    onPress={addPollOption}
                    style={[styles.pollAddButton, { borderColor: colors.accent }]}
                  >
                    <Plus size={16} color={colors.accent} />
                    <Text style={[styles.pollAddButtonText, { color: colors.accent }]}>
                      Seçenek Ekle
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  modeSelector: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600"
  },
  modeDescription: {
    fontSize: 11,
    marginTop: 2
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600"
  },
  shareButton: {
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600"
  },
  content: {
    flex: 1
  },
  preview: {
    margin: 16,
    padding: 32,
    borderRadius: 20,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center"
  },
  previewText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 30
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top"
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 6
  },
  emojisScrollView: {
    marginBottom: 16
  },
  emojisContainer: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16
  },
  emojiButton: {
    padding: 8
  },
  emoji: {
    fontSize: 28
  },
  bgSection: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  bgHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12
  },
  bgLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  bgOptions: {
    flexDirection: "row",
    gap: 12
  },
  bgOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
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
  // Anket stilleri
  pollToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  pollToggleText: {
    fontSize: 14,
    fontWeight: "500"
  },
  pollContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12
  },
  pollQuestionInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 16
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  pollOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14
  },
  pollRemoveButton: {
    padding: 8,
    borderRadius: 8
  },
  pollAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 4
  },
  pollAddButtonText: {
    fontSize: 13,
    fontWeight: "500"
  }
});
