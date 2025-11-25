/**
 * GiftModal Component
 * Hediye gönderme modal'ı
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { GiftGrid } from "./GiftSelector";
import { useGiftSend } from "@/hooks/useGiftSend";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { GiftType } from "@/services/iap/products";

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  postId?: string;
  onSuccess?: () => void;
}

export function GiftModal({
  visible,
  onClose,
  receiverId,
  receiverName,
  postId,
  onSuccess
}: GiftModalProps) {
  const { colors } = useTheme();
  const { sendGift, isSending, getGiftCost, canAffordGift } = useGiftSend();
  const { formattedBalance } = useTokenBalance();
  const [selectedGift, setSelectedGift] = useState<GiftType | undefined>();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!selectedGift) return;

    const result = await sendGift({
      receiverId,
      giftType: selectedGift,
      message: message.trim() || undefined,
      postId
    });

    if (result.success) {
      setSelectedGift(undefined);
      setMessage("");
      onClose();
      onSuccess?.();
    }
  };

  const selectedCost = selectedGift ? getGiftCost(selectedGift) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {receiverName}'a Hediye Gönder
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Balance */}
        <View style={[styles.balanceSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Mevcut Bakiye</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>
              {formattedBalance()}
            </Text>
          </View>
        </View>

        {/* Gift Selection */}
        <View style={styles.giftSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hediye Seç</Text>
          <GiftGrid onGiftSelect={setSelectedGift} selectedGift={selectedGift} />
        </View>

        {/* Message Input */}
        <View style={styles.messageSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Mesaj (Opsiyonel)
          </Text>
          <TextInput
            style={[
              styles.messageInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary
              }
            ]}
            placeholder="Bir mesaj ekle..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            maxLength={100}
            multiline
          />
        </View>

        {/* Send Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {selectedGift && (
            <View style={styles.costInfo}>
              <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Maliyet</Text>
              <View style={styles.costRow}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>
                  {selectedCost}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  selectedGift && canAffordGift(selectedGift)
                    ? colors.accent
                    : colors.backgroundRaised
              }
            ]}
            onPress={handleSend}
            disabled={!selectedGift || isSending || !canAffordGift(selectedGift!)}
          >
            <Ionicons
              name="gift"
              size={20}
              color={selectedGift && canAffordGift(selectedGift) ? "#fff" : colors.textMuted}
            />
            <Text
              style={[
                styles.sendText,
                {
                  color: selectedGift && canAffordGift(selectedGift) ? "#fff" : colors.textMuted
                }
              ]}
            >
              {isSending ? "Gönderiliyor..." : "Hediye Gönder"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  closeButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  placeholder: {
    width: 32
  },
  balanceSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700"
  },
  coinIcon: {
    fontSize: 20
  },
  giftSection: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  messageSection: {
    paddingHorizontal: 16,
    flex: 1
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top"
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  costInfo: {
    flex: 1
  },
  costLabel: {
    fontSize: 12
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  costValue: {
    fontSize: 20,
    fontWeight: "700"
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
