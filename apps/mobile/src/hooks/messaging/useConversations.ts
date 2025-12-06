/**
 * useConversations Hook
 *
 * Amaç: Sohbet listesi yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook, kullanıcının sohbetlerini getirir ve yönetir.
 * React Query ile caching ve infinite scroll desteği sağlar.
 */

import { useEffect } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useConversationStore } from "@/store/messaging";
import {
  createConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
} from "@ipelya/api";
import type { CreateConversationRequest } from "@ipelya/types";

// Conversation participant type
interface ConversationParticipant {
  user_id: string;
  profile?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    username?: string;
  };
}

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
  
  const query = useInfiniteQuery({
    queryKey: conversationKeys.list(archived),
    queryFn: async ({ pageParam }) => {
      // Session al
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Kullanıcı oturumu bulunamadı");

      // Edge function ile sohbetleri getir
      const params = new URLSearchParams({
        archived: String(archived),
        limit: "20",
      });
      if (pageParam) params.set("cursor", pageParam);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-conversations?${params}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sohbetler yüklenemedi");

      return { data: result.data, nextCursor: result.nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2, // 2 dakika cache
  });

  // Store'u data değiştiğinde güncelle
  const firstPageData = query.data?.pages?.[0]?.data;
  useEffect(() => {
    if (firstPageData) {
      useConversationStore.getState().setConversations(firstPageData);
    }
  }, [firstPageData]);

  return query;
}

/**
 * Tek bir sohbeti getirir
 * Store'da zaten varsa fetch yapmaz
 */
export function useConversation(conversationId: string) {
  // Store'da zaten var mı kontrol et
  const existsInStore = useConversationStore(
    (s) => s.conversations.some((c) => c.id === conversationId)
  );

  const query = useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_participants (
            user_id,
            profile:profiles (
              id,
              display_name,
              avatar_url,
              username
            )
          )
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Direct sohbetlerde karşı tarafın bilgisini ekle
      if (data.type === "direct" && data.conversation_participants) {
        const participants = data.conversation_participants as ConversationParticipant[];
        const otherParticipant = participants.find(
          (p) => p.user_id !== user.id
        );
        if (otherParticipant?.profile) {
          Object.assign(data, {
            other_participant: {
              user_id: otherParticipant.user_id,
              display_name: otherParticipant.profile.display_name,
              avatar_url: otherParticipant.profile.avatar_url,
              username: otherParticipant.profile.username,
            }
          });
        }
      }

      return data;
    },
    // Store'da varsa fetch yapma
    enabled: !!conversationId && !existsInStore,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Store'a ekle (sadece yeni veri geldiğinde)
  useEffect(() => {
    if (query.data && !existsInStore) {
      const conv = query.data;
      useConversationStore.getState().addConversation({
        id: conv.id as string,
        type: conv.type as "direct" | "group",
        name: (conv.name as string | null) ?? null,
        avatar_url: (conv.avatar_url as string | null) ?? null,
        last_message_at: (conv.last_message_at as string | null) ?? null,
        unread_count: 0,
        is_muted: (conv.is_muted as boolean) ?? false,
        other_participant: conv.other_participant as { user_id: string; display_name: string | null; avatar_url: string | null; username: string | null } | undefined,
      });
    }
  }, [query.data, existsInStore]);

  return query;
}

/**
 * Yeni sohbet oluşturur
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      createConversation(request),
    onSuccess: (conversation) => {
      // Store'a ekle
      useConversationStore.getState().addConversation({
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

  return useMutation({
    mutationFn: ({ conversationId, archive }: { conversationId: string; archive: boolean }) => 
      archive ? archiveConversation(conversationId) : unarchiveConversation(conversationId),
    onSuccess: (_, { conversationId, archive }) => {
      if (archive) {
        useConversationStore.getState().removeConversation(conversationId);
      }
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
 * Sohbeti sessize alır/açar
 */
export function useMuteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      mute,
      until,
    }: {
      conversationId: string;
      mute: boolean;
      until?: Date;
    }) => mute ? muteConversation(conversationId, until) : unmuteConversation(conversationId),
    onMutate: async ({ conversationId, mute }) => {
      // Optimistic update
      useConversationStore.getState().updateConversation(conversationId, { is_muted: mute });
      return { conversationId, previousMute: !mute };
    },
    onError: (_, __, context) => {
      // Rollback
      if (context) {
        useConversationStore.getState().updateConversation(
          context.conversationId, 
          { is_muted: context.previousMute }
        );
      }
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

  return useMutation({
    mutationFn: (conversationId: string) => unmuteConversation(conversationId),
    onMutate: async (conversationId) => {
      // Optimistic update
      useConversationStore.getState().updateConversation(conversationId, { is_muted: false });
      return { conversationId };
    },
    onError: (_, __, context) => {
      // Rollback
      if (context) {
        useConversationStore.getState().updateConversation(context.conversationId, { is_muted: true });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
