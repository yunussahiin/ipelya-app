/**
 * useMessageRealtime Hook
 *
 * Amaç: Mesaj realtime subscription yönetimi
 * Tarih: 2025-11-26
 *
 * Bu hook, Supabase Realtime Postgres Changes özelliğini kullanarak
 * mesaj INSERT/UPDATE/DELETE olaylarını dinler.
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMessageStore, useConversationStore } from "@/store/messaging";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@ipelya/types";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// =============================================
// TYPES
// =============================================

type MessagePayload = RealtimePostgresChangesPayload<{
  [key: string]: unknown;
}>;

// =============================================
// HOOKS
// =============================================

/**
 * Sohbet mesajları için realtime subscription
 */
export function useMessageRealtime(conversationId: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addMessage = useMessageStore((s) => s.addMessage);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const incrementUnread = useConversationStore((s) => s.incrementUnread);
  const updateConversation = useConversationStore((s) => s.updateConversation);

  useEffect(() => {
    if (!user || !conversationId) return;

    // Messages tablosu için channel oluştur
    const channel = supabase.channel(`messages:${conversationId}`);

    // INSERT - Yeni mesaj
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: MessagePayload) => {
        const newMessage = payload.new as Message;

        // Kendi mesajımız değilse ekle (kendi mesajımız optimistic update ile ekleniyor)
        if (newMessage.sender_id !== user.id) {
          addMessage(conversationId, newMessage);
          incrementUnread(conversationId);
        }

        // Conversation'ın last_message bilgisini güncelle
        updateConversation(conversationId, {
          last_message_at: newMessage.created_at,
          last_message_preview: {
            content: newMessage.content,
            content_type: newMessage.content_type,
            sender_name: null, // Profile bilgisi ayrıca fetch edilebilir
            is_mine: newMessage.sender_id === user.id,
          },
        });
      }
    );

    // UPDATE - Mesaj güncellendi
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: MessagePayload) => {
        const updatedMessage = payload.new as Message;

        // Silindi mi kontrol et
        if (updatedMessage.is_deleted) {
          removeMessage(conversationId, updatedMessage.id);
        } else {
          updateMessage(conversationId, updatedMessage.id, updatedMessage);
        }
      }
    );

    // DELETE - Mesaj silindi (hard delete durumunda)
    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: MessagePayload) => {
        const deletedMessage = payload.old as { id: string };
        if (deletedMessage?.id) {
          removeMessage(conversationId, deletedMessage.id);
        }
      }
    );

    // Subscribe
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[Realtime] Messages channel subscribed: ${conversationId}`);
      }
      if (status === "CHANNEL_ERROR") {
        console.error(`[Realtime] Messages channel error: ${conversationId}`);
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log(`[Realtime] Messages channel unsubscribing: ${conversationId}`);
      channel.unsubscribe();
    };
  }, [conversationId, user?.id]);

  return channelRef.current;
}

/**
 * Tüm sohbetler için yeni mesaj bildirimi
 * App seviyesinde bir kez çağrılmalı
 */
export function useGlobalMessageRealtime() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const incrementUnread = useConversationStore((s) => s.incrementUnread);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const activeConversationId = useConversationStore(
    (s) => s.activeConversationId
  );

  useEffect(() => {
    if (!user) return;

    // Kullanıcının katıldığı tüm sohbetlerdeki mesajları dinle
    // Bu, conversation_participants tablosu üzerinden yapılmalı
    // Şimdilik basit bir yaklaşım kullanıyoruz

    const channel = supabase.channel("messages:global");

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload: MessagePayload) => {
        const newMessage = payload.new as Message;

        // Kendi mesajımız değilse ve aktif sohbette değilse
        if (
          newMessage.sender_id !== user.id &&
          newMessage.conversation_id !== activeConversationId
        ) {
          // Kullanıcının bu sohbette olup olmadığını kontrol et
          const { data: participant } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", newMessage.conversation_id)
            .eq("user_id", user.id)
            .is("left_at", null)
            .single();

          if (participant) {
            incrementUnread(newMessage.conversation_id);
            updateConversation(newMessage.conversation_id, {
              last_message_at: newMessage.created_at,
            });
          }
        }
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, activeConversationId]);

  return channelRef.current;
}

/**
 * Message reactions için realtime subscription
 */
export function useReactionRealtime(conversationId: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateMessage = useMessageStore((s) => s.updateMessage);

  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase.channel(`reactions:${conversationId}`);

    // Reaction INSERT
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "message_reactions",
      },
      async (payload: MessagePayload) => {
        const reaction = payload.new as {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
        };

        // Mesajın bu sohbette olup olmadığını kontrol et
        const { data: message } = await supabase
          .from("messages")
          .select("id, conversation_id")
          .eq("id", reaction.message_id)
          .eq("conversation_id", conversationId)
          .single();

        if (message) {
          // Mesajın reactions'ını güncelle
          // Bu kısım daha detaylı implement edilebilir
        }
      }
    );

    // Reaction DELETE
    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "message_reactions",
      },
      (payload: MessagePayload) => {
        // Reaction silindi
        // Mesajın reactions'ını güncelle
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, user?.id]);

  return channelRef.current;
}
