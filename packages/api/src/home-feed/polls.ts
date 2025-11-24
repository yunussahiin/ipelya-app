/**
 * Polls API Client
 * 
 * Amaç: Poll (anket) endpoint'leri için API client
 * 
 * Functions:
 * - createPoll(): Anket oluşturur
 * - votePoll(): Ankete oy verir
 * - getPollResults(): Anket sonuçlarını getirir
 */

import type {
  Poll,
  CreatePollRequest,
  VotePollRequest,
} from '@ipelya/types';

/**
 * Create Poll
 * Yeni anket oluşturur
 */
export async function createPoll(
  supabaseUrl: string,
  accessToken: string,
  data: CreatePollRequest
): Promise<{ success: boolean; data?: Poll; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/create-poll`;
  
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
 * Vote Poll
 * Ankete oy verir
 */
export async function votePoll(
  supabaseUrl: string,
  accessToken: string,
  data: VotePollRequest
): Promise<{ success: boolean; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/vote-poll`;
  
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
