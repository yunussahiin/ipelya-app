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
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMessageStore, useConversationStore } from "@/store/messaging";
import { useAuth } from "@/hooks/useAuth";
import { messageKeys } from "./useMessages";
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
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

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
      async (payload: MessagePayload) => {
        console.log("[Realtime] New message received:", payload.new);
        const newMessage = payload.new as Message;
        const msgStore = useMessageStore.getState();
        const convStore = useConversationStore.getState();

        // Kendi mesajımız değilse ekle (kendi mesajımız optimistic update ile ekleniyor)
        if (newMessage.sender_id !== user.id) {
          // Sender profile bilgisini çek
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, username")
            .eq("user_id", newMessage.sender_id)
            .eq("type", "real")
            .single();

          // Reply bilgisini çek (eğer varsa)
          let replyTo = null;
          if (newMessage.reply_to_id) {
            const { data: replyMessage } = await supabase
              .from("messages")
              .select(`
                id,
                content,
                content_type,
                sender_id,
                sender_profile:profiles!sender_profile_id (
                  id,
                  display_name,
                  username
                )
              `)
              .eq("id", newMessage.reply_to_id)
              .single();
            replyTo = replyMessage;
          }

          const messageWithProfile = {
            ...newMessage,
            sender_profile: profile || null,
            reply_to: replyTo,
          };

          console.log("[Realtime] Adding message to React Query cache:", messageWithProfile.id);
          
          // React Query cache'ine ekle
          queryClient.setQueryData(
            messageKeys.list(conversationId),
            (oldData: any) => {
              if (!oldData?.pages?.[0]) return oldData;
              return {
                ...oldData,
                pages: [
                  {
                    ...oldData.pages[0],
                    data: [messageWithProfile, ...oldData.pages[0].data],
                  },
                  ...oldData.pages.slice(1),
                ],
              };
            }
          );
          
          convStore.incrementUnread(conversationId);
        }

        // Conversation'ın last_message bilgisini güncelle
        convStore.updateConversation(conversationId, {
          last_message_at: newMessage.created_at,
          last_message_preview: {
            content: newMessage.content,
            content_type: newMessage.content_type,
            sender_name: null,
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
        const msgStore = useMessageStore.getState();

        // Silindi mi kontrol et
        if (updatedMessage.is_deleted) {
          msgStore.removeMessage(conversationId, updatedMessage.id);
        } else {
          msgStore.updateMessage(conversationId, updatedMessage.id, updatedMessage);
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
          useMessageStore.getState().removeMessage(conversationId, deletedMessage.id);
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

  useEffect(() => {
    if (!user) return;

    console.log("[Realtime] Global messages subscribing...");
    const channel = supabase.channel("messages:global");

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload: MessagePayload) => {
        console.log("[Realtime] Global - New message:", payload.new);
        const newMessage = payload.new as Message;
        const convStore = useConversationStore.getState();
        const activeConversationId = convStore.activeConversationId;

        // Kendi mesajımız değilse ve aktif sohbette değilse
        if (
          newMessage.sender_id !== user.id &&
          newMessage.conversation_id !== activeConversationId
        ) {
          console.log("[Realtime] Global - Checking participant...");
          // Kullanıcının bu sohbette olup olmadığını kontrol et
          const { data: participant } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", newMessage.conversation_id)
            .eq("user_id", user.id)
            .is("left_at", null)
            .single();

          if (participant) {
            console.log("[Realtime] Global - Incrementing unread for:", newMessage.conversation_id);
            convStore.incrementUnread(newMessage.conversation_id);
            convStore.updateConversation(newMessage.conversation_id, {
              last_message_at: newMessage.created_at,
            });
          }
        }
      }
    );

    channel.subscribe((status) => {
      console.log("[Realtime] Global messages status:", status);
    });
    channelRef.current = channel;

    return () => {
      console.log("[Realtime] Global messages unsubscribing...");
      channel.unsubscribe();
    };
  }, [user?.id]);

  return channelRef.current;
}

/**
 * Message reactions için realtime subscription
 */
export function useReactionRealtime(conversationId: string) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

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
          // Mesajın reactions'ını güncelle - TODO: implement
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
      () => {
        // Reaction silindi - TODO: implement
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
