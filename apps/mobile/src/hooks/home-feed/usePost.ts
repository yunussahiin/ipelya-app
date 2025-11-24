/**
 * usePost Hook
 * 
 * Amaç: Post interactions - Like, comment, share işlemleri
 * 
 * Özellikler:
 * - useLikePost: Post beğenme (optimistic update)
 * - useCommentPost: Yorum yapma
 * - useSharePost: Paylaşma
 * - Automatic cache invalidation
 * 
 * Kullanım:
 * const { likePost } = useLikePost();
 * await likePost.mutateAsync(postId);
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likePost, commentPost, sharePost } from '@ipelya/api/home-feed';
import type { CreateCommentRequest } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

/**
 * Like Post Hook
 * Post beğenme/beğenmeden kaldırma (toggle)
 */
export function useLikePost() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (postId: string) => likePost(supabaseUrl, accessToken, postId),
    onSuccess: () => {
      // Feed cache'i invalidate et
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Comment Post Hook
 * Post'a yorum yapma
 */
export function useCommentPost() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      commentPost(supabaseUrl, accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Share Post Hook
 * Post paylaşma
 */
export function useSharePost() {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = session?.access_token || '';
  
  return useMutation({
    mutationFn: (data: {
      post_id: string;
      share_type: 'dm' | 'external' | 'story';
      recipient_id?: string;
    }) => sharePost(supabaseUrl, accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
