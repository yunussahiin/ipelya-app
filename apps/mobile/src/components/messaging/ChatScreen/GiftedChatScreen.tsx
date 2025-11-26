/**
 * GiftedChatScreen
 *
 * Amaç: DM sohbet ekranı (react-native-gifted-chat ile)
 * Tarih: 2025-11-26
 *
 * Gifted Chat kullanarak mesaj listesi, input alanı ve realtime desteği.
 */

import { useCallback, useState } from "react";
import {
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { useConversationPresence, useTypingIndicator } from "@/hooks/messaging";
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

  // Typing indicator - karşı tarafın yazıp yazmadığı
  const typingUserIds = useTypingIndicator(conversationId || "");
  const isOtherTyping = typingUserIds.length > 0;

  // Typing broadcast - kendi yazdığımızı bildirmek için
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

  // Reply state
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);

  // Message actions handlers
  const handleReply = useCallback((message: IMessage) => {
    console.log("[Reply] Setting reply to:", message._id, message.text?.substring(0, 30));
    setReplyToMessage(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Focus input and show reply preview
  }, []);

  const handleEdit = useCallback((message: IMessage) => {
    // TODO: Implement edit
    console.log("Edit message:", message._id);
  }, []);

  const handleDelete = useCallback((message: IMessage) => {
    // TODO: Implement delete via edge function
    console.log("Delete message:", message._id);
  }, []);

  // =============================================
  // RENDER FUNCTIONS (memoized)
  // =============================================

  const renderBubble = useCallback(
    (props: BubbleProps<IMessage>) => (
      <ChatBubble
        props={props}
        colors={colors}
        currentUserId={user?.id}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [colors, user?.id, handleReply, handleEdit, handleDelete]
  );

  const renderInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => <ChatInputToolbar props={props} colors={colors} />,
    [colors]
  );

  // Typing handler for composer
  const handleTyping = useCallback(
    (text: string) => {
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  const renderComposer = useCallback(
    (props: ComposerProps) => (
      <ChatComposer props={props} colors={colors} onTextChanged={handleTyping} />
    ),
    [colors, handleTyping]
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

  // Reply preview (input toolbar üstünde)
  const renderAccessory = useCallback(() => {
    if (!replyToMessage) return null;

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          marginHorizontal: 8,
          marginTop: 8,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
            Yanıtlanıyor
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
            {replyToMessage.text}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setReplyToMessage(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }, [replyToMessage, colors]);

  // Custom footer for typing indicator (theme uyumlu)
  const renderFooter = useCallback(() => {
    if (!isOtherTyping) return null;

    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 13, marginRight: 4 }}>Yazıyor</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>...</Text>
        </View>
      </View>
    );
  }, [isOtherTyping, colors]);

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
          // Customization
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderActions={renderActions}
          renderDay={renderDay}
          renderTime={renderTime}
          renderSystemMessage={renderSystemMessage}
          renderFooter={renderFooter}
          renderAccessory={renderAccessory}
          renderAvatar={null}
          // Styling
          timeFormat="HH:mm"
          dateFormat="D MMMM"
          // Behavior
          isSendButtonAlwaysVisible
          scrollToBottom
          isScrollToBottomEnabled
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
          // Text input style (typing artık ChatComposer'da handle ediliyor)
          textInputProps={{
            placeholderTextColor: colors.textMuted
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
