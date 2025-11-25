/**
 * Profile View Types
 * Profil görüntüleme için type definitions
 */

// Profile type - user veya creator
export type ProfileType = "user" | "creator";

// View mode - kendi profil mi, başkasının mı
export type ViewMode = "own" | "other";

// Tab types
export type ProfileTab = "posts" | "media" | "likes";

// User role - creator belirleme için role kullan, is_creator deprecated!
export type UserRole = "user" | "creator" | "admin";

// Profile data from database (GÜNCEL YAPI)
export interface Profile {
  id: string; // profiles.id (UUID)
  user_id: string; // auth.users.id (UUID)
  type: "real" | "shadow";
  
  // Temel bilgiler
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url?: string | null; // Cover image (eklenecek)
  bio: string | null;
  gender: "male" | "female" | "lgbt" | null;
  location?: string | null; // Lokasyon (eklenecek)
  website?: string | null; // Website (eklenecek)
  
  // Role sistemi
  role: UserRole; // 'user' | 'creator' | 'admin' - CREATOR BURADAN!
  is_creator: boolean; // DEPRECATED! role kullan
  is_verified?: boolean; // Doğrulanmış hesap (eklenecek)
  
  // Vibe
  vibe_preferences: string[] | null;
  favorite_vibe: string | null;
  mood?: string | null;
  energy?: string | null;
  personality?: string | null;
  
  // Status
  is_active: boolean;
  banned_until: string | null;
  
  created_at: string;
  updated_at: string;
}

// Helper: Profile creator mı?
export function isCreatorProfile(profile: Profile): boolean {
  return profile.role === "creator";
}

// Profile stats
export interface ProfileStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
  likes_count?: number;
}

// Follow status
export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isPending?: boolean;
}

// Creator tier
export interface CreatorTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  benefits: string[];
  subscriberCount?: number;
}

// Creator info
export interface CreatorInfo {
  tiers: CreatorTier[];
  subscriberCount: number;
  totalEarnings?: number;
  isSubscribed?: boolean;
  currentTier?: CreatorTier;
}

// Social link
export interface SocialLink {
  id: string;
  platform: "instagram" | "twitter" | "tiktok" | "youtube" | "website" | "other";
  url: string;
  label?: string;
}

// Profile highlight (story highlights)
export interface ProfileHighlight {
  id: string;
  title: string;
  cover_url: string;
  story_count: number;
}

// Post item for grid
export interface ProfilePost {
  id: string;
  thumbnail_url: string;
  type: "image" | "video";
  like_count: number;
  comment_count: number;
  is_pinned?: boolean;
  is_exclusive?: boolean;
}

// Profile view props
export interface ProfileViewProps {
  profileId: string;
  viewMode: ViewMode;
  initialTab?: ProfileTab;
}

// Header props
export interface ProfileHeaderProps {
  profile: Profile;
  stats: ProfileStats;
  viewMode: ViewMode;
  followStatus?: FollowStatus;
  onFollowPress?: () => void;
  onMessagePress?: () => void;
  onMorePress?: () => void;
  onAvatarPress?: () => void;
  onStatsPress?: (type: "followers" | "following") => void;
}

// Creator header props
export interface CreatorHeaderProps extends ProfileHeaderProps {
  creatorInfo: CreatorInfo;
  onSubscribePress?: () => void;
  onTierSelect?: (tier: CreatorTier) => void;
}

// Action button variants
export type ActionButtonVariant = "primary" | "secondary" | "outline" | "ghost";

// More menu actions
export type MoreMenuAction = "share" | "block" | "report" | "copy_link" | "mute";

export interface MoreMenuOption {
  id: MoreMenuAction;
  label: string;
  icon: string;
  destructive?: boolean;
}

// Tab content props
export interface TabContentProps {
  profileId: string;
  viewMode: ViewMode;
  isCreator?: boolean;
}

// Skeleton props
export interface SkeletonProps {
  animated?: boolean;
}
