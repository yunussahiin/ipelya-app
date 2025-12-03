"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { TypingStatus } from "../types";

const TYPING_TIMEOUT = 3000; // 3 seconds

export function useTypingIndicator(conversationId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createBrowserSupabaseClient();

  // Stop typing - defined first to avoid reference error
  const stopTyping = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      await supabase
        .from("ops_typing_status")
        .update({ is_typing: false, updated_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("admin_id", currentUserId);
    } catch (error) {
      console.error("[useTypingIndicator] Error stopping typing:", error);
    }
  }, [conversationId, currentUserId, supabase]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    try {
      await supabase.from("ops_typing_status").upsert(
        {
          conversation_id: conversationId,
          admin_id: currentUserId,
          is_typing: true,
          updated_at: new Date().toISOString()
        },
        { onConflict: "conversation_id,admin_id" }
      );

      // Auto stop after timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, TYPING_TIMEOUT);
    } catch (error) {
      console.error("[useTypingIndicator] Error starting typing:", error);
    }
  }, [conversationId, currentUserId, supabase, stopTyping]);

  // Subscribe to typing status
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`ops:typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ops_typing_status",
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.new && (payload.new as TypingStatus).admin_id !== currentUserId) {
            const newStatus = payload.new as TypingStatus;
            
            if (newStatus.is_typing) {
              // Get admin name
              const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, username")
                .eq("user_id", newStatus.admin_id)
                .eq("type", "real")
                .single();

              setTypingUsers((prev) => {
                const filtered = prev.filter((t) => t.admin_id !== newStatus.admin_id);
                return [
                  ...filtered,
                  {
                    ...newStatus,
                    admin_name: profile?.display_name || profile?.username || "Admin"
                  }
                ];
              });
            } else {
              setTypingUsers((prev) => prev.filter((t) => t.admin_id !== newStatus.admin_id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      stopTyping();
    };
  }, [conversationId, currentUserId, supabase, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers: typingUsers.filter((t) => t.is_typing),
    startTyping,
    stopTyping
  };
}
