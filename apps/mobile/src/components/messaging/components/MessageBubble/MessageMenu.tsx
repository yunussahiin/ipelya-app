/**
 * MessageMenu
 *
 * Amaç: Mesaj context menu (reply, copy, delete, react)
 * Tarih: 2025-11-26
 */

import { memo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useDeleteMessage } from "@/hooks/messaging";
import type { Message } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface MessageMenuProps {
  visible: boolean;
  onClose: () => void;
  message: Message;
  conversationId: string;
  isMine: boolean;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

// =============================================
// QUICK REACTIONS
// =============================================

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// =============================================
// COMPONENT
// =============================================

export const MessageMenu = memo(function MessageMenu({
  visible,
  onClose,
  message,
  conversationId,
  isMine
}: MessageMenuProps) {
  const { colors } = useTheme();
  const { mutate: deleteMessage } = useDeleteMessage();

  // Kopyala
  const handleCopy = useCallback(async () => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  }, [message.content, onClose]);

  // Yanıtla
  const handleReply = useCallback(() => {
    // TODO: Reply state'i set et
    onClose();
  }, [onClose]);

  // Benim için sil
  const handleDeleteForMe = useCallback(() => {
    deleteMessage({
      request: { message_id: message.id, delete_for: "me" },
      conversationId
    });
    onClose();
  }, [message.id, conversationId, deleteMessage, onClose]);

  // Herkes için sil
  const handleDeleteForEveryone = useCallback(() => {
    deleteMessage({
      request: { message_id: message.id, delete_for: "everyone" },
      conversationId
    });
    onClose();
  }, [message.id, conversationId, deleteMessage, onClose]);

  // Tepki ekle
  const handleReaction = useCallback(
    (emoji: string) => {
      // TODO: Add reaction
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    },
    [onClose]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          {/* Quick reactions */}
          <View style={styles.reactionsRow}>
            {QUICK_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Menu items */}
          <MenuItem icon="↩️" label="Yanıtla" onPress={handleReply} />
          {message.content && <MenuItem icon="📋" label="Kopyala" onPress={handleCopy} />}
          <MenuItem icon="🗑️" label="Benim için sil" onPress={handleDeleteForMe} />
          {isMine && (
            <MenuItem
              icon="🗑️"
              label="Herkes için sil"
              onPress={handleDeleteForEveryone}
              destructive
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
});

// =============================================
// MENU ITEM
// =============================================

function MenuItem({ icon, label, onPress, destructive }: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: colors.backgroundRaised }
      ]}
      onPress={onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text
        style={[styles.menuLabel, { color: destructive ? colors.warning : colors.textPrimary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  menu: {
    width: 280,
    borderRadius: 16,
    overflow: "hidden"
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  reactionButton: {
    padding: 8
  },
  reactionEmoji: {
    fontSize: 24
  },
  divider: {
    height: 1
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12
  },
  menuLabel: {
    fontSize: 16
  }
});
