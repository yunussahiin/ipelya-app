/**
 * Posts API Client
 * 
 * Amaç: Post CRUD ve interaction endpoint'leri için API client
 * 
 * Functions:
 * - createPost(): Post oluşturur
 * - createMiniPost(): Mini post oluşturur
 * - likePost(): Post'u beğenir
 * - unlikePost(): Beğeniyi kaldırır
 * - commentPost(): Yorum yapar
 * - sharePost(): Paylaşır
 * - getPostDetails(): Post detaylarını getirir
 */

import type {
  Post,
  MiniPost,
  CreatePostRequest,
  CreateMiniPostRequest,
  CreateCommentRequest,
  PostComment,
} from '@ipelya/types';

/**
 * Create Post
 * Yeni post oluşturur
 */
export async function createPost(
  supabaseUrl: string,
  accessToken: string,
  data: CreatePostRequest
): Promise<{ success: boolean; data?: Post; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/create-post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

/**
 * Create Mini Post
 * Kısa metin paylaşımı oluşturur
 */
export async function createMiniPost(
  supabaseUrl: string,
  accessToken: string,
  data: CreateMiniPostRequest
): Promise<{ success: boolean; data?: MiniPost; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/create-mini-post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

/**
 * Like Post
 * Post'u beğenir (toggle)
 */
export async function likePost(
  supabaseUrl: string,
  accessToken: string,
  postId: string
): Promise<{ success: boolean; action?: 'liked' | 'unliked'; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/like-post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ post_id: postId }),
  });
  
  return response.json();
}

/**
 * Comment Post
 * Post'a yorum yapar
 */
export async function commentPost(
  supabaseUrl: string,
  accessToken: string,
  data: CreateCommentRequest
): Promise<{ success: boolean; data?: PostComment; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/comment-post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

/**
 * Share Post
 * Post'u paylaşır
 */
export async function sharePost(
  supabaseUrl: string,
  accessToken: string,
  data: {
    post_id: string;
    share_type: 'dm' | 'external' | 'story';
    recipient_id?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/share-post`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

/**
 * Get Post Details
 * Post detaylarını getirir (media, comments, stats)
 */
export async function getPostDetails(
  supabaseUrl: string,
  accessToken: string,
  postId: string
): Promise<{ success: boolean; data?: Post; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/get-post-details?post_id=${postId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

/**
 * Search Mentions
 * Mention autocomplete için kullanıcı arar
 */
export async function searchMentions(
  supabaseUrl: string,
  accessToken: string,
  query: string,
  limit: number = 10
): Promise<{ success: boolean; data?: { users: any[] }; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/search-mentions?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}
