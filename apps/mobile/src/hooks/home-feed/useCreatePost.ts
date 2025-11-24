/**
 * useCreatePost Hook
 * 
 * Amaç: Post oluşturma - Media upload + API call
 * 
 * Özellikler:
 * - Media upload (image, video, audio)
 * - Thumbnail generation
 * - Post creation with media
 * - Automatic cache invalidation
 * 
 * Kullanım:
 * const { createPost, isLoading } = useCreatePost();
 * await createPost.mutateAsync({ caption, media });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@ipelya/api/home-feed';
import type { CreatePostRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';
import { uploadMultipleMedia } from '../../services/media-upload.service';

/**
 * Create Post Hook
 * Post oluşturma (media upload dahil)
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { sessionToken } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || '';
  
  return useMutation({
    mutationFn: async (data: CreatePostRequest & { mediaUris?: string[] }) => {
      const { mediaUris, ...postData } = data;
      
      // Upload media if present
      if (mediaUris && mediaUris.length > 0) {
        // Decode JWT to get user ID
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const userId = payload.sub; // 'sub' claim contains user ID
        
        const uploadResults = await uploadMultipleMedia(
          mediaUris,
          userId,
          'post-media',
          accessToken
        );
        
        // Add media URLs to post data
        postData.media = uploadResults.map(result => ({
          url: result.url,
          type: result.type as 'image' | 'video',
        }));
      }
      
      return createPost(supabaseUrl, accessToken, postData);
    },
    onSuccess: () => {
      // Feed cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error) => {
      console.error('Post oluşturma hatası:', error);
    },
  });
}
