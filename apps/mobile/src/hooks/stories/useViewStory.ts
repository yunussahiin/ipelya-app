/**
 * useViewStory Hook
 * Story görüntülenme kaydı için mutation hook
 */

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

interface ViewStoryParams {
  storyId: string;
  metadata?: Record<string, unknown>;
}

async function viewStory(
  params: ViewStoryParams,
  token: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/view-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      story_id: params.storyId,
      metadata: params.metadata
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export function useViewStory() {
  const { sessionToken } = useAuthStore();

  return useMutation({
    mutationFn: (params: ViewStoryParams) => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }
      return viewStory(params, sessionToken);
    },
    onError: (error) => {
      console.error("[useViewStory] Error:", error);
    }
  });
}
