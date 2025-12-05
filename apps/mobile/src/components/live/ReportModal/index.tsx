/**
 * Report Modal
 * Kullanıcı şikayet gönderme modal'ı
 * Hem viewer hem de host tarafından kullanılabilir
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useReport, REPORT_REASONS, type ReportReason } from "@/hooks/live";

interface ReportModalProps {
  visible: boolean;
  sessionId: string;
  /** Şikayet edilen kullanıcının ID'si */
  reportedUserId: string;
  /** Şikayet edilen kullanıcının adı (gösterim için) */
  reportedUserName?: string;
  onClose: () => void;
  /** Şikayet başarıyla gönderildiğinde */
  onSuccess?: () => void;
}

export function ReportModal({
  visible,
  sessionId,
  reportedUserId,
  reportedUserName,
  onClose,
  onSuccess
}: ReportModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { submitReport, isSubmitting } = useReport();

  // State
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");

  // Reset state on close
  const handleClose = useCallback(() => {
    setSelectedReason(null);
    setDescription("");
    onClose();
  }, [onClose]);

  // Submit report
  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return;

    const result = await submitReport({
      sessionId,
      reportedUserId,
      reason: selectedReason,
      description: description.trim() || undefined
    });

    if (result.success) {
      handleClose();
      onSuccess?.();
    }
  }, [
    selectedReason,
    description,
    sessionId,
    reportedUserId,
    submitReport,
    handleClose,
    onSuccess
  ]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.modal, { backgroundColor: colors.surface }]}>
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="flag" size={24} color="#DC2626" />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Şikayet Et</Text>
                {reportedUserName && (
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {reportedUserName}
                  </Text>
                )}
              </View>

              {/* Reason Selection */}
              <ScrollView
                style={styles.reasonList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.reasonListContent}
              >
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  Şikayet Nedeni
                </Text>
                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason.value}
                    style={[
                      styles.reasonItem,
                      { backgroundColor: colors.background },
                      selectedReason === reason.value && {
                        backgroundColor: "#FEE2E2",
                        borderColor: "#DC2626",
                        borderWidth: 1
                      }
                    ]}
                    onPress={() => setSelectedReason(reason.value)}
                  >
                    <View
                      style={[
                        styles.reasonIcon,
                        {
                          backgroundColor:
                            selectedReason === reason.value ? "#DC2626" : colors.textMuted + "20"
                        }
                      ]}
                    >
                      <Ionicons
                        name={reason.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={selectedReason === reason.value ? "#fff" : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        { color: selectedReason === reason.value ? "#DC2626" : colors.textPrimary }
                      ]}
                    >
                      {reason.label}
                    </Text>
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark-circle" size={22} color="#DC2626" />
                    )}
                  </Pressable>
                ))}

                {/* Description Input */}
                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 16 }]}>
                  Ek Açıklama (Opsiyonel)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.textMuted + "30"
                    }
                  ]}
                  placeholder="Detaylı açıklama yazabilirsiniz..."
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {description.length}/500
                </Text>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttons}>
                <Pressable
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: colors.textMuted + "30" }
                  ]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.button,
                    styles.submitButton,
                    { backgroundColor: selectedReason ? "#DC2626" : colors.textMuted + "50" }
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Gönder</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end"
  },
  container: {
    width: "100%"
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%"
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4
  },
  reasonList: {
    maxHeight: 320
  },
  reasonListContent: {
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500"
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4
  },
  buttons: {
    flexDirection: "row",
    padding: 20,
    gap: 12
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8
  },
  cancelButton: {
    borderWidth: 1
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600"
  },
  submitButton: {},
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});

export default ReportModal;
