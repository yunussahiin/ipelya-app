/**
 * Feed Viewer Types
 */

export interface FeedUser {
  user_id?: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_creator?: boolean;
}

export interface FeedMedia {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url?: string;
}

export interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

export interface FeedItem {
  id: string;
  content_type: "post" | "mini_post" | "poll" | "voice_moment";
  content: {
    id: string;
    caption?: string;
    content?: string;
    question?: string;
    background_style?: string;
    post_type?: "standard" | "vibe" | "time_capsule" | "exclusive" | "ppv";
    visibility?: "public" | "followers" | "subscribers" | "private";
    user: FeedUser;
    media?: FeedMedia[];
    options?: PollOption[];
    total_votes?: number;
    has_voted?: boolean;
    voted_option_id?: string;
    expires_at?: string;
    multiple_choice?: boolean;
    likes_count?: number;
    comments_count?: number;
    shares_count?: number;
    views_count?: number;
    duration?: number;
    plays_count?: number;
    audio_url?: string;
    is_liked?: boolean;
  };
  created_at: string;
  is_hidden?: boolean;
  is_flagged?: boolean;
  moderation_status?: "visible" | "hidden" | "deleted";
  moderated_at?: string;
  moderated_by?: string;
  last_moderation?: {
    action_type: string;
    reason_code?: string;
    reason_title?: string;
    admin_name?: string;
    created_at: string;
  };
}

export interface Comment {
  id: string;
  content: string;
  user: FeedUser;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  replies?: Comment[];
  replies_count?: number;
}

export interface PollVoter {
  id: string;
  user: FeedUser;
  option: {
    id: string;
    option_text: string;
  };
  voted_at: string;
}
