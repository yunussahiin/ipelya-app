/**
 * usePresence Hook
 *
 * Amaç: Online durumu ve typing indicator yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook, Supabase Realtime Presence özelliğini kullanarak
 * kullanıcıların online durumunu ve typing indicator'larını yönetir.
 */

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { usePresenceStore } from "@/store/messaging";
import { useAuth } from "@/hooks/useAuth";
import type { UserPresence, PresenceStatus } from "@ipelya/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Stable empty array reference
const EMPTY_TYPING_ARRAY: string[] = [];

// =============================================
// HOOKS
// =============================================

/**
 * Global presence tracking hook
 * App başlatıldığında bir kez çağrılmalı
 */
export function useGlobalPresence() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    // Presence channel oluştur
    const channel = supabase.channel("presence:global", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Sync event - tüm online kullanıcılar
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: Record<string, UserPresence> = {};

      Object.entries(state).forEach(([key, presences]) => {
        if (presences && presences.length > 0) {
          const presence = presences[0] as UserPresence;
          users[key] = presence;
        }
      });

      usePresenceStore.getState().setOnlineUsers(users);
    });

    // Join event - yeni kullanıcı online oldu
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (newPresences && newPresences.length > 0) {
        const presence = newPresences[0] as UserPresence;
        usePresenceStore.getState().setOnlineUser(key, presence);
      }
    });

    // Leave event - kullanıcı offline oldu
    channel.on("presence", { event: "leave" }, ({ key }) => {
      usePresenceStore.getState().removeOnlineUser(key);
    });

    // Subscribe ve track
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          status: "online" as PresenceStatus,
          online_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          device: "mobile",
        });
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Status güncelleme fonksiyonu
  const updateStatus = useCallback(
    async (status: PresenceStatus) => {
      if (channelRef.current && user) {
        await channelRef.current.track({
          user_id: user.id,
          status,
          online_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          device: "mobile",
        });
      }
    },
    [user?.id]
  );

  return { updateStatus };
}

/**
 * Conversation-specific presence hook
 * Typing indicator için kullanılır
 */
export function useConversationPresence(conversationId: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !conversationId) return;

    // Conversation channel oluştur
    const channel = supabase.channel(`conversation:${conversationId}`);

    // Typing event dinle
    channel.on("broadcast", { event: "typing" }, (payload) => {
      const { user_id, is_typing } = payload.payload as {
        user_id: string;
        is_typing: boolean;
      };

      if (user_id === user.id) return; // Kendi typing event'imizi ignore et

      const store = usePresenceStore.getState();
      if (is_typing) {
        store.setTyping(conversationId, user_id);
      } else {
        store.clearTyping(conversationId, user_id);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
      usePresenceStore.getState().clearAllTyping(conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user?.id]);

  /**
   * Typing başladığını bildirir
   * Debounced - 3 saniye sonra otomatik stop
   */
  const startTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    // Önceki timeout'u temizle
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Typing event gönder
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        is_typing: true,
      },
    });

    // 3 saniye sonra otomatik stop
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [user?.id]);

  /**
   * Typing bittiğini bildirir
   */
  const stopTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    // Timeout'u temizle
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Stop event gönder
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        is_typing: false,
      },
    });
  }, [user?.id]);

  return { startTyping, stopTyping };
}

/**
 * Belirli bir kullanıcının online durumunu döndürür
 */
export function useUserOnlineStatus(userId: string) {
  const presence = usePresenceStore((s) => s.onlineUsers[userId]);
  return {
    isOnline: !!presence,
    status: presence?.status || "offline",
    lastSeen: presence?.last_seen_at,
  };
}

/**
 * Kullanıcının online olup olmadığını döndürür (basit versiyon)
 */
export function useIsUserOnline(userId: string): boolean {
  const presence = usePresenceStore((s) => s.onlineUsers[userId]);
  return !!presence;
}

/**
 * Sohbette yazıyor olan kullanıcıları döndürür
 */
export function useTypingIndicator(conversationId: string) {
  const typingUserIds = usePresenceStore(
    (s) => s.typingUsers[conversationId] ?? EMPTY_TYPING_ARRAY
  );
  return typingUserIds;
}
