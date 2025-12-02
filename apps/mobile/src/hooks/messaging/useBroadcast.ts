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
  getBroadcastChannel,
  updateBroadcastChannel,
  addBroadcastReaction,
  removeBroadcastReaction
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
 * Tüm kanalları getirir (edge function kullanarak)
 * Hem sahip olunan hem üye olunan kanalları tek seferde çeker
 */
export function useBroadcastChannels() {
  const query = useQuery({
    queryKey: broadcastKeys.channels(),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { myChannels: [], joinedChannels: [] };
      }

      const response = await supabase.functions.invoke("get-broadcast-channels", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      return response.data?.data || { myChannels: [], joinedChannels: [] };
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });

  // Store'u data değiştiğinde güncelle
  useEffect(() => {
    if (query.data) {
      const { myChannels, joinedChannels } = query.data;
      useBroadcastStore.getState().setMyChannels(myChannels || []);
      useBroadcastStore.getState().setJoinedChannels(joinedChannels || []);
    }
  }, [query.data]);

  return query;
}

/**
 * Creator'ın kendi kanallarını getirir
 * @deprecated useBroadcastChannels kullan
 */
export function useMyBroadcastChannels() {
  const query = useQuery({
    queryKey: broadcastKeys.myChannels(),
    queryFn: async () => {
      console.log("📡 [useMyBroadcastChannels] Edge function çağrılıyor...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const response = await supabase.functions.invoke("get-broadcast-channels", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data?.data?.myChannels || [];
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
 * Yeni kanal oluşturur (Edge Function ile)
 */
export function useCreateBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateBroadcastChannelRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("create-broadcast-channel", {
        body: request,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Kanal oluşturulamadı");
      
      return response.data.data;
    },
    onSuccess: (channel) => {
      useBroadcastStore.getState().addChannel(channel, true);
      queryClient.invalidateQueries({ queryKey: broadcastKeys.channels() });
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
 * Kanala katılır (Edge Function ile)
 */
export function useJoinBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("join-broadcast-channel", {
        body: { channel_id: channelId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Kanala katılınamadı");
      
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: broadcastKeys.channels() });
    },
  });
}

/**
 * Kanaldan ayrılır (Edge Function ile)
 */
export function useLeaveBroadcastChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channel_id }: { channel_id: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("leave-broadcast-channel", {
        body: { channel_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Kanaldan ayrılınamadı");
      
      return channel_id;
    },
    onSuccess: (channelId) => {
      useBroadcastStore.getState().removeChannel(channelId);
      queryClient.invalidateQueries({ queryKey: broadcastKeys.channels() });
    },
  });
}

// =============================================
// MESSAGE HOOKS
// =============================================

/**
 * Kanal mesajlarını getirir (Edge Function ile - Infinite Scroll)
 * Realtime: Reactions değişikliklerini dinler
 */
export function useBroadcastMessages(channelId: string) {
  const queryClient = useQueryClient();
  
  const query = useInfiniteQuery({
    queryKey: broadcastKeys.channelMessages(channelId),
    queryFn: async ({ pageParam }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { data: [], nextCursor: null, hasMore: false };

      let url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-broadcast-messages?channel_id=${channelId}&limit=10`;
      if (pageParam) {
        url += `&cursor=${pageParam}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Mesajlar yüklenemedi");
      
      return await res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!channelId,
    staleTime: 1000 * 30,
  });

  // Realtime: Reactions değişikliklerini dinle
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`broadcast-reactions:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "broadcast_reactions",
        },
        (payload) => {
          console.log("🔔 [Realtime] Reaction change:", payload.eventType);
          // Sessizce refetch (loading göstermeden)
          queryClient.refetchQueries({
            queryKey: broadcastKeys.channelMessages(channelId),
            type: "active"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, queryClient]);

  // Tüm mesajları birleştir
  const allMessages = query.data?.pages.flatMap(page => page.data || []) || [];

  // Store'u güncelle
  useEffect(() => {
    if (allMessages.length > 0) {
      useBroadcastStore.getState().setMessages(channelId, allMessages);
    }
  }, [allMessages.length, channelId]);

  return {
    data: allMessages,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

/**
 * Yayın mesajı gönderir (Edge Function ile)
 */
export function useSendBroadcastMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SendBroadcastMessageRequest) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("send-broadcast-message", {
        body: request,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Mesaj gönderilemedi");
      
      return response.data.data;
    },
    onSuccess: (message) => {
      if (message) {
        useBroadcastStore.getState().addMessage(message.channel_id, message);
        queryClient.invalidateQueries({
          queryKey: broadcastKeys.channelMessages(message.channel_id),
        });
      }
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
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => {
      console.log("🚀 [useAddBroadcastReaction] Adding reaction via edge function:", { messageId, emoji });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("react-to-broadcast", {
        body: { message_id: messageId, emoji, action: "add" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Tepki eklenemedi");
      
      return response.data;
    },
    onMutate: async ({ channelId, messageId, emoji }) => {
      console.log("⏳ [useAddBroadcastReaction] Optimistic update:", { channelId, messageId, emoji });
      useBroadcastStore.getState().updateMessage(channelId, messageId, {
        my_reaction: emoji,
        reaction_count: 1,
      });
    },
    onSuccess: (data, { channelId }) => {
      console.log("✅ [useAddBroadcastReaction] Success:", data);
      // Realtime zaten güncelleyecek, ekstra refetch gerekmiyor
    },
    onError: (error) => {
      console.error("❌ [useAddBroadcastReaction] Error:", error);
    },
  });
}

/**
 * Yayın mesajından tepki kaldırır
 */
export function useRemoveBroadcastReaction() {
  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
      channelId: string;
    }) => {
      console.log("🗑️ [useRemoveBroadcastReaction] Removing reaction via edge function:", { messageId, emoji });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await supabase.functions.invoke("react-to-broadcast", {
        body: { message_id: messageId, emoji, action: "remove" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Tepki kaldırılamadı");
      
      return response.data;
    },
    onMutate: async ({ channelId, messageId }) => {
      useBroadcastStore.getState().updateMessage(channelId, messageId, {
        my_reaction: null,
      });
    },
    onSuccess: (data) => {
      console.log("✅ [useRemoveBroadcastReaction] Success:", data);
      // Realtime zaten güncelleyecek, ekstra refetch gerekmiyor
    },
  });
}

// =============================================
// MESSAGE ACTIONS HOOKS
// =============================================

/**
 * Yayın mesajını sabitle/kaldır
 */
export function usePinBroadcastMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      pin,
    }: {
      messageId: string;
      pin?: boolean;
      channelId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/pin-broadcast-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message_id: messageId, pin }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Sabitleme başarısız");
      }

      return res.json();
    },
    onSuccess: (_, { channelId }) => {
      queryClient.refetchQueries({
        queryKey: broadcastKeys.channelMessages(channelId),
        type: "active"
      });
    },
  });
}

/**
 * Yayın mesajını sil (soft delete)
 */
export function useDeleteBroadcastMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
    }: {
      messageId: string;
      channelId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-broadcast-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message_id: messageId }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Silme başarısız");
      }

      return res.json();
    },
    onSuccess: (_, { channelId }) => {
      queryClient.refetchQueries({
        queryKey: broadcastKeys.channelMessages(channelId),
        type: "active"
      });
    },
  });
}

// =============================================
// SCHEDULED MESSAGE HOOKS
// =============================================

/**
 * Zamanlanmış mesaj oluştur
 */
export function useScheduleBroadcastMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      content,
      contentType,
      mediaUrl,
      mediaMetadata,
      scheduledAt,
    }: {
      channelId: string;
      content?: string;
      contentType?: string;
      mediaUrl?: string;
      mediaMetadata?: Record<string, any>;
      scheduledAt: Date;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/schedule-broadcast-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel_id: channelId,
            content,
            content_type: contentType,
            media_url: mediaUrl,
            media_metadata: mediaMetadata,
            scheduled_at: scheduledAt.toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Zamanlama başarısız");
      }

      return res.json();
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: ["scheduledMessages", channelId],
      });
    },
  });
}

/**
 * Zamanlanmış mesajları listele
 */
export function useScheduledBroadcastMessages(channelId: string) {
  return useQuery({
    queryKey: ["scheduledMessages", channelId],
    queryFn: async () => {
      console.log("📅 [useScheduledBroadcastMessages] Fetching for channel:", channelId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log("📅 [useScheduledBroadcastMessages] No session");
        throw new Error("Oturum bulunamadı");
      }

      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/schedule-broadcast-message?action=list&channel_id=${channelId}`;
      console.log("📅 [useScheduledBroadcastMessages] URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log("📅 [useScheduledBroadcastMessages] Response status:", res.status);

      if (!res.ok) {
        const error = await res.json();
        console.log("📅 [useScheduledBroadcastMessages] Error:", error);
        throw new Error(error.error || "Mesajlar alınamadı");
      }

      const data = await res.json();
      console.log("📅 [useScheduledBroadcastMessages] Data:", data);
      return data.messages || [];
    },
    enabled: !!channelId,
  });
}

/**
 * Zamanlanmış mesajı iptal et
 */
export function useCancelScheduledMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      channelId,
    }: {
      messageId: string;
      channelId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/schedule-broadcast-message?action=cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message_id: messageId }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "İptal başarısız");
      }

      return res.json();
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: ["scheduledMessages", channelId],
      });
    },
  });
}

// =============================================
// MEMBER MANAGEMENT HOOKS
// =============================================

type MemberAction = "mute" | "unmute" | "ban" | "unban";

/**
 * Üye yönetimi (susturma, engelleme)
 */
export function useManageBroadcastMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      action,
      durationHours,
      reason,
    }: {
      channelId: string;
      memberId: string;
      action: MemberAction;
      durationHours?: number;
      reason?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/manage-broadcast-member`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel_id: channelId,
            member_id: memberId,
            action,
            duration_hours: durationHours,
            reason,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "İşlem başarısız");
      }

      return res.json();
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({
        queryKey: broadcastKeys.channelMembers(channelId),
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
