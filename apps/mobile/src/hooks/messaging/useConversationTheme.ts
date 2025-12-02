/**
 * useConversationTheme Hook
 *
 * Amaç: Sohbet teması yönetimi + realtime güncellemeler
 * Tarih: 2025-12-02
 */

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseUrl } from "@/lib/supabaseClient";
import { useConversationStore } from "@/store/messaging";
import type { ChatThemeId } from "@/theme/chatThemes";

// =============================================
// TYPES
// =============================================

interface UpdateThemeParams {
  conversationId: string;
  theme: ChatThemeId;
}

export interface ThemeChangeEvent {
  id: string;
  themeId: ChatThemeId;
  changedBy: string;
  changedByName: string;
  isOwnChange: boolean;
  timestamp: number;
}

// =============================================
// MUTATION: Tema değiştir
// =============================================

export function useUpdateConversationTheme() {
  const queryClient = useQueryClient();
  const updateConversation = useConversationStore((s) => s.updateConversation);

  return useMutation({
    mutationFn: async ({ conversationId, theme }: UpdateThemeParams) => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const response = await fetch(`${supabaseUrl}/functions/v1/update-conversation-theme`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          theme
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tema değiştirilemedi");

      return { ...result, conversationId, theme };
    },
    onSuccess: (data, { conversationId, theme }) => {
      // Store'u hemen güncelle (optimistic)
      updateConversation(conversationId, { theme: theme as any });

      // Cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    }
  });
}

// =============================================
// HOOK: Tema değişikliklerini dinle (realtime)
// =============================================

export function useThemeChangeListener(conversationId: string, currentUserId?: string) {
  const [themeChanges, setThemeChanges] = useState<ThemeChangeEvent[]>([]);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const conversation = useConversationStore((s) => 
    s.conversations.find((c) => c.id === conversationId)
  );

  useEffect(() => {
    if (!conversationId) return;

    console.log("[useThemeChangeListener] Subscribing to theme changes for:", conversationId);

    // Conversations tablosundaki tema değişikliklerini dinle
    const channel = supabase
      .channel(`theme-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`
        },
        async (payload) => {
          console.log("[useThemeChangeListener] Received update:", payload);

          const newTheme = payload.new.theme as ChatThemeId;
          const changedBy = payload.new.theme_changed_by as string;

          // Tema değişmemişse işlem yapma
          if (!newTheme) {
            console.log("[useThemeChangeListener] No theme in payload, skipping");
            return;
          }

          // Kendi değişikliğimiz mi?
          const isOwnChange = changedBy === currentUserId;
          console.log("[useThemeChangeListener] Theme change:", { newTheme, changedBy, isOwnChange });

          // Store'u güncelle
          updateConversation(conversationId, { theme: newTheme as any });

          // Değiştiren kullanıcının adını al
          let changedByName = "Birisi";
          if (changedBy) {
            // Önce conversation'daki other_participant'tan almayı dene
            if (conversation?.other_participant?.user_id === changedBy) {
              changedByName = conversation.other_participant.display_name || 
                              conversation.other_participant.username || 
                              "Birisi";
              console.log("[useThemeChangeListener] Got name from conversation:", changedByName);
            } else {
              // Yoksa profiles tablosundan al
              console.log("[useThemeChangeListener] Fetching profile for:", changedBy);
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("display_name, username")
                .eq("user_id", changedBy)
                .single();
              
              console.log("[useThemeChangeListener] Profile result:", { profile, profileError });
              changedByName = profile?.display_name || profile?.username || "Birisi";
            }
          }

          // Değişiklik event'i ekle
          const event: ThemeChangeEvent = {
            id: `${Date.now()}-${Math.random()}`,
            themeId: newTheme,
            changedBy,
            changedByName,
            isOwnChange,
            timestamp: Date.now()
          };

          console.log("[useThemeChangeListener] Adding theme change event:", event);
          setThemeChanges((prev) => [...prev, event]);
        }
      )
      .subscribe((status) => {
        console.log("[useThemeChangeListener] Subscription status:", status);
      });

    return () => {
      console.log("[useThemeChangeListener] Unsubscribing from:", conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, updateConversation]);

  // Değişikliği kaldır
  const dismissChange = useCallback((id: string) => {
    setThemeChanges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Tüm değişiklikleri kaldır
  const dismissAllChanges = useCallback(() => {
    setThemeChanges([]);
  }, []);

  return {
    themeChanges,
    dismissChange,
    dismissAllChanges
  };
}
