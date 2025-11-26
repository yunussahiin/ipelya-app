/**
 * useChatMessages
 * 
 * Hook for managing chat messages with optimistic updates
 */

import { useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import type { IMessage } from "react-native-gifted-chat";

import {
  useMessages,
  useSendMessage,
  useMessageRealtime,
  useConversation,
  messageKeys,
} from "@/hooks/messaging";
import { useConversationStore } from "@/store/messaging";
import { toGiftedMessages } from "@/utils/giftedChatHelpers";
import type { Message, CreateMessageRequest } from "@ipelya/types";

interface UseChatMessagesOptions {
  conversationId: string;
  userId?: string;
  userDisplayName?: string;
  userAvatarUrl?: string | null;
  userUsername?: string;
}

export function useChatMessages({
  conversationId,
  userId,
  userDisplayName,
  userAvatarUrl,
  userUsername,
}: UseChatMessagesOptions) {
  const queryClient = useQueryClient();

  // Load conversation info
  useConversation(conversationId);

  // Load messages
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useMessages(
    conversationId
  );

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Realtime subscription
  useMessageRealtime(conversationId);

  // Convert messages to Gifted Chat format (filter duplicates)
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    const allMessages = data.pages.flatMap((page) => page.data);
    // Filter duplicate IDs (for realtime + optimistic collision)
    const seen = new Set<string>();
    const uniqueMessages = allMessages.filter((m) => {
      const id = m.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return toGiftedMessages(uniqueMessages);
  }, [data?.pages]);

  // Set active conversation on mount
  useEffect(() => {
    if (!conversationId) return;

    useConversationStore.getState().setActiveConversation(conversationId);
    useConversationStore.getState().resetUnread(conversationId);

    return () => {
      useConversationStore.getState().setActiveConversation(null);
    };
  }, [conversationId]);

  // Send message with optimistic update
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (newMessages.length === 0) return;

      const message = newMessages[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update - add message immediately
      const tempId = `temp_${Date.now()}`;

      // Add to React Query cache optimistically
      queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
        if (!oldData?.pages?.[0]) return oldData;

        const newMessageData: Message = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: userId || "",
          sender_profile_id: null,
          content: message.text,
          content_type: "text",
          media_url: null,
          media_thumbnail_url: null,
          media_metadata: null,
          reply_to_id: null,
          forwarded_from_id: null,
          status: "sending",
          is_edited: false,
          edited_at: null,
          is_deleted: false,
          deleted_at: null,
          deleted_for: [],
          is_flagged: false,
          moderation_status: "approved",
          is_shadow: false,
          shadow_retention_days: 7,
          is_deleted_for_user: false,
          user_deleted_at: null,
          admin_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender_profile: {
            id: "",
            display_name: userDisplayName || "Ben",
            avatar_url: userAvatarUrl || null,
            username: userUsername || "",
          },
        } as Message;

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              data: [newMessageData, ...oldData.pages[0].data],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });

      // Send to API
      const request: CreateMessageRequest = {
        conversation_id: conversationId,
        content: message.text,
        content_type: "text",
      };

      sendMessage(request, {
        onSuccess: (realMessage) => {
          // Replace optimistic message with real message
          queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any, index: number) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: page.data.map((m: Message) => (m.id === tempId ? realMessage : m)),
                  };
                }
                return page;
              }),
            };
          });
        },
        onError: () => {
          // Remove optimistic message on error
          queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any, index: number) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: page.data.filter((m: Message) => m.id !== tempId),
                  };
                }
                return page;
              }),
            };
          });
        },
      });
    },
    [conversationId, userId, userDisplayName, userAvatarUrl, userUsername, sendMessage, queryClient]
  );

  // Load earlier messages
  const onLoadEarlier = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    messages,
    isLoading,
    isSending,
    isFetchingNextPage,
    hasNextPage,
    onSend,
    onLoadEarlier,
  };
}
