/**
 * ChatInputToolbar
 *
 * Custom input toolbar components for Gifted Chat
 */

import { memo } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import {
  InputToolbar,
  Composer,
  Send,
  Actions,
  type InputToolbarProps,
  type ComposerProps,
  type SendProps,
  type ActionsProps,
  type IMessage
} from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ThemeColors } from "@/theme/ThemeProvider";

// =============================================
// INPUT TOOLBAR
// =============================================

interface ChatInputToolbarProps {
  props: InputToolbarProps<IMessage>;
  colors: ThemeColors;
}

function ChatInputToolbarComponent({ props, colors }: ChatInputToolbarProps) {
  return (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: colors.background,
        borderTopWidth: 0.5,
        borderTopColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 8,
        paddingVertical: 6
      }}
      primaryStyle={{
        alignItems: "center"
      }}
    />
  );
}

export const ChatInputToolbar = memo(ChatInputToolbarComponent);

// =============================================
// COMPOSER
// =============================================

interface ChatComposerProps {
  props: ComposerProps;
  colors: ThemeColors;
  onTextChanged?: (text: string) => void;
}

function ChatComposerComponent({ props, colors, onTextChanged }: ChatComposerProps) {
  return (
    <Composer
      {...props}
      textInputProps={{
        ...props.textInputProps,
        placeholder: "Mesaj yaz...",
        placeholderTextColor: colors.textMuted,
        onChangeText: (text: string) => {
          console.log("[Composer] onChangeText:", text.length, "chars");
          // Gifted Chat'in kendi handler'ını çağır
          props.textInputProps?.onChangeText?.(text);
          // Bizim typing handler'ımızı çağır
          onTextChanged?.(text);
        },
        style: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          marginLeft: 0,
          marginRight: 8,
          color: colors.textPrimary,
          fontSize: 16,
          lineHeight: 20
        }
      }}
    />
  );
}

export const ChatComposer = memo(ChatComposerComponent);

// =============================================
// SEND BUTTON (with mic/camera when no text)
// =============================================

interface ChatSendButtonProps {
  props: SendProps<IMessage>;
  colors: ThemeColors;
  onCameraPress?: () => void;
  onMicPress?: () => void;
}

function ChatSendButtonComponent({
  props,
  colors,
  onCameraPress,
  onMicPress
}: ChatSendButtonProps) {
  // Text var mı kontrol et
  const hasText = !!props.text?.trim().length;

  // Text varken send butonu göster
  if (hasText) {
    return (
      <View style={styles.sendButtonWrapper}>
        <Send
          {...props}
          containerStyle={{
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View style={[styles.sendButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </View>
        </Send>
      </View>
    );
  }

  // Text yokken kamera + mikrofon göster
  return (
    <View style={styles.mediaButtonsWrapper}>
      <View
        style={[styles.iconButton, { backgroundColor: "transparent" }]}
        onTouchEnd={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onCameraPress?.();
        }}
      >
        <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
      </View>
      <View
        style={[styles.iconButton, { backgroundColor: "transparent" }]}
        onTouchEnd={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMicPress?.();
        }}
      >
        <Ionicons name="mic-outline" size={24} color={colors.textSecondary} />
      </View>
    </View>
  );
}

export const ChatSendButton = memo(ChatSendButtonComponent);

// =============================================
// ACTIONS BUTTON
// =============================================

interface ChatActionsButtonProps {
  props: ActionsProps;
  colors: ThemeColors;
  onPress?: () => void;
}

function ChatActionsButtonComponent({ props, colors, onPress }: ChatActionsButtonProps) {
  return (
    <Actions
      {...props}
      containerStyle={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 4,
        marginRight: 4,
        marginBottom: 0
      }}
      icon={() => (
        <View style={[styles.actionsButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="add" size={24} color={colors.textSecondary} />
        </View>
      )}
      onPressActionButton={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    />
  );
}

export const ChatActionsButton = memo(ChatActionsButtonComponent);

// =============================================
// LOAD EARLIER
// =============================================

interface ChatLoadEarlierProps {
  colors: ThemeColors;
}

function ChatLoadEarlierComponent({ colors }: ChatLoadEarlierProps) {
  return (
    <View style={styles.loadEarlierContainer}>
      <ActivityIndicator size="small" color={colors.accent} />
      <Text style={[styles.loadEarlierText, { color: colors.textMuted }]}>
        Eski mesajlar yükleniyor...
      </Text>
    </View>
  );
}

export const ChatLoadEarlier = memo(ChatLoadEarlierComponent);

// =============================================
// SCROLL TO BOTTOM
// =============================================

interface ChatScrollToBottomProps {
  colors: ThemeColors;
}

function ChatScrollToBottomComponent({ colors }: ChatScrollToBottomProps) {
  return (
    <View style={[styles.scrollToBottom, { backgroundColor: colors.surface }]}>
      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
    </View>
  );
}

export const ChatScrollToBottom = memo(ChatScrollToBottomComponent);

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  sendButtonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  mediaButtonsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  actionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  loadEarlierContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8
  },
  loadEarlierText: {
    fontSize: 13
  },
  scrollToBottom: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  }
});
