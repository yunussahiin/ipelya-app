/**
 * CrystalGiftModal Component
 *
 * Amaç: Dijital hediye gönderme modal'ı
 *
 * Özellikler:
 * - Gift type selection (API entegrasyonu)
 * - Message input
 * - Send button
 * - Haptic feedback
 * - Theme-aware styling
 *
 * Props:
 * - visible: boolean
 * - recipientId: string
 * - recipientName: string (optional)
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
import { X, Sparkles, Coffee, Heart, Flower2, Star, Gift } from "lucide-react-native";
import type { CrystalGiftType } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { sendCrystalGift } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";

interface CrystalGiftModalProps {
  visible: boolean;
  recipientId: string;
  recipientName?: string;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const giftTypes: {
  type: CrystalGiftType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  emoji: string;
}[] = [
  {
    type: "energy_crystal",
    label: "Enerji Kristali",
    icon: Sparkles,
    color: "#FF6B9D",
    emoji: "💎"
  },
  { type: "coffee", label: "Kahve", icon: Coffee, color: "#8B4513", emoji: "☕" },
  { type: "motivation_card", label: "Motivasyon", icon: Heart, color: "#FF6B6B", emoji: "💪" },
  { type: "flower", label: "Çiçek", icon: Flower2, color: "#51CF66", emoji: "🌸" },
  { type: "star", label: "Yıldız", icon: Star, color: "#FFD43B", emoji: "⭐" }
];

export function CrystalGiftModal({
  visible,
  recipientId,
  recipientName,
  onDismiss,
  onSuccess
}: CrystalGiftModalProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const [selectedGift, setSelectedGift] = useState<CrystalGiftType>("energy_crystal");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Gift select handler
  const handleSelectGift = (type: CrystalGiftType) => {
    Haptics.selectionAsync();
    setSelectedGift(type);
  };

  // Send handler
  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await sendCrystalGift(supabaseUrl, accessToken, {
        recipient_id: recipientId,
        gift_type: selectedGift,
        message: message.trim() || undefined
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const giftData = giftTypes.find((g) => g.type === selectedGift);
        Alert.alert(
          `${giftData?.emoji} Hediye Gönderildi!`,
          `${giftData?.label} başarıyla gönderildi.`
        );
        setMessage("");
        onSuccess?.();
        onDismiss();
      } else {
        Alert.alert("❌ Hata", response.error || "Hediye gönderilemedi");
      }
    } catch (error) {
      Alert.alert("❌ Hata", "Bir sorun oluştu");
    } finally {
      setLoading(false);
    }
  };

  const selectedGiftData = giftTypes.find((g) => g.type === selectedGift);

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
              <Gift size={20} color={colors.accent} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Hediye Gönder</Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Recipient info */}
          {recipientName && (
            <Text style={[styles.recipientText, { color: colors.textMuted }]}>
              {recipientName} için bir hediye seç
            </Text>
          )}

          {/* Gift selection */}
          <View style={styles.gifts}>
            {giftTypes.map((gift) => {
              const Icon = gift.icon;
              const isSelected = selectedGift === gift.type;

              return (
                <Pressable
                  key={gift.type}
                  onPress={() => handleSelectGift(gift.type)}
                  style={[
                    styles.giftOption,
                    { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    isSelected && {
                      borderColor: gift.color,
                      backgroundColor: `${gift.color}15`
                    }
                  ]}
                >
                  <Icon size={28} color={gift.color} />
                  <Text
                    style={[
                      styles.giftLabel,
                      { color: isSelected ? gift.color : colors.textPrimary }
                    ]}
                  >
                    {gift.label}
                  </Text>
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Message input */}
          <View style={styles.messageContainer}>
            <Text style={[styles.messageLabel, { color: colors.textSecondary }]}>
              Mesaj (opsiyonel)
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  color: colors.textPrimary
                }
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="Bir mesaj ekle..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>
              {message.length}/200
            </Text>
          </View>

          {/* Send button */}
          <Pressable
            onPress={handleSend}
            disabled={loading}
            style={[
              styles.sendButton,
              { backgroundColor: selectedGiftData?.color || colors.accent }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.sendButtonText}>{selectedGiftData?.emoji} Gönder</Text>
              </>
            )}
          </Pressable>
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
    paddingBottom: 32
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
  recipientText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12
  },
  gifts: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 10,
    justifyContent: "center"
  },
  giftOption: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 4
  },
  giftLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center"
  },
  giftEmoji: {
    fontSize: 16
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  messageLabel: {
    fontSize: 14,
    marginBottom: 8
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top"
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4
  },
  sendButton: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
