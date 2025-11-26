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
  const setMyChannels = useBroadcastStore((s) => s.setMyChannels);

  return useQuery({
    queryKey: broadcastKeys.myChannels(),
    queryFn: getMyBroadcastChannels,
    select: (data) => {
      setMyChannels(data);
      return data;
    },
  });
}

/**
 * Kullanıcının üye olduğu kanalları getirir
 */
export function useJoinedBroadcastChannels() {
  const setJoinedChannels = useBroadcastStore((s) => s.setJoinedChannels);

  return useQuery({
    queryKey: broadcastKeys.joinedChannels(),
    queryFn: getJoinedBroadcastChannels,
    select: (data) => {
      setJoinedChannels(data);
      return data;
    },
  });
}

/**
 * Tüm kanalları getirir (hem sahip olunan hem üye olunan)
 */
export function useBroadcastChannels() {
  const myChannelsQuery = useMyBroadcastChannels();
  const joinedChannelsQuery = useJoinedBroadcastChannels();

  return {
    data: {
      myChannels: myChannelsQuery.data || [],
      joinedChannels: joinedChannelsQuery.data || [],
    },
    isLoading: myChannelsQuery.isLoading || joinedChannelsQuery.isLoading,
    isError: myChannelsQuery.isError || joinedChannelsQuery.isError,
    refetch: () => {
      myChannelsQuery.refetch();
      joinedChannelsQuery.refetch();
    },
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
  const addChannel = useBroadcastStore((s) => s.addChannel);

  return useMutation({
    mutationFn: (request: CreateBroadcastChannelRequest) =>
      createBroadcastChannel(request),
    onSuccess: (channel) => {
      addChannel(channel, true);
      queryClient.invalidateQueries({ queryKey: broadcastKeys.myChannels() });
    },
  });
}

/**
 * Kanal bilgilerini günceller
 */
export function useUpdateBroadcastChannel() {
  const queryClient = useQueryClient();
  const updateChannel = useBroadcastStore((s) => s.updateChannel);

  return useMutation({
    mutationFn: ({
      channelId,
      updates,
    }: {
      channelId: string;
      updates: Partial<CreateBroadcastChannelRequest>;
    }) => updateBroadcastChannel(channelId, updates),
    onSuccess: (channel) => {
      updateChannel(channel.id, channel);
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
  const removeChannel = useBroadcastStore((s) => s.removeChannel);

  return useMutation({
    mutationFn: (channelId: string) => leaveBroadcastChannel(channelId),
    onSuccess: (_, channelId) => {
      removeChannel(channelId);
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
  const setMessages = useBroadcastStore((s) => s.setMessages);
  const addMessages = useBroadcastStore((s) => s.addMessages);

  return useInfiniteQuery({
    queryKey: broadcastKeys.channelMessages(channelId),
    queryFn: async ({ pageParam }) => {
      const result = await getBroadcastMessages({
        channelId,
        limit: 20,
        cursor: pageParam,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId,
    select: (data) => {
      const allMessages = data.pages.flatMap((page) => page.data);

      if (data.pages.length === 1) {
        setMessages(channelId, allMessages);
      } else {
        const lastPage = data.pages[data.pages.length - 1];
        addMessages(channelId, lastPage.data);
      }

      return allMessages;
    },
  });
}

/**
 * Yayın mesajı gönderir
 */
export function useSendBroadcastMessage() {
  const queryClient = useQueryClient();
  const addMessage = useBroadcastStore((s) => s.addMessage);

  return useMutation({
    mutationFn: (request: SendBroadcastMessageRequest) =>
      sendBroadcastMessage(request),
    onSuccess: (message) => {
      addMessage(message.channel_id, message);
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
  const updateMessage = useBroadcastStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
      channelId,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => addBroadcastReaction(messageId, emoji),
    onMutate: async ({ channelId, messageId, emoji }) => {
      // Optimistic update
      updateMessage(channelId, messageId, {
        my_reaction: emoji,
        reaction_count: 1, // Bu değer doğru hesaplanmalı
      });
    },
  });
}

/**
 * Yayın mesajından tepki kaldırır
 */
export function useRemoveBroadcastReaction() {
  const updateMessage = useBroadcastStore((s) => s.updateMessage);

  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
      channelId,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => removeBroadcastReaction(messageId, emoji),
    onMutate: async ({ channelId, messageId }) => {
      // Optimistic update
      updateMessage(channelId, messageId, {
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
  const addMessage = useBroadcastStore((s) => s.addMessage);
  const updateMessage = useBroadcastStore((s) => s.updateMessage);

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
        addMessage(channelId, newMessage);
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
        updateMessage(channelId, updatedMessage.id, updatedMessage);
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
