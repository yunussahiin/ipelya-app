/**
 * Moderation Controls
 * Host için moderasyon araçları: Kick, Ban, Promote, Report
 */

import React, { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

interface ModerationControlsProps {
  sessionId: string;
  targetUserId: string;
  targetUserName: string;
  isHost: boolean;
  isAudioRoom?: boolean;
  onKicked?: () => void;
  onBanned?: () => void;
  onPromoted?: () => void;
  onReported?: () => void;
}

export function ModerationControls({
  sessionId,
  targetUserId,
  targetUserName,
  isHost,
  isAudioRoom = false,
  onKicked,
  onBanned,
  onPromoted,
  onReported
}: ModerationControlsProps) {
  const { colors } = useTheme();
  const [showBanModal, setShowBanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Kick user
  const handleKick = useCallback(async () => {
    Alert.alert("Kullanıcıyı At", `${targetUserName} yayından atılsın mı?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "At",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.functions.invoke("kick-participant", {
              body: { sessionId, targetUserId }
            });
            if (error) throw error;
            onKicked?.();
          } catch (err) {
            Alert.alert("Hata", "Kullanıcı atılamadı");
          } finally {
            setIsLoading(false);
          }
        }
      }
    ]);
  }, [sessionId, targetUserId, targetUserName, onKicked]);

  // Ban user
  const handleBan = useCallback(async () => {
    if (!banReason.trim()) {
      Alert.alert("Hata", "Lütfen bir neden girin");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("ban-participant", {
        body: { sessionId, targetUserId, reason: banReason }
      });
      if (error) throw error;
      setShowBanModal(false);
      setBanReason("");
      onBanned?.();
    } catch (err) {
      Alert.alert("Hata", "Kullanıcı yasaklanamadı");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, targetUserId, banReason, onBanned]);

  // Promote to speaker (audio room only)
  const handlePromote = useCallback(async () => {
    Alert.alert("Konuşmacı Yap", `${targetUserName} konuşmacı yapılsın mı?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Onayla",
        onPress: async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.functions.invoke("promote-to-speaker", {
              body: { sessionId, targetUserId }
            });
            if (error) throw error;
            onPromoted?.();
          } catch (err) {
            Alert.alert("Hata", "Kullanıcı konuşmacı yapılamadı");
          } finally {
            setIsLoading(false);
          }
        }
      }
    ]);
  }, [sessionId, targetUserId, targetUserName, onPromoted]);

  // Report user
  const handleReport = useCallback(async () => {
    if (!reportReason.trim()) {
      Alert.alert("Hata", "Lütfen bir neden girin");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("report-live-user", {
        body: { sessionId, targetUserId, reason: reportReason }
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportReason("");
      onReported?.();
      Alert.alert("Başarılı", "Şikayetiniz alındı");
    } catch (err) {
      Alert.alert("Hata", "Şikayet gönderilemedi");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, targetUserId, reportReason, onReported]);

  if (!isHost) {
    // Non-host can only report
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.surface }]}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.buttonText, { color: colors.textMuted }]}>Şikayet Et</Text>
        </Pressable>

        {/* Report Modal */}
        <Modal visible={showReportModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Kullanıcıyı Şikayet Et
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.background, color: colors.textPrimary }
                ]}
                placeholder="Şikayet nedeniniz..."
                placeholderTextColor={colors.textMuted}
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.background }]}
                  onPress={() => setShowReportModal(false)}
                >
                  <Text style={{ color: colors.textPrimary }}>İptal</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={handleReport}
                  disabled={isLoading}
                >
                  <Text style={{ color: "#fff" }}>{isLoading ? "Gönderiliyor..." : "Gönder"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Host actions */}
      <Pressable
        style={[styles.button, { backgroundColor: "#FEE2E2" }]}
        onPress={handleKick}
        disabled={isLoading}
      >
        <Ionicons name="exit-outline" size={18} color="#EF4444" />
        <Text style={[styles.buttonText, { color: "#EF4444" }]}>At</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "#FEE2E2" }]}
        onPress={() => setShowBanModal(true)}
        disabled={isLoading}
      >
        <Ionicons name="ban-outline" size={18} color="#DC2626" />
        <Text style={[styles.buttonText, { color: "#DC2626" }]}>Yasakla</Text>
      </Pressable>

      {isAudioRoom && (
        <Pressable
          style={[styles.button, { backgroundColor: "#DCFCE7" }]}
          onPress={handlePromote}
          disabled={isLoading}
        >
          <Ionicons name="mic-outline" size={18} color="#16A34A" />
          <Text style={[styles.buttonText, { color: "#16A34A" }]}>Konuşmacı Yap</Text>
        </Pressable>
      )}

      {/* Ban Modal */}
      <Modal visible={showBanModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Kullanıcıyı Yasakla
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              {targetUserName} bu yayından yasaklanacak
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.background, color: colors.textPrimary }
              ]}
              placeholder="Yasaklama nedeni..."
              placeholderTextColor={colors.textMuted}
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={2}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowBanModal(false)}
              >
                <Text style={{ color: colors.textPrimary }}>İptal</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: "#DC2626" }]}
                onPress={handleBan}
                disabled={isLoading}
              >
                <Text style={{ color: "#fff" }}>{isLoading ? "Yasaklanıyor..." : "Yasakla"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center"
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center"
  },
  input: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  }
});

export default ModerationControls;
