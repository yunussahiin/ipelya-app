/**
 * useMessages Hook
 *
 * Amaç: Mesaj listesi yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook, sohbet mesajlarını getirir ve yönetir.
 * Cursor-based pagination ve optimistic updates desteği sağlar.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessageStore } from "@/store/messaging";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markAsRead,
  addReaction,
  removeReaction,
} from "@ipelya/api";
import type {
  CreateMessageRequest,
  UpdateMessageRequest,
  DeleteMessageRequest,
  Message,
} from "@ipelya/types";
import { useAuth } from "@/hooks/useAuth";

// =============================================
// QUERY KEYS
// =============================================

export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (conversationId: string) =>
    [...messageKeys.lists(), conversationId] as const,
};

// =============================================
// HOOKS
// =============================================

/**
 * Sohbet mesajlarını getirir (infinite scroll)
 */
export function useMessages(conversationId: string) {
  const query = useInfiniteQuery({
    queryKey: messageKeys.list(conversationId),
    queryFn: async ({ pageParam }) => {
      const result = await getMessages({
        conversationId,
        limit: 50,
        cursor: pageParam,
      });

      // Store'u queryFn içinde güncelle (side effect olarak)
      const store = useMessageStore.getState();
      if (!pageParam) {
        // İlk sayfa
        store.setMessages(conversationId, result.data);
      } else {
        // Sonraki sayfalar
        store.addMessages(conversationId, result.data);
      }
      store.setHasMore(conversationId, !!result.nextCursor);
      store.setCursor(conversationId, result.nextCursor);

      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });

  return query;
}

/**
 * Mesaj gönderir (optimistic update ile)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const addPendingMessage = useMessageStore((s) => s.addPendingMessage);
  const removePendingMessage = useMessageStore((s) => s.removePendingMessage);
  const confirmPendingMessage = useMessageStore((s) => s.confirmPendingMessage);

  return useMutation({
    mutationFn: (request: CreateMessageRequest) => sendMessage(request),
    onMutate: async (request) => {
      // Optimistic update - pending mesaj ekle
      const tempId = `temp_${Date.now()}`;

      addPendingMessage(request.conversation_id, {
        tempId,
        conversation_id: request.conversation_id,
        sender_id: user?.id || "",
        sender_profile_id: null,
        content: request.content || null,
        content_type: request.content_type,
        media_url: request.media_url || null,
        media_thumbnail_url: request.media_thumbnail_url || null,
        media_metadata: request.media_metadata || null,
        reply_to_id: request.reply_to_id || null,
        forwarded_from_id: null,
        status: "sending",
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        deleted_at: null,
        deleted_for: [],
        is_flagged: false,
        moderation_status: "approved",
        is_shadow: request.is_shadow || false,
        shadow_retention_days: 7,
        is_deleted_for_user: false,
        user_deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return { tempId, conversationId: request.conversation_id };
    },
    onSuccess: (message, _, context) => {
      if (context) {
        // Pending mesajı gerçek mesajla değiştir
        confirmPendingMessage(context.conversationId, context.tempId, message);
      }
    },
    onError: (_, request, context) => {
      if (context) {
        // Hata durumunda pending mesajı kaldır
        removePendingMessage(context.conversationId, context.tempId);
      }
    },
  });
}

/**
 * Mesajı düzenler
 */
export function useEditMessage() {
  const queryClient = useQueryClient();
  const updateMessage = useMessageStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: (request: UpdateMessageRequest) => editMessage(request),
    onMutate: async (request) => {
      // Mesajın conversation_id'sini bulmamız gerekiyor
      // Bu bilgi request'te yok, o yüzden sadece server response'u bekliyoruz
    },
    onSuccess: (message) => {
      updateMessage(message.conversation_id, message.id, {
        content: message.content,
        is_edited: true,
        edited_at: message.edited_at,
      });
    },
  });
}

/**
 * Mesajı siler
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const updateMessage = useMessageStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: ({
      request,
      conversationId,
    }: {
      request: DeleteMessageRequest;
      conversationId: string;
    }) => deleteMessage(request),
    onSuccess: (_, { request, conversationId }) => {
      if (request.delete_for === "everyone") {
        // Tamamen kaldır
        removeMessage(conversationId, request.message_id);
      } else {
        // Sadece görünümden gizle (UI'da handle edilecek)
        updateMessage(conversationId, request.message_id, {
          is_deleted: true,
        });
      }
    },
  });
}

/**
 * Mesajı okundu olarak işaretler
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => markAsRead(conversationId, messageId),
  });
}

/**
 * Mesaja tepki ekler
 */
export function useAddReaction() {
  const updateMessage = useMessageStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
      conversationId,
    }: {
      messageId: string;
      emoji: string;
      conversationId: string;
    }) => addReaction(messageId, emoji),
    onSuccess: (reaction, { conversationId, messageId }) => {
      // Mesajın reactions'ına ekle
      // Bu kısım realtime ile de güncellenecek
    },
  });
}

/**
 * Mesajdan tepki kaldırır
 */
export function useRemoveReaction() {
  const updateMessage = useMessageStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
      conversationId,
    }: {
      messageId: string;
      emoji: string;
      conversationId: string;
    }) => removeReaction(messageId, emoji),
    onSuccess: (_, { conversationId, messageId }) => {
      // Mesajın reactions'ından kaldır
      // Bu kısım realtime ile de güncellenecek
    },
  });
}
