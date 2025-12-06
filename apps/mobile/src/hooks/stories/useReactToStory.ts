/**
 * useReactToStory Hook
 * Story'ye tepki eklemek/kaldırmak için mutation hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/utils/logger";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export type StoryReactionType = "heart" | "laugh" | "wow" | "sad" | "angry" | "fire";

interface ReactToStoryParams {
  storyId: string;
  reactionType: StoryReactionType;
}

interface ReactToStoryResponse {
  success: boolean;
  action: "added" | "updated" | "removed";
  reaction_type: StoryReactionType | null;
  reactions_count: number;
}

async function reactToStory(
  params: ReactToStoryParams,
  token: string
): Promise<ReactToStoryResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/react-to-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      story_id: params.storyId,
      reaction_type: params.reactionType
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export function useReactToStory() {
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReactToStoryParams) => {
      if (!sessionToken) {
        throw new Error("Not authenticated");
      }
      return reactToStory(params, sessionToken);
    },
    onSuccess: () => {
      // Invalidate stories cache to refresh reaction counts
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (error) => {
      logger.error('React to story error', error, { tag: 'Stories' });
    }
  });
}
