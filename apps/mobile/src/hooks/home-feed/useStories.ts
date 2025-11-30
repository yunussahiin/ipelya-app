/**
 * useStories Hook
 *
 * Takip edilen kullanıcıların hikayelerini getirir.
 * - React Query ile caching
 * - Kullanıcı bazlı gruplama
 * - Görüntülenme durumu
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
  duration: number | null;
  caption: string | null;
  created_at: string;
  expires_at: string;
  is_viewed: boolean;
  views_count: number;
  reactions_count: number;
}

interface StoryUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  has_unviewed: boolean;
  latest_story_at: string;
  stories: Story[];
}

interface GetStoriesResponse {
  success: boolean;
  users: StoryUser[];
}

interface UseStoriesOptions {
  /** Kendi hikayelerini dahil et */
  includeOwn?: boolean;
  /** Profil tipi (real/shadow) */
  profileType?: "real" | "shadow";
  /** Otomatik yenileme (ms) */
  refetchInterval?: number;
}

async function fetchStories(options: UseStoriesOptions): Promise<GetStoriesResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams();
  if (options.includeOwn) params.append("include_own", "true");
  if (options.profileType) params.append("profile_type", options.profileType);

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-stories?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch stories");
  }

  return response.json();
}

export function useStories(options: UseStoriesOptions = {}) {
  const { includeOwn = true, profileType = "real", refetchInterval } = options;

  return useQuery({
    queryKey: ["stories", { includeOwn, profileType }],
    queryFn: () => fetchStories({ includeOwn, profileType }),
    staleTime: 30 * 1000, // 30 saniye
    gcTime: 5 * 60 * 1000, // 5 dakika (eski cacheTime)
    refetchInterval,
    refetchOnWindowFocus: true
  });
}

// Re-export types
export type { Story, StoryUser, GetStoriesResponse, UseStoriesOptions };
