/**
 * useFeed Hook
 * 
 * Amaç: Feed data management - React Query ile feed verilerini yönetir
 * 
 * Özellikler:
 * - Infinite scroll pagination
 * - Auto-refresh
 * - Cache management
 * - Vibe & Intent filtering
 * - Loading & error states
 * 
 * Kullanım:
 * const { data, isLoading, refetch, fetchNextPage } = useFeed({ tab: 'feed' });
 * 
 * Return:
 * - data: FeedItem[] (flattened pages)
 * - isLoading, isError, error
 * - refetch, fetchNextPage, hasNextPage
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@ipelya/api/home-feed';
import type { FeedParams } from '@ipelya/types';
import { useAuthStore } from '../../store/auth.store';

interface UseFeedParams {
  tab: 'feed' | 'trending' | 'following';
  vibe?: string;
  intent?: string;
}

export function useFeed({ tab, vibe, intent }: UseFeedParams) {
  const { sessionToken } = useAuthStore();
  
  // Supabase URL ve access token
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || '';
  
  // Infinite query
  const query = useInfiniteQuery({
    queryKey: ['feed', tab, vibe, intent],
    queryFn: async ({ pageParam }) => {
      console.log('🚀 Fetching feed:', {
        tab,
        cursor: pageParam,
        hasToken: !!accessToken,
        tokenLength: accessToken?.length
      });

      const params: FeedParams = {
        cursor: pageParam,
        limit: 20,
        vibe: vibe as any,
        intent: intent as any,
      };
      
      try {
        const response = await getFeed(supabaseUrl, accessToken, params);
        
        console.log('✅ Feed response:', {
          success: response.success,
          itemsCount: response.data?.items?.length,
          hasMore: response.data?.has_more,
          error: response.error
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Feed fetch failed');
        }
        
        return response.data;
      } catch (error) {
        console.error('❌ Feed fetch error:', error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (eski adı: cacheTime)
  });
  
  // Flatten pages
  const data = query.data?.pages.flatMap((page) => page.items) || [];
  
  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
