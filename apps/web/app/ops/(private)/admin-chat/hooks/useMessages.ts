"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { OpsMessage, AdminProfile, ReplyTo, MessageLoadResult } from "../types";

const PAGE_SIZE = 10;

export function useMessages(conversationId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<OpsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const oldestMessageRef = useRef<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  // Load messages with pagination
  const loadMessages = useCallback(
    async (before?: string): Promise<MessageLoadResult> => {
      if (!conversationId) {
        return { messages: [], hasMore: false };
      }

      setIsLoading(true);
      try {
        let query = supabase
          .from("ops_messages")
          .select("id, conversation_id, sender_id, content, content_type, media_url, media_metadata, created_at, reply_to_id, read_by, is_edited, is_deleted")
          .eq("conversation_id", conversationId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);

        if (before) {
          query = query.lt("created_at", before);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          setHasMore(false);
          return { messages: [], hasMore: false };
        }

        // Get sender info
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        const { data: senders } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url, role")
          .in("user_id", senderIds)
          .eq("type", "real");

        const senderMap: Record<string, AdminProfile> = {};
        (senders || []).forEach((s) => {
          senderMap[s.user_id] = {
            id: s.user_id,
            full_name: s.display_name || s.username,
            email: null,
            is_active: true,
            avatar_url: s.avatar_url,
            role: s.role || "admin"
          };
        });

        // Get reply messages
        const replyToIds = data.filter((m) => m.reply_to_id).map((m) => m.reply_to_id);
        const replyToMap: Record<string, ReplyTo> = {};

        if (replyToIds.length > 0) {
          const { data: replyMessages } = await supabase
            .from("ops_messages")
            .select("id, content, sender_id")
            .in("id", replyToIds);

          (replyMessages || []).forEach((rm) => {
            const sender = senderMap[rm.sender_id];
            replyToMap[rm.id] = {
              id: rm.id,
              content: rm.content,
              sender_name: sender?.full_name || "Anonim"
            };
          });
        }

        const formattedMessages: OpsMessage[] = data.map((m) => ({
          ...m,
          sender: senderMap[m.sender_id] || null,
          reply_to: m.reply_to_id ? replyToMap[m.reply_to_id] || null : null
        }));

        // Reverse to show oldest first
        formattedMessages.reverse();

        const hasMoreMessages = data.length === PAGE_SIZE;
        setHasMore(hasMoreMessages);

        if (data.length > 0) {
          oldestMessageRef.current = data[data.length - 1].created_at;
        }

        return {
          messages: formattedMessages,
          hasMore: hasMoreMessages,
          oldestMessageId: data.length > 0 ? data[data.length - 1].id : undefined
        };
      } catch (error) {
        console.error("[useMessages] Error loading messages:", error);
        return { messages: [], hasMore: false };
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, supabase]
  );

  // Initial load
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(true);
      oldestMessageRef.current = null;
      return;
    }

    loadMessages().then((result) => {
      setMessages(result.messages);
    });
  }, [conversationId, loadMessages]);

  // Load more (older messages)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || messages.length === 0) return;

    const oldestMessage = messages[0];
    const result = await loadMessages(oldestMessage.created_at);
    
    if (result.messages.length > 0) {
      setMessages((prev) => [...result.messages, ...prev]);
    }
  }, [hasMore, isLoading, messages, loadMessages]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, replyToId?: string, mediaUrl?: string, contentType: string = "text", mediaMetadata?: object) => {
      console.log("[useMessages] Sending message:", {
        conversationId,
        currentUserId,
        content: content.substring(0, 50),
        contentType,
        mediaUrl: mediaUrl ? "present" : "none",
        replyToId
      });

      if (!conversationId || !currentUserId) {
        console.error("[useMessages] Missing conversationId or currentUserId");
        return null;
      }

      setIsSending(true);
      try {
        const messageData: Record<string, unknown> = {
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
          content_type: contentType
        };

        if (replyToId) messageData.reply_to_id = replyToId;
        if (mediaUrl) messageData.media_url = mediaUrl;
        if (mediaMetadata) messageData.media_metadata = mediaMetadata;

        console.log("[useMessages] Inserting message:", messageData);

        const { data, error } = await supabase
          .from("ops_messages")
          .insert(messageData)
          .select()
          .single();

        if (error) {
          console.error("[useMessages] Insert error:", error);
          throw error;
        }

        console.log("[useMessages] Message sent successfully:", data.id);
        return data;
      } catch (error) {
        console.error("[useMessages] Error sending message:", error);
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, currentUserId, supabase]
  );

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      await supabase
        .from("ops_conversation_participants")
        .update({ unread_count: 0, last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("admin_id", currentUserId);
    } catch (error) {
      console.error("[useMessages] Error marking as read:", error);
    }
  }, [conversationId, currentUserId, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`ops:messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ops_messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Get sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, avatar_url, role")
            .eq("user_id", payload.new.sender_id)
            .eq("type", "real")
            .single();

          const newMsg: OpsMessage = {
            ...(payload.new as OpsMessage),
            sender: sender
              ? {
                  id: sender.user_id,
                  full_name: sender.display_name || sender.username,
                  email: null,
                  is_active: true,
                  avatar_url: sender.avatar_url,
                  role: sender.role || "admin"
                }
              : null
          };

          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if not from me
          if (payload.new.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId, supabase, markAsRead]);

  return {
    messages,
    isLoading,
    hasMore,
    isSending,
    loadMore,
    sendMessage,
    markAsRead
  };
}
