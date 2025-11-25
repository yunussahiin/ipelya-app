// Types
export type {
  ProfileType,
  ViewMode,
  ProfileTab,
  UserRole,
  Profile,
  ProfileStats as ProfileStatsType,
  FollowStatus,
  CreatorTier,
  CreatorInfo,
  SocialLink,
  ProfileHighlight,
  ProfilePost,
  ProfileViewProps,
  ProfileHeaderProps,
  CreatorHeaderProps,
  ActionButtonVariant,
  MoreMenuAction,
  MoreMenuOption,
  TabContentProps,
  SkeletonProps
} from "./types";

// Helper functions
export { isCreatorProfile } from "./types";

// Header components
export {
  ProfileCover,
  ProfileAvatar,
  ProfileBadges,
  ProfileHeader,
  ProfileTopBar,
  PROFILE_COVER_HEIGHT,
  PROFILE_AVATAR_SIZE
} from "./header";

// Stats components
export { StatItem, ProfileStats } from "./stats";

// Action components
export {
  FollowButton,
  MessageButton,
  MoreMenuButton,
  MoreMenu,
  ProfileActions
} from "./actions";

// Section components
export { 
  VibeSheet, 
  StoryHighlights, 
  MutualFollowers, 
  AboutSection,
  SocialLinks,
  SubscriptionSheet,
  type Highlight, 
  type MutualFollower,
  type SocialLink as SocialLinkType
} from "./sections";

// Posts components
export { PostsGrid, PostFeedModal, type PostItem } from "./posts";

// Tab components
export { ProfileTabs, type MediaItem, type TabType } from "./tabs";

// Skeleton components
export { HeaderSkeleton, TabsSkeleton, ProfileSkeleton } from "./skeletons";
