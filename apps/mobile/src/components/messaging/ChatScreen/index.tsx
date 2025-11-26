/**
 * ChatScreen
 *
 * Amaç: DM sohbet ekranı
 * Tarih: 2025-11-26
 *
 * Mesaj listesi, input alanı ve realtime desteği.
 * FlashList v2 maintainVisibleContentPosition ile chat UX.
 */

import { useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "@/theme/ThemeProvider";
import {
  useMessages,
  useMessageRealtime,
  useConversationPresence,
  useConversation
} from "@/hooks/messaging";
import { useConversationStore, useMessageStore } from "@/store/messaging";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "../components/MessageBubble";
import { MessageInput } from "../components/MessageInput";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChatSkeleton } from "./components/ChatSkeleton";
import type { Message } from "@ipelya/types";

// =============================================
// CONSTANTS
// =============================================

const EMPTY_ARRAY: Message[] = [];

// =============================================
// COMPONENT
// =============================================

export function ChatScreen() {
  const { colors } = useTheme();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // Conversation bilgisini yükle
  useConversation(conversationId || "");

  // Mesajları yükle - React Query'den direkt al
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMessages(conversationId || "");

  console.log(
    "[ChatScreen] isLoading:",
    isLoading,
    "isFetching:",
    isFetching,
    "pages:",
    data?.pages?.length
  );

  // React Query'den mesajları flatten et (en yeniden en eskiye - inverted list için doğru sıra)
  const queryMessages = useMemo(() => {
    if (!data?.pages) {
      console.log("[ChatScreen] No pages yet");
      return EMPTY_ARRAY;
    }
    // API'den gelen mesajlar en yeniden en eskiye sıralı - inverted list için bu doğru
    const messages = data.pages.flatMap((page) => page.data);
    console.log("[ChatScreen] Query messages count:", messages.length);
    return messages;
  }, [data?.pages]);

  // Store'dan sadece pending mesajları al
  const storePending = useMessageStore(
    useShallow((state) => state.pendingMessages[conversationId || ""] ?? EMPTY_ARRAY)
  );

  // Pending mesajları + Query mesajları (inverted list için pending en başta = en altta görünür)
  const allMessages = useMemo(() => {
    const combined = [...storePending, ...queryMessages];
    console.log(
      "[ChatScreen] All messages count:",
      combined.length,
      "pending:",
      storePending.length
    );
    return combined;
  }, [queryMessages, storePending]);

  // Realtime subscription
  useMessageRealtime(conversationId || "");

  // Typing indicator
  const { startTyping, stopTyping } = useConversationPresence(conversationId || "");

  // Ekran açıldığında
  useEffect(() => {
    if (!conversationId) return;

    useConversationStore.getState().setActiveConversation(conversationId);
    useConversationStore.getState().resetUnread(conversationId);

    return () => {
      useConversationStore.getState().setActiveConversation(null);
    };
  }, [conversationId]);

  // Eski mesajları yükle (liste başına ulaşınca)
  const handleLoadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render message
  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      console.log("[ChatScreen] Rendering item:", index, item.content?.substring(0, 15));
      return <MessageBubble message={item} conversationId={conversationId || ""} />;
    },
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
            data={allMessages as Message[]}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={80}
            inverted
            contentContainerStyle={styles.listContent}
            // Eski mesajları yükle (inverted'da onEndReached = yukarı scroll)
            onEndReached={handleLoadOlder}
            onEndReachedThreshold={0.3}
            // Header (inverted'da en altta görünür): typing indicator
            ListHeaderComponent={<TypingIndicator conversationId={conversationId || ""} />}
            // Footer (inverted'da en üstte görünür): eski mesaj yükleniyor
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
