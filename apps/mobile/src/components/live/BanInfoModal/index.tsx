/**
 * Ban Info Modal
 * Kullanıcının ban durumunu gösteren modal
 * Web Ops Dashboard'dan yapılan ban işlemleri için kullanılır
 */

import React from "react";
import { View, Text, Modal, StyleSheet, Pressable, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { type BanInfo, type BanType } from "@/hooks/live";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BanInfoModalProps {
  visible: boolean;
  banInfo: BanInfo | null;
  onClose: () => void;
  /** Kapatınca nereye gidilecek - varsayılan: sadece modal kapanır */
  onDismiss?: () => void;
}

const getBanTypeConfig = (banType: BanType) => {
  switch (banType) {
    case "global":
      return {
        icon: "globe" as const,
        title: "Platform Yasağı",
        color: "#DC2626",
        description: "Tüm canlı yayınlara katılmanız engellenmiştir."
      };
    case "creator":
      return {
        icon: "person-circle" as const,
        title: "Yayıncı Yasağı",
        color: "#F59E0B",
        description: "Bu yayıncının yayınlarına katılmanız engellenmiştir."
      };
    case "session":
    default:
      return {
        icon: "videocam-off" as const,
        title: "Yayın Yasağı",
        color: "#EF4444",
        description: "Bu yayına katılmanız engellenmiştir."
      };
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export function BanInfoModal({ visible, banInfo, onClose, onDismiss }: BanInfoModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!banInfo) return null;

  const config = getBanTypeConfig(banInfo.banType);
  const expiresDate = formatDate(banInfo.expiresAt);
  const createdDate = formatDate(banInfo.createdAt);
  const isPermanent = !banInfo.expiresAt;

  const handleClose = () => {
    onClose();
    onDismiss?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: `${config.color}15` }]}>
              <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon} size={32} color="#fff" />
              </View>
              <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.description, { color: colors.textPrimary }]}>
                {config.description}
              </Text>

              {/* Reason */}
              {banInfo.reason && (
                <View style={[styles.infoRow, { backgroundColor: colors.background }]}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.labelText, { color: colors.textMuted }]}>Neden</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {banInfo.reason}
                  </Text>
                </View>
              )}

              {/* Duration */}
              <View style={[styles.infoRow, { backgroundColor: colors.background }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.labelText, { color: colors.textMuted }]}>Süre</Text>
                </View>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isPermanent ? "#DC2626" : colors.textPrimary }
                  ]}
                >
                  {isPermanent ? "Kalıcı" : `${expiresDate}'e kadar`}
                </Text>
              </View>

              {/* Created At */}
              {createdDate && (
                <View style={[styles.infoRow, { backgroundColor: colors.background }]}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.labelText, { color: colors.textMuted }]}>
                      Yasak Tarihi
                    </Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {createdDate}
                  </Text>
                </View>
              )}

              {/* Warning */}
              <View style={[styles.warningBox, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="warning" size={20} color="#D97706" />
                <Text style={styles.warningText}>
                  Bu yasak hakkında itirazınız varsa destek ekibimizle iletişime geçebilirsiniz.
                </Text>
              </View>
            </View>

            {/* Button */}
            <Pressable
              style={[styles.button, { backgroundColor: config.color }]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Anladım</Text>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    width: "100%",
    paddingHorizontal: 20
  },
  modal: {
    borderRadius: 20,
    overflow: "hidden",
    maxWidth: SCREEN_WIDTH - 40
  },
  header: {
    alignItems: "center",
    paddingVertical: 24
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: "700"
  },
  content: {
    padding: 20,
    gap: 12
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8
  },
  infoRow: {
    borderRadius: 12,
    padding: 14
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500"
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    paddingLeft: 26
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 4
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18
  },
  button: {
    margin: 20,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});

export default BanInfoModal;
