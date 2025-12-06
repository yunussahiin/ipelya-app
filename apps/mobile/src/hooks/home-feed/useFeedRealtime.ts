/**
 * useFeedRealtime Hook
 * 
 * Amaç: Feed realtime updates - Yeni post, update, delete event'lerini dinler
 * 
 * Özellikler:
 * - Supabase Realtime channel subscription
 * - New post broadcast
 * - Post update broadcast
 * - Post delete broadcast
 * - Automatic feed refresh
 * 
 * Kullanım:
 * useFeedRealtime(userId, onNewPost, onPostUpdate, onPostDelete);
 * 
 * Channels:
 * - feed:user:{userId} - Kullanıcıya özel feed updates
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

interface FeedPost {
  id: string;
  [key: string]: unknown;
}

export function useFeedRealtime(
  userId: string,
  onNewPost?: (post: FeedPost) => void,
  onPostUpdate?: (post: FeedPost) => void,
  onPostDelete?: (postId: string) => void
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Supabase Realtime channel oluştur
    const channel = supabase
      .channel(`feed:user:${userId}`)
      .on('broadcast', { event: 'new_post' }, (payload) => {
        if (onNewPost) {
          onNewPost(payload.payload);
        }
        
        // Feed cache'i invalidate et
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .on('broadcast', { event: 'post_update' }, (payload) => {
        if (onPostUpdate) {
          onPostUpdate(payload.payload);
        }
        
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .on('broadcast', { event: 'post_delete' }, (payload) => {
        if (onPostDelete) {
          onPostDelete(payload.payload.post_id);
        }
        
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .subscribe();
    
    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNewPost, onPostUpdate, onPostDelete, queryClient]);
}
