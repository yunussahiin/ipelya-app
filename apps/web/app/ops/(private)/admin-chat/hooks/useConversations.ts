"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { OpsConversation, AdminProfile } from "../types";

export function useConversations(currentUserId: string | null) {
  const [conversations, setConversations] = useState<OpsConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data: participations, error } = await supabase
        .from("ops_conversation_participants")
        .select(`
          conversation_id,
          unread_count,
          can_write,
          conversation:ops_conversations (
            id, type, name, avatar_url, last_message_at, created_at, created_by
          )
        `)
        .eq("admin_id", currentUserId)
        .is("left_at", null);

      if (error || !participations?.length) {
        setConversations([]);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get all participants
      const { data: allParticipants } = await supabase
        .from("ops_conversation_participants")
        .select("conversation_id, admin_id, can_write, joined_at")
        .in("conversation_id", conversationIds)
        .is("left_at", null);

      // Get admin profiles - include current user
      const adminIds = [...new Set([
        currentUserId,
        ...(allParticipants || []).map((ap) => ap.admin_id)
      ])];
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, role")
        .in("user_id", adminIds)
        .eq("type", "real");

      // Get last messages
      const { data: lastMessages } = await supabase
        .from("ops_messages")
        .select("conversation_id, content, content_type")
        .in("conversation_id", conversationIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      // Build maps
      const adminMap: Record<string, AdminProfile> = {};
      (adminProfiles || []).forEach((ap) => {
        adminMap[ap.user_id] = {
          id: ap.user_id,
          full_name: ap.display_name || ap.username,
          email: null,
          is_active: true,
          avatar_url: ap.avatar_url,
          role: ap.role || "admin"
        };
      });

      const lastMessageMap: Record<string, string> = {};
      (lastMessages || []).forEach((m) => {
        if (!lastMessageMap[m.conversation_id]) {
          if (m.content_type === "text") {
            lastMessageMap[m.conversation_id] = m.content?.substring(0, 50) || "";
          } else {
            const typeLabels: Record<string, string> = {
              image: "📷 Fotoğraf",
              video: "🎥 Video",
              audio: "🎵 Ses",
              file: "📎 Dosya"
            };
            lastMessageMap[m.conversation_id] = typeLabels[m.content_type] || m.content_type;
          }
        }
      });

      // Build conversations
      const convs: OpsConversation[] = participations
        .filter((p) => p.conversation)
        .map((p) => {
          const convData = Array.isArray(p.conversation) ? p.conversation[0] : p.conversation;
          const conv = convData as {
            id: string;
            type: "direct" | "group";
            name: string | null;
            avatar_url: string | null;
            last_message_at: string | null;
            created_at: string;
          };

          const participants = (allParticipants || [])
            .filter((ap) => ap.conversation_id === p.conversation_id)
            .map((ap) => ({
              admin_id: ap.admin_id,
              admin: adminMap[ap.admin_id] || null,
              can_write: ap.can_write,
              joined_at: ap.joined_at
            }));

          return {
            ...conv,
            created_by: (convData as { created_by?: string }).created_by || null,
            participants,
            unread_count: p.unread_count || 0,
            last_message: lastMessageMap[conv.id] || null
          };
        });

      convs.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(convs);
    } catch (error) {
      console.error("[useConversations] Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, supabase]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("ops:conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ops_messages"
        },
        () => {
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ops_conversation_participants",
          filter: `admin_id=eq.${currentUserId}`
        },
        (payload) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === payload.new.conversation_id
                ? { ...c, unread_count: payload.new.unread_count || 0 }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, supabase, loadConversations]);

  const updateUnreadCount = useCallback((conversationId: string, count: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: count } : c))
    );
  }, []);

  const addConversation = useCallback((conversation: OpsConversation) => {
    setConversations((prev) => [conversation, ...prev]);
  }, []);

  const updateConversation = useCallback((conversation: OpsConversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? conversation : c))
    );
  }, []);

  return {
    conversations,
    isLoading,
    loadConversations,
    updateUnreadCount,
    addConversation,
    updateConversation
  };
}
