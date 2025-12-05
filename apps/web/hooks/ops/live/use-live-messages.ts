"use client";

/**
 * useLiveMessages Hook
 * Oturum mesajlarını React Query ile yönetir
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface LiveMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  message_type: "text" | "gift" | "system";
  is_deleted: boolean;
  deleted_by: string | null;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface MessagesResponse {
  messages: LiveMessage[];
  total: number;
}

async function fetchMessages(sessionId: string, limit = 50): Promise<MessagesResponse> {
  const response = await fetch(`/api/ops/live/sessions/${sessionId}/messages?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Mesajlar alınamadı");
  }
  return response.json();
}

async function deleteMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/ops/live/messages/${messageId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Mesaj silinemedi");
  }
}

export function useLiveMessages(sessionId: string | null, limit = 50) {
  return useQuery({
    queryKey: ["live-messages", sessionId, limit],
    queryFn: () => fetchMessages(sessionId!, limit),
    enabled: !!sessionId,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useDeleteMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-messages", sessionId] });
    },
  });
}
