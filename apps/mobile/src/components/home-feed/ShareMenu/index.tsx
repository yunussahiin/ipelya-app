/**
 * ShareMenu Component
 *
 * Amaç: Share options modal - Paylaşma seçenekleri
 *
 * Özellikler:
 * - Bottom sheet modal
 * - Share to DM
 * - Share to external (copy link, share to other apps)
 * - Share to story
 *
 * Props:
 * - visible: boolean
 * - onDismiss: Dismiss callback
 * - onShareDM: Share to DM callback
 * - onShareExternal: Share external callback
 * - onShareStory: Share to story callback
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { MessageCircle, Share2, Image as ImageIcon, X } from "lucide-react-native";

interface ShareMenuProps {
  visible: boolean;
  onDismiss: () => void;
  onShareDM?: () => void;
  onShareExternal?: () => void;
  onShareStory?: () => void;
}

export function ShareMenu({
  visible,
  onDismiss,
  onShareDM,
  onShareExternal,
  onShareStory
}: ShareMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.menu}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Paylaş</Text>
            <Pressable onPress={onDismiss}>
              <X size={24} color="#212529" />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {/* Share to DM */}
            <Pressable onPress={onShareDM} style={styles.option}>
              <MessageCircle size={24} color="#FF6B9D" />
              <Text style={styles.optionText}>Mesaj Olarak Gönder</Text>
            </Pressable>

            {/* Share external */}
            <Pressable onPress={onShareExternal} style={styles.option}>
              <Share2 size={24} color="#4ECDC4" />
              <Text style={styles.optionText}>Dışarı Paylaş</Text>
            </Pressable>

            {/* Share to story */}
            <Pressable onPress={onShareStory} style={styles.option}>
              <ImageIcon size={24} color="#FFD43B" />
              <Text style={styles.optionText}>Story'e Ekle</Text>
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
  menu: {
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
  options: {
    padding: 16,
    gap: 16
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8F9FA"
  },
  optionText: {
    fontSize: 16,
    color: "#212529"
  }
});
