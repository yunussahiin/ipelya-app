/**
 * StoriesRow Types
 *
 * Story sistemi için tip tanımlamaları
 */

export type ReactionType = "heart" | "laugh" | "wow" | "sad" | "angry" | "fire";

export interface Story {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url: string | null;
  duration: number | null;
  caption: string | null;
  created_at: string;
  expires_at: string;
  is_viewed: boolean;
  views_count: number;
  reactions_count: number;
  user_reaction?: ReactionType | null;
}

export interface StoryUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  has_unviewed: boolean;
  latest_story_at: string;
  stories: Story[];
}

export interface StoriesRowProps {
  /** Story'ye tıklandığında */
  onStoryPress?: (user: StoryUser, storyIndex?: number) => void;
  /** Hikaye ekle butonuna tıklandığında */
  onAddStoryPress?: () => void;
  /** Yenileme callback'i */
  onRefresh?: () => void;
}

export interface StoryCircleProps {
  /** Kullanıcı bilgisi */
  user: StoryUser;
  /** Tıklama handler'ı */
  onPress: () => void;
  /** Hikaye ekle butonu tıklama handler'ı */
  onAddPress?: () => void;
  /** Boyut (varsayılan: 68) */
  size?: number;
  /** Kendi story'si mi */
  isOwn?: boolean;
  /** Ekle butonu göster (kendi hikayemiz için) */
  showAddButton?: boolean;
}

export interface AddStoryCircleProps {
  /** Kullanıcının avatar URL'i */
  avatarUrl?: string | null;
  /** Tıklama handler'ı */
  onPress: () => void;
  /** Boyut (varsayılan: 68) */
  size?: number;
}
