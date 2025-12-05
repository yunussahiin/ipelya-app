/**
 * Live Sessions Hook
 * Aktif canlı yayınları listele ve realtime güncelle
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface LiveSessionItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  sessionType: 'video_live' | 'audio_room';
  accessType: 'public' | 'subscribers_only' | 'pay_per_view';
  ppvCoinPrice?: number;
  viewerCount: number;
  status: string;
  startedAt: string;
  creator: {
    id: string;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

interface UseLiveSessionsOptions {
  limit?: number;
  sessionType?: 'video_live' | 'audio_room' | 'all';
  accessType?: 'public' | 'subscribers_only' | 'pay_per_view' | 'all';
}

interface UseLiveSessionsResult {
  sessions: LiveSessionItem[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useLiveSessions(options?: UseLiveSessionsOptions): UseLiveSessionsResult {
  const { limit = 50, sessionType = 'all', accessType = 'all' } = options || {};
  
  const [sessions, setSessions] = useState<LiveSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('live_sessions')
        .select(`
          id,
          title,
          thumbnail_url,
          session_type,
          access_type,
          ppv_coin_price,
          total_viewers,
          status,
          started_at,
          creator_id,
          creator_profile_id,
          profiles!live_sessions_creator_profile_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('status', 'live')
        .order('total_viewers', { ascending: false })
        .limit(limit);

      // Session type filter
      if (sessionType !== 'all') {
        query = query.eq('session_type', sessionType);
      }

      // Access type filter
      if (accessType !== 'all') {
        query = query.eq('access_type', accessType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedSessions: LiveSessionItem[] = (data || []).map((session) => {
        // Supabase join sonucu array veya object olabilir
        const profileData = Array.isArray(session.profiles) 
          ? session.profiles[0] 
          : session.profiles;
        
        const profile = profileData as {
          id: string;
          user_id: string;
          display_name: string;
          avatar_url?: string;
          is_verified?: boolean;
        } | null;

        return {
          id: session.id,
          title: session.title || 'Canlı Yayın',
          thumbnailUrl: session.thumbnail_url,
          sessionType: session.session_type,
          accessType: session.access_type,
          ppvCoinPrice: session.ppv_coin_price,
          viewerCount: session.total_viewers || 0,
          status: session.status,
          startedAt: session.started_at,
          creator: {
            id: profile?.id || '',
            userId: profile?.user_id || session.creator_id,
            displayName: profile?.display_name || 'Kullanıcı',
            avatarUrl: profile?.avatar_url,
            isVerified: profile?.is_verified,
          },
        };
      });

      setSessions(formattedSessions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Yayınlar yüklenemedi'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, sessionType, accessType]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('live_sessions_list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Yeni session eklendi - refetch
            fetchSessions();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as { id: string; status: string; viewer_count: number };
            
            if (updated.status === 'ended') {
              // Session bitti - listeden kaldır
              setSessions((prev) => prev.filter((s) => s.id !== updated.id));
            } else {
              // Viewer count güncelle
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === updated.id
                    ? { ...s, viewerCount: updated.viewer_count || s.viewerCount }
                    : s
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            // Session silindi
            const deleted = payload.old as { id: string };
            setSessions((prev) => prev.filter((s) => s.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: fetchSessions,
  };
}
