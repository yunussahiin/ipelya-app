/**
 * Feed API Client
 * 
 * Amaç: Feed endpoint'leri için type-safe API client
 * 
 * Functions:
 * - getFeed(): Ana feed'i getirir
 * - getFeedTrending(): Trend olan içerikleri getirir
 * - getFeedFollowing(): Takip edilen kullanıcıların içerikleri
 * 
 * Kullanım:
 * import { getFeed } from '@ipelya/api/feed';
 * const feed = await getFeed({ limit: 20, vibe: 'energetic' });
 */

import type {
  FeedParams,
  FeedResponse,
  FeedItem,
} from '@ipelya/types';

/**
 * Get Feed
 * Ana feed'i getirir (algorithmic)
 */
export async function getFeed(
  supabaseUrl: string,
  accessToken: string,
  params?: FeedParams
): Promise<FeedResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.cursor) queryParams.append('cursor', params.cursor);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.vibe) queryParams.append('vibe', params.vibe);
  if (params?.intent) queryParams.append('intent', params.intent);
  if (params?.content_types) {
    params.content_types.forEach(type => queryParams.append('content_types', type));
  }
  
  const url = `${supabaseUrl}/functions/v1/get-feed?${queryParams.toString()}`;
  
  console.log('🔗 API Request:', { url, hasToken: !!accessToken });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  console.log('📦 API Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error Response:', errorText);
    throw new Error(`Feed fetch failed: ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('✅ API Data:', data);
  return data;
}

/**
 * Get Trending Feed
 * Trend olan içerikleri getirir
 */
export async function getFeedTrending(
  supabaseUrl: string,
  accessToken: string,
  params?: { limit?: number; time_range?: string }
): Promise<FeedResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.time_range) queryParams.append('time_range', params.time_range);
  
  const url = `${supabaseUrl}/functions/v1/get-feed-trending?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Trending feed fetch failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Refresh Feed
 * Feed'i yeniler (cache invalidation)
 */
export async function refreshFeed(
  supabaseUrl: string,
  accessToken: string
): Promise<void> {
  // Client-side cache invalidation
  // React Query kullanıldığında queryClient.invalidateQueries(['feed'])
}
