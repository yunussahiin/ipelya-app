/**
 * usePostRealtime Hook
 * 
 * Amaç: Post realtime updates - Like, comment event'lerini dinler
 * 
 * Özellikler:
 * - Postgres changes subscription
 * - Like INSERT/DELETE events
 * - Comment INSERT events
 * - Automatic UI update
 * 
 * Kullanım:
 * usePostRealtime(postId, onLike, onUnlike, onComment);
 * 
 * Channels:
 * - post:{postId} - Post-specific updates
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export function usePostRealtime(
  postId: string,
  onLike?: () => void,
  onUnlike?: () => void,
  onComment?: (comment: any) => void
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!postId) return;
    
    // Supabase Realtime channel
    const channel = supabase
      .channel(`post:${postId}`)
      // Like INSERT event
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('❤️ New like:', payload);
          
          if (onLike) {
            onLike();
          }
          
          // Feed cache'i invalidate et
          queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
      )
      // Like DELETE event
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('💔 Like removed:', payload);
          
          if (onUnlike) {
            onUnlike();
          }
          
          queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
      )
      // Comment INSERT event
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('💬 New comment:', payload);
          
          if (onComment) {
            onComment(payload.new);
          }
          
          queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [postId, onLike, onUnlike, onComment, queryClient]);
}
