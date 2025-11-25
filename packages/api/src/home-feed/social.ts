/**
 * Social API Client
 * 
 * Amaç: Sosyal etkileşim endpoint'leri için API client
 * 
 * Functions:
 * - updateVibe(): Mood günceller
 * - updateIntent(): Dating intent günceller
 * - getSuggestions(): Profil önerileri getirir
 * - sendCrystalGift(): Dijital hediye gönderir
 */

import type {
  UpdateVibeRequest,
  UpdateIntentRequest,
  SendGiftRequest,
  UserVibe,
  UserIntent,
  CrystalGift,
} from '@ipelya/types';

/**
 * Update Vibe
 * Kullanıcı mood/vibe günceller
 */
export async function updateVibe(
  supabaseUrl: string,
  accessToken: string,
  data: UpdateVibeRequest
): Promise<{ success: boolean; data?: UserVibe; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/update-vibe`;
  
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
 * Update Intent
 * Dating intent günceller
 */
export async function updateIntent(
  supabaseUrl: string,
  accessToken: string,
  data: UpdateIntentRequest
): Promise<{ success: boolean; data?: UserIntent[]; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/update-intent`;
  
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
 * Get Suggestions
 * Profil önerileri getirir
 */
export async function getSuggestions(
  supabaseUrl: string,
  accessToken: string,
  params?: {
    limit?: number;
    vibe?: string;
    intent?: string;
  }
): Promise<{ success: boolean; data?: { profiles: any[] }; error?: string }> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.vibe) queryParams.append('vibe', params.vibe);
  if (params?.intent) queryParams.append('intent', params.intent);
  
  const url = `${supabaseUrl}/functions/v1/get-suggestions?${queryParams.toString()}`;
  
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
 * Send Crystal Gift
 * Dijital hediye gönderir
 */
export async function sendCrystalGift(
  supabaseUrl: string,
  accessToken: string,
  data: SendGiftRequest
): Promise<{ success: boolean; data?: CrystalGift; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/send-crystal-gift`;
  
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
 * Like Comment
 * Yorum beğenme/beğenmeden kaldırma (toggle)
 */
export async function likeComment(
  supabaseUrl: string,
  accessToken: string,
  commentId: string
): Promise<{ success: boolean; action?: 'liked' | 'unliked'; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/like-comment`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment_id: commentId }),
  });
  
  return response.json();
}
