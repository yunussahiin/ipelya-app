/**
 * useBroadcast Hooks
 *
 * Amaç: Creator yayın kanalı yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook'lar, yayın kanallarını ve mesajlarını yönetir.
 */

import { useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useBroadcastStore } from "@/store/messaging";
import {
  getMyBroadcastChannels,
  getJoinedBroadcastChannels,
  getBroadcastChannel,
  createBroadcastChannel,
  updateBroadcastChannel,
  joinBroadcastChannel,
  leaveBroadcastChannel,
  getBroadcastMessages,
  sendBroadcastMessage,
  addBroadcastReaction,
  removeBroadcastReaction,
  voteBroadcastPoll,
} from "@ipelya/api";
import type {
  CreateBroadcastChannelRequest,
  SendBroadcastMessageRequest,
  BroadcastMessage,
} from "@ipelya/types";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// =============================================
// QUERY KEYS
// =============================================

export const broadcastKeys = {
  all: ["broadcast"] as const,
  channels: () => [...broadcastKeys.all, "channels"] as const,
  myChannels: () => [...broadcastKeys.channels(), "mine"] as const,
  joinedChannels: () => [...broadcastKeys.channels(), "joined"] as const,
  channel: (id: string) => [...broadcastKeys.channels(), id] as const,
  messages: () => [...broadcastKeys.all, "messages"] as const,
  channelMessages: (channelId: string) =>
    [...broadcastKeys.messages(), channelId] as const,
};

// =============================================
// CHANNEL HOOKS
// =============================================

/**
 * Creator'ın kendi kanallarını getirir
 */
export function useMyBroadcastChannels() {
  const query = useQuery({
    queryKey: broadcastKeys.myChannels(),
    queryFn: async () => {
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return [];

      const { data, error } = await supabase
        .from("broadcast_channels")
        .select("*")
        .eq("creator_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Store'u data değiştiğinde güncelle
  useEffect(() => {
    if (query.data) {
      useBroadcastStore.getState().setMyChannels(query.data);
    }
  }, [query.data]);

  return query;
}

/**
 * Kullanıcının üye olduğu kanalları getirir
 */
export function useJoinedBroadcastChannels() {
  const query = useQuery({
    queryKey: broadcastKeys.joinedChannels(),
    queryFn: async () => {
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return [];

      const { data, error } = await supabase
        .from("broadcast_channel_members")
        .select(`
          channel:broadcast_channels (
            id,
            name,
            description,
            avatar_url,
            member_count,
            message_count,
            creator_id,
            access_type,
            is_active,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .is("left_at", null);

      if (error) throw error;
      
      // Flatten channels
      const channels = (data || [])
        .map((item: any) => item.channel)
        .filter(Boolean);
      
      return channels;
    },
  });

  // Store'u data değiştiğinde güncelle
  useEffect(() => {
    if (query.data) {
      useBroadcastStore.getState().setJoinedChannels(query.data);
    }
  }, [query.data]);

  return query;
}

/**
 * Tüm kanalları getirir (Edge Function ile)
 */
export function useBroadcastChannels() {
  const query = useQuery({
    queryKey: broadcastKeys.channels(),
    queryFn: async () => {
      // Session al
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { myChannels: [], joinedChannels: [] };

      // Edge function ile kanalları getir
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-broadcast-channels`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Kanallar yüklenemedi");

      return result.data || { myChannels: [], joinedChannels: [] };
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });

  // Store'u güncelle
  useEffect(() => {
    if (query.data) {
      useBroadcastStore.getState().setMyChannels(query.data.myChannels);
      useBroadcastStore.getState().setJoinedChannels(query.data.joinedChannels);
    }
  }, [query.data]);

  return {
    data: query.data || { myChannels: [], joinedChannels: [] },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Tek bir kanalı getirir
 */
export function useBroadcastChannel(channelId: string) {
  return useQuery({
    queryKey: broadcastKeys.channel(channelId),
    queryFn: () => getBroadcastChannel(channelId),
    enabled: !!channelId,
  });
}

/**
 * Yeni kanal oluşturur
 */
export function useCreateBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBroadcastChannelRequest) =>
      createBroadcastChannel(request),
    onSuccess: (channel) => {
      useBroadcastStore.getState().addChannel(channel, true);
      queryClient.invalidateQueries({ queryKey: broadcastKeys.myChannels() });
    },
  });
}

/**
 * Kanal bilgilerini günceller
 */
export function useUpdateBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      updates,
    }: {
      channelId: string;
      updates: Partial<CreateBroadcastChannelRequest>;
    }) => updateBroadcastChannel(channelId, updates),
    onSuccess: (channel) => {
      useBroadcastStore.getState().updateChannel(channel.id, channel);
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.channel(channel.id),
      });
    },
  });
}

/**
 * Kanala katılır
 */
export function useJoinBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => joinBroadcastChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.joinedChannels(),
      });
    },
  });
}

/**
 * Kanaldan ayrılır
 */
export function useLeaveBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => leaveBroadcastChannel(channelId),
    onSuccess: (_, channelId) => {
      useBroadcastStore.getState().removeChannel(channelId);
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.joinedChannels(),
      });
    },
  });
}

// =============================================
// MESSAGE HOOKS
// =============================================

/**
 * Kanal mesajlarını getirir (infinite scroll)
 */
export function useBroadcastMessages(channelId: string) {
  const query = useInfiniteQuery({
    queryKey: broadcastKeys.channelMessages(channelId),
    queryFn: async ({ pageParam }) => {
      const result = await getBroadcastMessages({
        channelId,
        limit: 20,
        cursor: pageParam,
      });
      return { ...result, isFirstPage: !pageParam };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId,
  });

  // Store'u data değiştiğinde güncelle
  const pages = query.data?.pages;
  useEffect(() => {
    if (!pages || pages.length === 0) return;

    const store = useBroadcastStore.getState();
    const lastPage = pages[pages.length - 1];

    if (pages.length === 1) {
      store.setMessages(channelId, lastPage.data);
    } else {
      store.addMessages(channelId, lastPage.data);
    }
  }, [pages, channelId]);

  return query;
}

/**
 * Yayın mesajı gönderir
 */
export function useSendBroadcastMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendBroadcastMessageRequest) =>
      sendBroadcastMessage(request),
    onSuccess: (message) => {
      useBroadcastStore.getState().addMessage(message.channel_id, message);
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.channelMessages(message.channel_id),
      });
    },
  });
}

// =============================================
// REACTION HOOKS
// =============================================

/**
 * Yayın mesajına tepki ekler
 */
export function useAddBroadcastReaction() {
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => addBroadcastReaction(messageId, emoji),
    onMutate: async ({ channelId, messageId, emoji }) => {
      // Optimistic update
      useBroadcastStore.getState().updateMessage(channelId, messageId, {
        my_reaction: emoji,
        reaction_count: 1,
      });
    },
  });
}

/**
 * Yayın mesajından tepki kaldırır
 */
export function useRemoveBroadcastReaction() {
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => removeBroadcastReaction(messageId, emoji),
    onMutate: async ({ channelId, messageId }) => {
      // Optimistic update
      useBroadcastStore.getState().updateMessage(channelId, messageId, {
        my_reaction: null,
      });
    },
  });
}

// =============================================
// POLL HOOKS
// =============================================

/**
 * Ankete oy verir
 */
export function useVoteBroadcastPoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pollId,
      optionIds,
    }: {
      pollId: string;
      optionIds: string[];
      channelId: string;
    }) => voteBroadcastPoll(pollId, optionIds),
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.channelMessages(channelId),
      });
    },
  });
}

// =============================================
// REALTIME HOOKS
// =============================================

/**
 * Broadcast mesajları için realtime subscription
 */
export function useBroadcastRealtime(channelId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const channel = supabase.channel(`broadcast:${channelId}`);

    // Yeni mesaj
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "broadcast_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const newMessage = payload.new as BroadcastMessage;
        useBroadcastStore.getState().addMessage(channelId, newMessage);
      }
    );

    // Mesaj güncellendi
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "broadcast_messages",
        filter: `channel_id=eq.${channelId}`,
      },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const updatedMessage = payload.new as BroadcastMessage;
        useBroadcastStore.getState().updateMessage(channelId, updatedMessage.id, updatedMessage);
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [channelId]);

  return channelRef.current;
}
