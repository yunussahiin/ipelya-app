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
import { supabase } from "@/lib/supabaseClient";
import { useMessageStore } from "@/store/messaging";
import type {
  CreateMessageRequest,
  UpdateMessageRequest,
  DeleteMessageRequest,
  Message,
} from "@ipelya/types";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

// =============================================
// LOCAL REACTION FUNCTIONS (mobile supabase client kullanır)
// =============================================

async function addReaction(messageId: string, emoji: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  // Upsert: Eğer kullanıcının bu mesajda reaksiyonu varsa güncelle, yoksa ekle
  const { data, error } = await supabase
    .from("message_reactions")
    .upsert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    }, {
      onConflict: "message_id,user_id",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function removeReaction(messageId: string, emoji: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) throw error;
}

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      // Edge function ile mesajları getir
      // İlk yüklemede 20 mesaj, sonraki sayfalarda da 20 mesaj
      const params = new URLSearchParams({
        conversation_id: conversationId,
        limit: "20",
      });
      if (pageParam) params.set("cursor", pageParam);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-messages?${params}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mesajlar yüklenemedi");

      return { data: result.data || [], nextCursor: result.nextCursor, isFirstPage: !pageParam };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 2, // 2 dakika cache
    refetchOnWindowFocus: false,
    // Prevent unnecessary refetches
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return query;
}

/**
 * Mesaj gönderir (optimistic update ile)
 */
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateMessageRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      // Edge function ile mesaj gönder
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversation_id: request.conversation_id,
            content: request.content,
            content_type: request.content_type,
            media_url: request.media_url,
            media_thumbnail_url: request.media_thumbnail_url,
            media_metadata: request.media_metadata,
            reply_to_id: request.reply_to_id,
            is_shadow: request.is_shadow,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Mesaj gönderilemedi");
      }

      return result.data;
    },
    onMutate: async (request) => {
      const tempId = `temp_${Date.now()}`;
      const store = useMessageStore.getState();

      store.addPendingMessage(request.conversation_id, {
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
        // Pending mesajı kaldır
        useMessageStore.getState().removePendingMessage(context.conversationId, context.tempId);
        
        // React Query cache'ine gerçek mesajı ekle
        queryClient.setQueryData(
          messageKeys.list(context.conversationId),
          (oldData: any) => {
            if (!oldData?.pages?.[0]) return oldData;
            return {
              ...oldData,
              pages: [
                {
                  ...oldData.pages[0],
                  data: [message, ...oldData.pages[0].data],
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        );
      }
    },
    onError: (error, _, context) => {
      logger.error('Send message error', error, { tag: 'Messages' });
      if (context) {
        // Hata durumunda pending mesajı kaldır
        useMessageStore.getState().removePendingMessage(context.conversationId, context.tempId);
      }
    },
  });
}

/**
 * Mesajı düzenler (Edge Function)
 */
export function useEditMessage() {
  return useMutation({
    mutationFn: async (request: UpdateMessageRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/edit-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message_id: request.message_id,
            content: request.content,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mesaj düzenlenemedi");
      return result.data;
    },
    onSuccess: (message) => {
      useMessageStore.getState().updateMessage(message.conversation_id, message.id, {
        content: message.content,
        is_edited: true,
        edited_at: message.edited_at,
      });
    },
  });
}

/**
 * Mesajı siler (Edge Function)
 */
export function useDeleteMessage() {
  return useMutation({
    mutationFn: async ({
      request,
      conversationId,
    }: {
      request: DeleteMessageRequest;
      conversationId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message_id: request.message_id,
            delete_for: request.delete_for,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mesaj silinemedi");
      return { request, conversationId };
    },
    onSuccess: (_, { request, conversationId }) => {
      const store = useMessageStore.getState();
      if (request.delete_for === "everyone") {
        store.removeMessage(conversationId, request.message_id);
      } else {
        store.updateMessage(conversationId, request.message_id, {
          is_deleted: true,
        });
      }
    },
  });
}

/**
 * Mesajı okundu olarak işaretler (Edge Function)
 */
export function useMarkAsRead() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mark-as-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message_id: messageId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Okundu işaretlenemedi");
      return result;
    },
  });
}

/**
 * Mesaja tepki ekler
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      conversationId: string;
    }) => addReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji, conversationId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) });

      queryClient.setQueryData(
        messageKeys.list(conversationId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          const newData = {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: any) => {
                if (msg.id !== messageId) return msg;

                const existingReactions = msg.message_reactions || [];
                
                // Kullanıcının mevcut reaksiyonunu bul (hasReacted: true olan)
                const myOldReaction = existingReactions.find((r: any) => r.hasReacted);
                
                // Aynı emoji'ye tıkladıysa - değişiklik yok (toggle için removeReaction kullanılır)
                if (myOldReaction?.emoji === emoji) {
                  return msg;
                }
                
                // Farklı emoji seçildi - eski reaksiyonu kaldır, yenisini ekle
                let updatedReactions = existingReactions;
                
                // Eski reaksiyonumu kaldır (count azalt veya sil)
                if (myOldReaction) {
                  updatedReactions = updatedReactions
                    .map((r: any) => {
                      if (r.emoji !== myOldReaction.emoji) return r;
                      const newCount = r.count - 1;
                      return newCount > 0 ? { ...r, count: newCount, hasReacted: false } : null;
                    })
                    .filter(Boolean);
                }
                
                // Yeni reaksiyonu ekle veya count artır
                const existingNewReaction = updatedReactions.find((r: any) => r.emoji === emoji);
                if (existingNewReaction) {
                  updatedReactions = updatedReactions.map((r: any) =>
                    r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r
                  );
                } else {
                  updatedReactions = [...updatedReactions, { emoji, count: 1, hasReacted: true }];
                }

                return { ...msg, message_reactions: updatedReactions };
              }),
            })),
          };
          return newData;
        }
      );
    },
    onError: (error, variables) => {
      logger.error('Reaction error', error, { tag: 'Messages' });
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.conversationId) });
    },
  });
}

/**
 * Mesajdan tepki kaldırır
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      conversationId: string;
    }) => removeReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji, conversationId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) });

      queryClient.setQueryData(
        messageKeys.list(conversationId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: any) => {
                if (msg.id !== messageId) return msg;

                const existingReactions = msg.message_reactions || [];
                const updatedReactions = existingReactions
                  .map((r: any) => {
                    if (r.emoji !== emoji) return r;
                    const newCount = r.count - 1;
                    return newCount > 0
                      ? { ...r, count: newCount, hasReacted: false }
                      : null;
                  })
                  .filter(Boolean);

                return {
                  ...msg,
                  message_reactions: updatedReactions,
                };
              }),
            })),
          };
        }
      );
    },
  });
}
