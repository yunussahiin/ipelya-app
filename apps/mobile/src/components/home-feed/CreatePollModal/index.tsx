/**
 * CreatePollModal Component
 *
 * Amaç: Anket oluşturma modal'ı
 *
 * Özellikler:
 * - Poll question input
 * - Dynamic options (2-6)
 * - Multiple choice toggle
 * - Expiration date picker
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
  ActivityIndicator,
  ScrollView,
  Switch
} from "react-native";
import * as Haptics from "expo-haptics";
import { X, Plus, Trash2, BarChart3, Clock } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { createPoll } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePollModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const EXPIRATION_OPTIONS = [
  { label: "1 Saat", hours: 1 },
  { label: "6 Saat", hours: 6 },
  { label: "24 Saat", hours: 24 },
  { label: "3 Gün", hours: 72 },
  { label: "1 Hafta", hours: 168 }
];

export function CreatePollModal({ visible, onDismiss, onSuccess }: CreatePollModalProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Add option
  const handleAddOption = () => {
    if (options.length < 6) {
      Haptics.selectionAsync();
      setOptions([...options, ""]);
    }
  };

  // Remove option
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      Haptics.selectionAsync();
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  // Update option
  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Validate form
  const isValid = () => {
    if (!question.trim()) return false;
    const filledOptions = options.filter((opt) => opt.trim());
    return filledOptions.length >= 2;
  };

  // Reset form
  const resetForm = () => {
    setQuestion("");
    setOptions(["", ""]);
    setMultipleChoice(false);
    setExpirationHours(24);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert("❌ Hata", "Lütfen soru ve en az 2 seçenek girin.");
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const response = await createPoll(supabaseUrl, accessToken, {
        question: question.trim(),
        options: options.filter((opt) => opt.trim()),
        multiple_choice: multipleChoice,
        expires_at: expiresAt.toISOString()
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Başarılı", "Anket oluşturuldu!");
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        onSuccess?.();
        onDismiss();
      } else {
        Alert.alert("❌ Hata", response.error || "Anket oluşturulamadı");
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
              <BarChart3 size={20} color={colors.accent} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Anket Oluştur</Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Question input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Soru</Text>
              <TextInput
                style={[
                  styles.questionInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                    color: colors.textPrimary
                  }
                ]}
                value={question}
                onChangeText={setQuestion}
                placeholder="Sorunuzu yazın..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </View>

            {/* Options */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Seçenekler ({options.length}/6)
              </Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    style={[
                      styles.optionInput,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceAlt,
                        color: colors.textPrimary
                      }
                    ]}
                    value={option}
                    onChangeText={(value) => handleUpdateOption(index, value)}
                    placeholder={`Seçenek ${index + 1}`}
                    placeholderTextColor={colors.textMuted}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Pressable
                      onPress={() => handleRemoveOption(index)}
                      style={[styles.removeButton, { backgroundColor: colors.warning + "20" }]}
                    >
                      <Trash2 size={18} color={colors.warning} />
                    </Pressable>
                  )}
                </View>
              ))}
              {options.length < 6 && (
                <Pressable
                  onPress={handleAddOption}
                  style={[styles.addButton, { borderColor: colors.accent }]}
                >
                  <Plus size={18} color={colors.accent} />
                  <Text style={[styles.addButtonText, { color: colors.accent }]}>Seçenek Ekle</Text>
                </Pressable>
              )}
            </View>

            {/* Multiple choice toggle */}
            <View style={[styles.toggleRow, { borderColor: colors.border }]}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                Çoklu seçim izin ver
              </Text>
              <Switch
                value={multipleChoice}
                onValueChange={setMultipleChoice}
                trackColor={{ false: colors.border, true: colors.accent + "50" }}
                thumbColor={multipleChoice ? colors.accent : colors.textMuted}
              />
            </View>

            {/* Expiration */}
            <View style={styles.section}>
              <View style={styles.expirationHeader}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.label, { color: colors.textSecondary }]}>Süre</Text>
              </View>
              <View style={styles.expirationOptions}>
                {EXPIRATION_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.hours}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setExpirationHours(opt.hours);
                    }}
                    style={[
                      styles.expirationOption,
                      { borderColor: colors.border },
                      expirationHours === opt.hours && {
                        borderColor: colors.accent,
                        backgroundColor: colors.accent + "15"
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.expirationText,
                        {
                          color: expirationHours === opt.hours ? colors.accent : colors.textPrimary
                        }
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={!isValid() || loading}
              style={[
                styles.submitButton,
                { backgroundColor: colors.accent },
                (!isValid() || loading) && { opacity: 0.5 }
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Anketi Oluştur</Text>
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
    borderTopRightRadius: 24,
    maxHeight: "90%"
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
  content: {
    padding: 16
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8
  },
  questionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15
  },
  removeButton: {
    padding: 10,
    borderRadius: 10
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500"
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "500"
  },
  expirationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 12
  },
  expirationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  expirationOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20
  },
  expirationText: {
    fontSize: 13,
    fontWeight: "500"
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
