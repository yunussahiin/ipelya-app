/**
 * Feed Type Definitions
 * 
 * Amaç: Home Feed sisteminin tüm type tanımlarını içerir
 * 
 * Exports:
 * - FeedItem: Feed item wrapper
 * - ContentType: Content type enum
 * - FeedResponse: API response type
 * - FeedParams: API request params
 * 
 * Kullanım:
 * import { FeedItem, ContentType } from '@ipelya/types/feed';
 */

import { VibeType, IntentType } from './vibe';

/**
 * Content Type Enum
 * Feed'de görüntülenebilecek içerik tipleri
 */
export type ContentType =
  | 'post'
  | 'mini_post'
  | 'voice_moment'
  | 'poll'
  | 'suggestion'
  | 'vibe_block'
  | 'irl_event'
  | 'micro_group';

/**
 * Feed Item
 * Feed'deki her bir item'ın wrapper'ı
 */
export interface FeedItem {
  id: string;
  content_type: ContentType;
  content: any; // Post | MiniPost | VoiceMoment | Poll | etc.
  relevance_score: number;
  vibe_match_score?: number;
  intent_match_score?: number;
  social_graph_score?: number;
  created_at: string;
}

/**
 * Feed Request Parameters
 * get-feed endpoint için query parameters
 */
export interface FeedParams {
  cursor?: string;
  limit?: number;
  vibe?: VibeType;
  intent?: IntentType;
  content_types?: ContentType[];
}

/**
 * Feed Response
 * get-feed endpoint response
 */
export interface FeedResponse {
  success: boolean;
  data: {
    items: FeedItem[];
    next_cursor: string | null;
    has_more: boolean;
  };
  error?: string;
}


/**
 * User Interest
 * Kullanıcı ilgi alanı
 */
export interface UserInterest {
  id: string;
  user_id: string;
  interest_name: string;
  category?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
}
