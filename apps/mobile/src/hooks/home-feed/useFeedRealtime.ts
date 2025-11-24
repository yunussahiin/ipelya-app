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

export function useFeedRealtime(
  userId: string,
  onNewPost?: (post: any) => void,
  onPostUpdate?: (post: any) => void,
  onPostDelete?: (postId: string) => void
) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Supabase Realtime channel oluştur
    const channel = supabase
      .channel(`feed:user:${userId}`)
      .on('broadcast', { event: 'new_post' }, (payload) => {
        console.log('📬 New post:', payload);
        
        // Callback çağır
        if (onNewPost) {
          onNewPost(payload.payload);
        }
        
        // Feed cache'i invalidate et
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .on('broadcast', { event: 'post_update' }, (payload) => {
        console.log('🔄 Post updated:', payload);
        
        if (onPostUpdate) {
          onPostUpdate(payload.payload);
        }
        
        queryClient.invalidateQueries({ queryKey: ['feed'] });
      })
      .on('broadcast', { event: 'post_delete' }, (payload) => {
        console.log('🗑️ Post deleted:', payload);
        
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
