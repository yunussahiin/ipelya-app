/**
 * GiftedChatScreen
 *
 * Amaç: DM sohbet ekranı (react-native-gifted-chat ile)
 * Tarih: 2025-11-26
 *
 * Gifted Chat kullanarak mesaj listesi, input alanı ve realtime desteği.
 */

import { useCallback, useState } from "react";
import { StyleSheet, Platform, KeyboardAvoidingView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  GiftedChat,
  SystemMessage,
  type IMessage,
  type BubbleProps,
  type InputToolbarProps,
  type ComposerProps,
  type SendProps,
  type ActionsProps,
  type DayProps,
  type TimeProps,
  type SystemMessageProps
} from "react-native-gifted-chat";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import "dayjs/locale/tr";

// Dayjs Türkçe locale'i aktif et
dayjs.locale("tr");

import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useConversationPresence } from "@/hooks/messaging";
import { ChatHeader } from "./components/ChatHeader";
import { ChatLoading } from "./components/ChatLoading";
import { ChatBubble } from "./components/ChatBubble";
import {
  ChatInputToolbar,
  ChatComposer,
  ChatSendButton,
  ChatActionsButton,
  ChatLoadEarlier,
  ChatScrollToBottom
} from "./components/ChatInputToolbar";
import { ChatDay, ChatTime } from "./components/ChatDateTime";
import { useChatMessages } from "./hooks/useChatMessages";

// =============================================
// COMPONENT
// =============================================

export function GiftedChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const insets = useSafeAreaInsets();

  // Typing state
  const [isTyping, setIsTyping] = useState(false);

  // Typing indicator
  const { startTyping, stopTyping } = useConversationPresence(conversationId || "");

  // Messages hook
  const {
    messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onSend: handleSend,
    onLoadEarlier
  } = useChatMessages({
    conversationId: conversationId || "",
    userId: user?.id,
    userDisplayName: user?.user_metadata?.display_name,
    userAvatarUrl: user?.user_metadata?.avatar_url,
    userUsername: user?.user_metadata?.username
  });

  // Send message wrapper
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      handleSend(newMessages);
      stopTyping();
    },
    [handleSend, stopTyping]
  );

  // Input text changed
  const onInputTextChanged = useCallback(
    (text: string) => {
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  // =============================================
  // RENDER FUNCTIONS (memoized)
  // =============================================

  const renderBubble = useCallback(
    (props: BubbleProps<IMessage>) => (
      <ChatBubble props={props} colors={colors} currentUserId={user?.id} />
    ),
    [colors, user?.id]
  );

  const renderInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => <ChatInputToolbar props={props} colors={colors} />,
    [colors]
  );

  const renderComposer = useCallback(
    (props: ComposerProps) => <ChatComposer props={props} colors={colors} />,
    [colors]
  );

  const renderSend = useCallback(
    (props: SendProps<IMessage>) => <ChatSendButton props={props} colors={colors} />,
    [colors]
  );

  const renderActions = useCallback(
    (props: ActionsProps) => <ChatActionsButton props={props} colors={colors} />,
    [colors]
  );

  const renderDay = useCallback(
    (props: DayProps<IMessage>) => <ChatDay props={props} colors={colors} />,
    [colors]
  );

  const renderTime = useCallback(
    (props: TimeProps<IMessage>) => <ChatTime props={props} colors={colors} />,
    [colors]
  );

  const renderLoadEarlier = useCallback(() => <ChatLoadEarlier colors={colors} />, [colors]);

  const renderScrollToBottom = useCallback(() => <ChatScrollToBottom colors={colors} />, [colors]);

  // System message (örn: "Sohbet başladı", "X sohbete katıldı")
  const renderSystemMessage = useCallback(
    (props: SystemMessageProps<IMessage>) => (
      <SystemMessage
        {...props}
        containerStyle={{
          marginVertical: 8
        }}
        textStyle={{
          color: colors.textMuted,
          fontSize: 12,
          textAlign: "center"
        }}
      />
    ),
    [colors]
  );

  // Loading state
  if (isLoading) {
    return <ChatLoading conversationId={conversationId || ""} colors={colors} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Safe area for header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <ChatHeader conversationId={conversationId || ""} />
      </SafeAreaView>

      {/* Keyboard avoiding wrapper */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?.id || "",
            name: user?.user_metadata?.display_name || "Ben",
            avatar: user?.user_metadata?.avatar_url
          }}
          // Infinite scroll
          infiniteScroll
          wrapInSafeArea={false}
          listViewProps={{
            onEndReached: onLoadEarlier,
            onEndReachedThreshold: 0.3,
            // Prevent layout animation flash
            removeClippedSubviews: false,
            // Performance optimizations
            initialNumToRender: 15,
            maxToRenderPerBatch: 10,
            windowSize: 11,
            // Disable content inset adjustments
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: "never"
          }}
          // Typing
          isTyping={isTyping}
          onInputTextChanged={onInputTextChanged}
          // Customization
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderActions={renderActions}
          renderDay={renderDay}
          renderTime={renderTime}
          renderSystemMessage={renderSystemMessage}
          renderAvatar={null}
          // Styling
          timeFormat="HH:mm"
          dateFormat="D MMMM"
          // Behavior
          alwaysShowSend
          scrollToBottom
          scrollToBottomComponent={renderScrollToBottom}
          // Input toolbar height
          minInputToolbarHeight={56}
          // Messages container - sabit boyut ile layout flash önleme
          messagesContainerStyle={{
            backgroundColor: colors.background
          }}
          // Locale - Türkçe
          locale="tr"
          placeholder="Mesaj yaz..."
          // Text input
          textInputProps={{
            style: {
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginRight: 8,
              fontSize: 16
            },
            placeholderTextColor: colors.textMuted,
            placeholder: "Mesaj yaz..."
          }}
          // Load earlier
          loadEarlier={hasNextPage}
          onLoadEarlier={onLoadEarlier}
          isLoadingEarlier={isFetchingNextPage}
          renderLoadEarlier={renderLoadEarlier}
          // Quick replies handler
          onQuickReply={(replies) => {
            // Quick reply seçildiğinde
            const reply = replies[0];
            if (reply) {
              handleSend([
                {
                  _id: Date.now(),
                  text: reply.title,
                  createdAt: new Date(),
                  user: {
                    _id: user?.id || "",
                    name: user?.user_metadata?.display_name || "Ben"
                  }
                }
              ]);
            }
          }}
          // Long press for message actions
          onLongPress={(context, message) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Show message actions (copy, reply, delete)
          }}
          // Parse patterns - URL, telefon, email tanıma
          parsePatterns={(linkStyle) => [
            {
              type: "url",
              style: { color: colors.accent, textDecorationLine: "underline" }
            },
            {
              type: "phone",
              style: { color: colors.accent }
            },
            {
              type: "email",
              style: { color: colors.accent }
            }
          ]}
          // Accessibility
          accessible
        />
      </KeyboardAvoidingView>

      {/* Bottom safe area spacer */}
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  chatContainer: {
    flex: 1
  }
});

export default GiftedChatScreen;
