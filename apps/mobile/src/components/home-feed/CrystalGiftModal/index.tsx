/**
 * CrystalGiftModal Component
 *
 * Amaç: Dijital hediye gönderme modal'ı
 *
 * Özellikler:
 * - Gift type selection
 * - Message input
 * - Send button
 * - Animation
 *
 * Props:
 * - visible: boolean
 * - recipientId: string
 * - onDismiss: Dismiss callback
 * - onSend: Send callback
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, TextInput } from "react-native";
import { X, Sparkles, Coffee, Heart, Flower, Star } from "lucide-react-native";
import type { CrystalGiftType } from "@ipelya/types";

interface CrystalGiftModalProps {
  visible: boolean;
  recipientId: string;
  onDismiss: () => void;
  onSend?: (giftType: CrystalGiftType, message: string) => void;
}

const giftTypes: { type: CrystalGiftType; label: string; icon: any; color: string }[] = [
  { type: "energy_crystal", label: "Enerji Kristali", icon: Sparkles, color: "#FF6B9D" },
  { type: "coffee", label: "Kahve", icon: Coffee, color: "#8B4513" },
  { type: "motivation_card", label: "Motivasyon Kartı", icon: Heart, color: "#FF6B6B" },
  { type: "flower", label: "Çiçek", icon: Flower, color: "#51CF66" },
  { type: "star", label: "Yıldız", icon: Star, color: "#FFD43B" }
];

export function CrystalGiftModal({
  visible,
  recipientId,
  onDismiss,
  onSend
}: CrystalGiftModalProps) {
  const [selectedGift, setSelectedGift] = useState<CrystalGiftType>("energy_crystal");
  const [message, setMessage] = useState("");

  // Send handler
  const handleSend = () => {
    if (onSend) {
      onSend(selectedGift, message);
      setMessage("");
      onDismiss();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Hediye Gönder</Text>
            <Pressable onPress={onDismiss}>
              <X size={24} color="#212529" />
            </Pressable>
          </View>

          {/* Gift selection */}
          <View style={styles.gifts}>
            {giftTypes.map((gift) => {
              const Icon = gift.icon;
              const isSelected = selectedGift === gift.type;

              return (
                <Pressable
                  key={gift.type}
                  onPress={() => setSelectedGift(gift.type)}
                  style={[styles.giftOption, isSelected && { borderColor: gift.color }]}
                >
                  <Icon size={32} color={gift.color} />
                  <Text style={styles.giftLabel}>{gift.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Message input */}
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Mesaj ekle (opsiyonel)"
            multiline
            numberOfLines={3}
          />

          {/* Send button */}
          <Pressable onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Gönder</Text>
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF"
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529"
  },
  gifts: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12
  },
  giftOption: {
    width: "30%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  giftLabel: {
    fontSize: 12,
    color: "#212529",
    textAlign: "center"
  },
  messageInput: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top"
  },
  sendButton: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FF6B9D",
    padding: 16,
    borderRadius: 8,
    alignItems: "center"
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF"
  }
});
