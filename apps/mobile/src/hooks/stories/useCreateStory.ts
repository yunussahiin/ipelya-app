/**
 * useCreateStory Hook
 *
 * Amaç: Story oluşturma - Media upload + API call
 *
 * Özellikler:
 * - Media upload (image, video)
 * - Story creation with media
 * - Automatic cache invalidation
 *
 * Kullanım:
 * const { mutateAsync: createStory, isPending } = useCreateStory();
 * await createStory({ mediaUri, caption });
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.store";
import { uploadMedia, queueMediaProcessing } from "../../services/media-upload.service";
import { logger } from "@/utils/logger";

interface CreateStoryParams {
  mediaUri: string;
  mediaType: "photo" | "video";
  caption?: string;
  duration?: number;
}

/**
 * Create Story Hook
 * Story oluşturma (media upload dahil)
 */
export function useCreateStory() {
  const queryClient = useQueryClient();
  const { sessionToken } = useAuthStore();

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  return useMutation({
    mutationFn: async (data: CreateStoryParams) => {
      const { mediaUri, mediaType, caption, duration } = data;

      // Decode JWT to get user ID
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const userId = payload.sub;

      // Upload media to stories bucket
      const uploadResult = await uploadMedia(mediaUri, userId, "stories", accessToken);

      // Queue media for background optimization (non-blocking)
      queueMediaProcessing(userId, uploadResult.path, accessToken, undefined, {
        preset: "story"
      }).catch(() => {});

      // Call create-story edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/create-story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          media_url: uploadResult.url,
          media_type: mediaType === "photo" ? "image" : "video",
          caption: caption || null,
          duration: duration || (mediaType === "video" ? 15 : 5)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Story oluşturulamadı");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Stories cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["user-stories"] });
    },
    onError: (error) => {
      logger.error('Story creation error', error, { tag: 'Stories' });
    }
  });
}
