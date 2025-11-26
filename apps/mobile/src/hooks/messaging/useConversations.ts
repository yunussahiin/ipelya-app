/**
 * useConversations Hook
 *
 * Amaç: Sohbet listesi yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook, kullanıcının sohbetlerini getirir ve yönetir.
 * React Query ile caching ve infinite scroll desteği sağlar.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversationStore } from "@/store/messaging";
import {
  getConversations,
  createConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
} from "@ipelya/api";
import type { CreateConversationRequest, ConversationListItem } from "@ipelya/types";

// =============================================
// QUERY KEYS
// =============================================

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (archived: boolean) => [...conversationKeys.lists(), { archived }] as const,
  detail: (id: string) => [...conversationKeys.all, "detail", id] as const,
};

// =============================================
// HOOKS
// =============================================

/**
 * Sohbet listesini getirir (infinite scroll)
 */
export function useConversations(archived = false) {
  const setConversations = useConversationStore((s) => s.setConversations);

  return useInfiniteQuery({
    queryKey: conversationKeys.list(archived),
    queryFn: async ({ pageParam }) => {
      const result = await getConversations({
        limit: 20,
        cursor: pageParam,
        archived,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => {
      // Tüm sayfaları birleştir
      const allConversations = data.pages.flatMap((page) => page.data);
      // Store'u güncelle
      setConversations(allConversations);
      return allConversations;
    },
  });
}

/**
 * Yeni sohbet oluşturur
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const addConversation = useConversationStore((s) => s.addConversation);

  return useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      createConversation(request),
    onSuccess: (conversation) => {
      // Store'a ekle
      addConversation({
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatar_url: conversation.avatar_url,
        last_message_at: conversation.last_message_at,
        unread_count: 0,
        is_muted: false,
      });
      // Query'yi invalidate et
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

/**
 * Sohbeti arşivler
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const removeConversation = useConversationStore((s) => s.removeConversation);

  return useMutation({
    mutationFn: (conversationId: string) => archiveConversation(conversationId),
    onSuccess: (_, conversationId) => {
      removeConversation(conversationId);
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

/**
 * Sohbeti arşivden çıkarır
 */
export function useUnarchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      unarchiveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

/**
 * Sohbeti sessize alır
 */
export function useMuteConversation() {
  const queryClient = useQueryClient();
  const updateConversation = useConversationStore((s) => s.updateConversation);

  return useMutation({
    mutationFn: ({
      conversationId,
      until,
    }: {
      conversationId: string;
      until?: Date;
    }) => muteConversation(conversationId, until),
    onMutate: async ({ conversationId }) => {
      // Optimistic update
      updateConversation(conversationId, { is_muted: true });
    },
    onError: (_, { conversationId }) => {
      // Rollback
      updateConversation(conversationId, { is_muted: false });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

/**
 * Sohbet sesini açar
 */
export function useUnmuteConversation() {
  const queryClient = useQueryClient();
  const updateConversation = useConversationStore((s) => s.updateConversation);

  return useMutation({
    mutationFn: (conversationId: string) => unmuteConversation(conversationId),
    onMutate: async (conversationId) => {
      // Optimistic update
      updateConversation(conversationId, { is_muted: false });
    },
    onError: (_, conversationId) => {
      // Rollback
      updateConversation(conversationId, { is_muted: true });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
