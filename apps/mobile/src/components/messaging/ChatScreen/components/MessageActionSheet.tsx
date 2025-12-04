/**
 * MessageActionSheet
 *
 * Long press ile açılan mesaj aksiyon menüsü
 * WhatsApp/Telegram tarzı blur + emoji bar + context menu
 */

import { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import type { ThemeColors } from "@/theme/ThemeProvider";
import type { IMessage } from "react-native-gifted-chat";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Quick emoji reactions
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageActionSheetProps {
  visible: boolean;
  message: IMessage | null;
  isOwnMessage: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onReply: () => void;
  onForward?: () => void;
  onCopy: () => void;
  onInfo: () => void;
  onStar?: () => void;
  onDelete?: () => void;
  onReact: (emoji: string) => void;
}

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  colors: ThemeColors;
}

function ActionItem({ icon, label, onPress, destructive, colors }: ActionItemProps) {
  return (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionLabel, { color: destructive ? "#FF3B30" : colors.textPrimary }]}>
        {label}
      </Text>
      <Ionicons name={icon} size={20} color={destructive ? "#FF3B30" : colors.textMuted} />
    </TouchableOpacity>
  );
}

function MessageActionSheetComponent({
  visible,
  message,
  isOwnMessage,
  colors,
  onClose,
  onReply,
  onForward,
  onCopy,
  onInfo,
  onStar,
  onDelete,
  onReact
}: MessageActionSheetProps) {
  const handleEmojiPress = useCallback(
    (emoji: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReact(emoji);
      onClose();
    },
    [onReact, onClose]
  );

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      onClose();
    },
    [onClose]
  );

  if (!visible || !message) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <View style={styles.container} pointerEvents="box-none">
        {/* Emoji Bar */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.emojiBar, { backgroundColor: colors.surface }]}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => handleEmojiPress(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.emojiButton, styles.moreEmojiButton]}
            onPress={() => {
              // TODO: Open full emoji picker
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Message Preview (optional - küçük mesaj önizlemesi) */}
        {message.text && (
          <Animated.View
            entering={FadeIn.duration(200).delay(50)}
            exiting={FadeOut.duration(150)}
            style={[styles.messagePreview, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.messagePreviewText} numberOfLines={2}>
              {message.text}
            </Text>
          </Animated.View>
        )}

        {/* Action Menu */}
        <Animated.View
          entering={SlideInDown.duration(250).springify()}
          exiting={SlideOutDown.duration(200)}
          style={[styles.actionMenu, { backgroundColor: colors.surface }]}
        >
          <ActionItem
            icon="arrow-undo-outline"
            label="Cevapla"
            onPress={() => handleAction(onReply)}
            colors={colors}
          />

          {onForward && (
            <ActionItem
              icon="arrow-redo-outline"
              label="İlet"
              onPress={() => handleAction(onForward)}
              colors={colors}
            />
          )}

          <ActionItem
            icon="copy-outline"
            label="Kopyala"
            onPress={() => handleAction(onCopy)}
            colors={colors}
          />

          <ActionItem
            icon="information-circle-outline"
            label="Bilgi"
            onPress={() => handleAction(onInfo)}
            colors={colors}
          />

          {onStar && (
            <ActionItem
              icon="star-outline"
              label="Yıldız Ekle"
              onPress={() => handleAction(onStar)}
              colors={colors}
            />
          )}

          {isOwnMessage && onDelete && (
            <ActionItem
              icon="trash-outline"
              label="Sil"
              onPress={() => handleAction(onDelete)}
              destructive
              colors={colors}
            />
          )}

          <ActionItem
            icon="ellipsis-horizontal"
            label="Daha fazla..."
            onPress={() => {
              // TODO: More options
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            colors={colors}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  emojiBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  },
  emojiButton: {
    padding: 8
  },
  emojiText: {
    fontSize: 28
  },
  moreEmojiButton: {
    marginLeft: 4,
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    padding: 0
  },
  messagePreview: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: SCREEN_WIDTH - 80
  },
  messagePreviewText: {
    color: "#fff",
    fontSize: 15
  },
  actionMenu: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)"
  },
  actionLabel: {
    fontSize: 16
  }
});

export const MessageActionSheet = memo(MessageActionSheetComponent);
