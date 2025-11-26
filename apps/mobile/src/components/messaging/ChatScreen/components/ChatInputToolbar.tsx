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
}

function ChatComposerComponent({ props, colors }: ChatComposerProps) {
  return (
    <Composer
      {...props}
      textInputStyle={{
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
      }}
      placeholderTextColor={colors.textMuted}
      placeholder="Mesaj yaz..."
      multiline
    />
  );
}

export const ChatComposer = memo(ChatComposerComponent);

// =============================================
// SEND BUTTON
// =============================================

interface ChatSendButtonProps {
  props: SendProps<IMessage>;
  colors: ThemeColors;
}

function ChatSendButtonComponent({ props, colors }: ChatSendButtonProps) {
  return (
    <Send
      {...props}
      containerStyle={{
        justifyContent: "center",
        alignItems: "center",
        marginRight: 4
      }}
    >
      <View style={[styles.sendButton, { backgroundColor: colors.accent }]}>
        <Ionicons name="send" size={18} color="#fff" />
      </View>
    </Send>
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
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
