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

/**
 * Unvote Poll
 * Anketten oy kaldırır
 */
export async function unvotePoll(
  supabaseUrl: string,
  accessToken: string,
  pollId: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${supabaseUrl}/functions/v1/unvote-poll`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ poll_id: pollId }),
  });
  
  return response.json();
}

/**
 * Get Poll Voters
 * Ankete oy veren kullanıcıları getirir (sadece anket sahibi)
 */
export async function getPollVoters(
  supabaseUrl: string,
  accessToken: string,
  pollId: string,
  optionId?: string
): Promise<{ 
  success: boolean; 
  data?: {
    poll: { id: string; question: string };
    options: { id: string; option_text: string; votes_count: number }[];
    voters: {
      id: string;
      user: { user_id: string; username: string; display_name: string; avatar_url?: string };
      option: { option_text: string };
      voted_at: string;
    }[];
    total_votes: number;
  };
  error?: string 
}> {
  let url = `${supabaseUrl}/functions/v1/get-poll-voters?poll_id=${pollId}`;
  if (optionId) {
    url += `&option_id=${optionId}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}
