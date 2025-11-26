/**
 * ChatScreen
 *
 * Amaç: DM sohbet ekranı
 * Tarih: 2025-11-26
 *
 * Mesaj listesi, input alanı ve realtime desteği.
 * Inverted FlashList ile mesajlar gösterilir.
 */

import { useCallback, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import {
  useMessages,
  useMarkAsRead,
  useMessageRealtime,
  useConversationPresence
} from "@/hooks/messaging";
import { useConversationStore, useConversationMessages } from "@/store/messaging";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "../components/MessageBubble";
import { MessageInput } from "../components/MessageInput";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatSkeleton } from "./components/ChatSkeleton";
import type { Message } from "@ipelya/types";

// =============================================
// COMPONENT
// =============================================

export function ChatScreen() {
  const { colors } = useTheme();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // Mesajlar
  const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMessages(
    conversationId || ""
  );

  // Store'dan mesajları al (realtime güncellemeler için)
  const messages = useConversationMessages(conversationId || "");

  // Realtime subscription
  useMessageRealtime(conversationId || "");

  // Typing indicator
  const { startTyping, stopTyping } = useConversationPresence(conversationId || "");

  // Mark as read
  const { mutate: markAsRead } = useMarkAsRead();

  // Ekran açıldığında
  useEffect(() => {
    if (conversationId) {
      useConversationStore.getState().setActiveConversation(conversationId);
      useConversationStore.getState().resetUnread(conversationId);
    }

    return () => {
      useConversationStore.getState().setActiveConversation(null);
    };
  }, [conversationId]);

  // Son mesajı okundu olarak işaretle
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      const lastMessage = messages[0];
      if ("id" in lastMessage) {
        markAsRead({ conversationId, messageId: lastMessage.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversationId]);

  // Daha fazla yükle
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render message
  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} conversationId={conversationId || ""} />
    ),
    [conversationId]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: Message) => ("tempId" in item ? item.tempId : item.id) as string,
    []
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ChatHeader conversationId={conversationId || ""} />
        <ChatSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ChatHeader conversationId={conversationId || ""} />

        <View style={styles.messagesContainer}>
          <FlashList
            data={messages as Message[]}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={80}
            inverted
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={<TypingIndicator conversationId={conversationId || ""} />}
            ListFooterComponent={isFetchingNextPage ? <ChatSkeleton count={3} /> : null}
          />
        </View>

        <MessageInput
          conversationId={conversationId || ""}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  messagesContainer: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8
  }
});

export default ChatScreen;
