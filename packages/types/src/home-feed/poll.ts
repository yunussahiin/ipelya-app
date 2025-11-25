/**
 * Poll Type Definitions
 * 
 * Amaç: Anket (poll) type'larını tanımlar
 * 
 * Exports:
 * - Poll: Ana poll type
 * - PollOption: Anket seçeneği
 * - CreatePollRequest: Poll oluşturma request
 * - VotePollRequest: Oy verme request
 */

import type { PostUser } from './post';

/**
 * Poll Option
 * Anket seçeneği
 */
export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  display_order: number;
  votes_count: number;
  percentage?: number; // Calculated client-side
  created_at: string;
}

/**
 * Poll
 * Anket
 */
export interface Poll {
  id: string;
  user_id: string;
  user?: PostUser;
  profile_type: 'real' | 'shadow';
  
  // Content
  question: string;
  caption?: string; // Gönderi içeriği (question'dan farklıysa)
  options: PollOption[];
  
  // Settings
  multiple_choice: boolean;
  expires_at?: string;
  
  // Stats
  total_votes: number;
  
  // User interaction
  has_voted: boolean;
  voted_option_ids?: string[];
  
  // Timestamps
  created_at: string;
}

/**
 * Create Poll Request
 * Anket oluşturma request body
 */
export interface CreatePollRequest {
  question: string;
  options: string[]; // Min 2, max 10
  multiple_choice?: boolean;
  expires_at?: string;
  profile_type?: 'real' | 'shadow';
}

/**
 * Vote Poll Request
 * Ankete oy verme request body
 */
export interface VotePollRequest {
  poll_id: string;
  option_ids: string[]; // Single or multiple
}

/**
 * Poll Vote
 * Kullanıcının verdiği oy
 */
export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}
