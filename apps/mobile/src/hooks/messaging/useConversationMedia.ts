/**
 * useConversationMedia Hook
 *
 * Amaç: Sohbetteki paylaşılan medyaları getir
 * Tarih: 2025-12-02
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase, supabaseUrl } from "@/lib/supabaseClient";

// =============================================
// TYPES
// =============================================

export interface MediaItem {
  id: string;
  type: "image" | "video" | "audio" | "file";
  url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  file_name?: string | null;
  file_size?: number | null;
  sender_id: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
}

type MediaType = "all" | "image" | "video" | "audio" | "file" | "none";

// =============================================
// QUERY KEYS
// =============================================

export const conversationMediaKeys = {
  all: ["conversation-media"] as const,
  list: (conversationId: string, type: MediaType) =>
    [...conversationMediaKeys.all, conversationId, type] as const
};

// =============================================
// HOOK
// =============================================

export function useConversationMedia(conversationId: string, type: MediaType = "all") {
  return useInfiniteQuery({
    queryKey: conversationMediaKeys.list(conversationId, type),
    queryFn: async ({ pageParam }) => {
      // "none" type için boş döndür (links tab)
      if (type === "none") {
        return { data: [] as MediaItem[], nextCursor: null };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      const params = new URLSearchParams({
        conversation_id: conversationId,
        type,
        limit: "30"
      });
      if (pageParam) params.set("cursor", pageParam);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-conversation-media?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Medya yüklenemedi");

      return {
        data: result.data as MediaItem[],
        nextCursor: result.nextCursor
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5 // 5 dakika cache
  });
}
