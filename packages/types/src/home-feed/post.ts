/**
 * Post Type Definitions
 * 
 * Amaç: Post ve ilgili type'ları tanımlar
 * 
 * Exports:
 * - Post: Ana post type
 * - PostMedia: Media type
 * - PostStats: İstatistik type
 * - PostVisibility: Görünürlük enum
 * - PostType: Post tipi enum
 */

/**
 * Post Visibility
 * Post'un kimler tarafından görülebileceği
 */
export type PostVisibility = 'public' | 'friends' | 'private';

/**
 * Post Type
 * Post'un tipi
 */
export type PostType = 'standard' | 'time_capsule' | 'anon';

/**
 * Media Type
 * Medya tipi (image/video)
 */
export type MediaType = 'image' | 'video';

/**
 * Post Media
 * Post'a ait medya dosyası
 */
export interface PostMedia {
  id: string;
  post_id: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number; // Video için (saniye)
  display_order: number;
  created_at: string;
}

/**
 * Post Stats
 * Post istatistikleri
 */
export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

/**
 * Post User
 * Post sahibi kullanıcı bilgileri
 */
export interface PostUser {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  verified?: boolean;
}

/**
 * Post
 * Ana post type (Instagram-style)
 */
export interface Post {
  id: string;
  user_id: string;
  user?: PostUser;
  profile_type: 'real' | 'shadow';
  
  // Content
  caption?: string;
  location?: string;
  media?: PostMedia[];
  
  // Metadata
  visibility: PostVisibility;
  post_type: PostType;
  
  // Stats
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  
  // User interaction
  is_liked?: boolean;
  is_bookmarked?: boolean;
  
  // Moderation
  is_flagged: boolean;
  is_hidden: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string; // For time capsules
}

/**
 * Mini Post
 * Kısa metin paylaşımı (Twitter-style)
 */
export interface MiniPost {
  id: string;
  user_id: string;
  user?: PostUser;
  profile_type: 'real' | 'shadow';
  content: string; // Max 280 chars
  is_anon: boolean;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  is_flagged: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Post Comment
 * Post yorumu (nested support)
 */
export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: PostUser;
  parent_comment_id?: string;
  content: string;
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  is_flagged: boolean;
  is_hidden: boolean;
  replies?: PostComment[]; // Nested replies
  created_at: string;
  updated_at: string;
}

/**
 * Create Post Request
 * Post oluşturma request body
 */
export interface CreatePostRequest {
  caption?: string;
  location?: string;
  media?: {
    type: MediaType;
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  visibility?: PostVisibility;
  post_type?: PostType;
  expires_at?: string;
  profile_type?: 'real' | 'shadow';
}

/**
 * Create Mini Post Request
 * Mini post oluşturma request body
 */
export interface CreateMiniPostRequest {
  content: string;
  is_anon?: boolean;
  profile_type?: 'real' | 'shadow';
}

/**
 * Create Comment Request
 * Yorum oluşturma request body
 */
export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}
