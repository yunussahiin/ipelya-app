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
  useReactionRealtime,
  useConversation,
  useMarkAsRead,
  useDraftMessage,
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

  // Mark as read mutation
  const { mutate: markAsRead } = useMarkAsRead();

  // Realtime subscriptions
  useMessageRealtime(conversationId);
  useReactionRealtime(conversationId);

  // Draft message support
  const { draft, setDraft, clearDraft, isLoading: isDraftLoading } = useDraftMessage({
    conversationId,
  });

  // Convert messages to Gifted Chat format (filter duplicates, prefer messages with reply_to)
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    
    const allMessages = data.pages.flatMap((page) => page.data);
    
    // Use Map to deduplicate, preferring messages with reply_to
    const messageMap = new Map<string, any>();
    for (const m of allMessages) {
      const existing = messageMap.get(m.id);
      if (!existing) {
        messageMap.set(m.id, m);
      } else {
        // Prefer the version with reply_to if reply_to_id exists
        if (m.reply_to_id && m.reply_to && !existing.reply_to) {
          messageMap.set(m.id, m);
        }
      }
    }
    
    const uniqueMessages = Array.from(messageMap.values());
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

  // Mark last message as read when messages load
  useEffect(() => {
    if (!conversationId || !data?.pages?.[0]?.data?.[0]) return;
    
    const lastMessage = data.pages[0].data[0];
    // Only mark as read if it's not our own message
    if (lastMessage.sender_id !== userId) {
      markAsRead({ conversationId, messageId: lastMessage.id });
    }
  }, [conversationId, data?.pages?.[0]?.data?.[0]?.id, userId, markAsRead]);

  // Media options for audio/video/image messages
  interface MediaOptions {
    content_type?: "text" | "image" | "video" | "audio";
    media_url?: string;
    media_metadata?: Record<string, any>;
  }

  // Send message with optimistic update
  const onSend = useCallback(
    (newMessages: IMessage[] = [], replyToId?: string, mediaOptions?: MediaOptions) => {
      // Allow empty messages if media options provided (for audio)
      if (newMessages.length === 0 && !mediaOptions) return;

      const message = newMessages[0] || { text: "", _id: "", createdAt: new Date(), user: { _id: userId || "" } };
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update - add message immediately
      const tempId = `temp_${Date.now()}`;

      // Add to React Query cache optimistically
      queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
        if (!oldData?.pages?.[0]) return oldData;

        // Find reply_to message from existing messages
        let replyToMessage = null;
        if (replyToId) {
          for (const page of oldData.pages) {
            const found = page.data.find((m: Message) => m.id === replyToId);
            if (found) {
              replyToMessage = {
                id: found.id,
                content: found.content,
                content_type: found.content_type,
                sender_id: found.sender_id,
                sender_profile: found.sender_profile,
              };
              break;
            }
          }
        }

        // Determine content type and media URL
        const contentType = mediaOptions?.content_type || (message.image ? "image" : message.video ? "video" : "text");
        const mediaUrl = mediaOptions?.media_url || message.image || message.video || null;

        const newMessageData = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: userId || "",
          sender_profile_id: null,
          content: message.text || "",
          content_type: contentType,
          media_url: mediaUrl,
          media_thumbnail_url: null,
          media_metadata: null,
          reply_to_id: replyToId || null,
          reply_to: replyToMessage,
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
        };

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

      // Send to API - determine content type
      const apiContentType = mediaOptions?.content_type || (message.image ? "image" : message.video ? "video" : "text");
      const apiMediaUrl = mediaOptions?.media_url || message.image || message.video || undefined;
      
      const request: CreateMessageRequest = {
        conversation_id: conversationId,
        content: message.text || "",
        content_type: apiContentType,
        media_url: apiMediaUrl,
        media_metadata: mediaOptions?.media_metadata,
        reply_to_id: replyToId,
      };
      console.log("[useChatMessages] Sending request:", { contentType: apiContentType, hasMedia: !!apiMediaUrl, replyToId });

      sendMessage(request, {
        onSuccess: (realMessage) => {
          // Replace optimistic message with real message, preserving reply_to
          queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            
            // Find the optimistic message to get its reply_to
            let preservedReplyTo = null;
            for (const page of oldData.pages) {
              const found = page.data.find((m: any) => m.id === tempId);
              if (found?.reply_to) {
                preservedReplyTo = found.reply_to;
                break;
              }
            }
            
            console.log("[useChatMessages] onSuccess - preserving reply_to:", preservedReplyTo ? "yes" : "no");
            
            return {
              ...oldData,
              pages: oldData.pages.map((page: any, index: number) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: page.data.map((m: any) => {
                      if (m.id === tempId) {
                        // Preserve reply_to from optimistic message
                        return {
                          ...realMessage,
                          reply_to: preservedReplyTo,
                        };
                      }
                      return m;
                    }),
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

  // Add pending media message (shows immediately, doesn't send to API)
  const addPendingMedia = useCallback(
    (tempId: string, localUri: string, mediaType: "image" | "video") => {
      queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
        if (!oldData?.pages?.[0]) return oldData;

        const pendingMessage = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: userId || "",
          sender_profile_id: null,
          content: "",
          content_type: mediaType,
          media_url: localUri,
          media_thumbnail_url: null,
          media_metadata: null,
          reply_to_id: null,
          reply_to: null,
          forwarded_from_id: null,
          status: "uploading", // Special status for pending media
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
        };

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              data: [pendingMessage, ...oldData.pages[0].data],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });
    },
    [conversationId, userId, userDisplayName, userAvatarUrl, userUsername, queryClient]
  );

  // Update pending media message with real URL (smooth transition)
  const updatePendingMedia = useCallback(
    (tempId: string, realUrl: string) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
        if (!oldData?.pages?.[0]) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                data: page.data.map((m: any) => {
                  if (m.id === tempId) {
                    return { ...m, media_url: realUrl, status: "uploaded" };
                  }
                  return m;
                }),
              };
            }
            return page;
          }),
        };
      });
    },
    [conversationId, queryClient]
  );

  // Remove pending media message (on error only)
  const removePendingMedia = useCallback(
    (tempId: string) => {
      queryClient.setQueryData(messageKeys.list(conversationId), (oldData: any) => {
        if (!oldData?.pages?.[0]) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                data: page.data.filter((m: any) => m.id !== tempId),
              };
            }
            return page;
          }),
        };
      });
    },
    [conversationId, queryClient]
  );

  return {
    messages,
    isLoading,
    isSending,
    isFetchingNextPage,
    hasNextPage,
    onSend,
    onLoadEarlier,
    addPendingMedia,
    updatePendingMedia,
    removePendingMedia,
    // Draft support
    draft,
    setDraft,
    clearDraft,
    isDraftLoading,
  };
}
