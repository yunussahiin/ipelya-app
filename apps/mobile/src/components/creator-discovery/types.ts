export type CreatorCategory =
  | "all"
  | "dance"
  | "music"
  | "gaming"
  | "lifestyle"
  | "fitness"
  | "art"
  | "comedy";

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  followerCount: number;
  likeCount: number;
  postCount?: number;
  category: CreatorCategory;
  isFollowing: boolean;
  isOnline?: boolean;
  isVerified?: boolean;
}

export interface CategoryItem {
  id: CreatorCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", label: "Tümü", icon: "🔥" },
  { id: "dance", label: "Dans", icon: "💃" },
  { id: "music", label: "Müzik", icon: "🎵" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "lifestyle", label: "Yaşam", icon: "✨" },
  { id: "fitness", label: "Fitness", icon: "💪" },
  { id: "art", label: "Sanat", icon: "🎨" },
  { id: "comedy", label: "Komedi", icon: "😂" }
];

// Hero slide type
export interface HeroSlide {
  id: string;
  type: "featured" | "discover" | "trending";
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaAction?: () => void;
  mainCreator: Creator;
  surroundingCreators: Creator[];
  gradientColors: [string, string, string];
}

// Mock data for development
export const MOCK_CREATORS: Creator[] = [
  {
    id: "1",
    username: "luna",
    displayName: "Luna",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    coverUrl: "https://picsum.photos/seed/luna/800/600",
    bio: "Dans ve müzik tutkunu 💃",
    followerCount: 12400,
    likeCount: 89000,
    postCount: 234,
    category: "dance",
    isFollowing: false,
    isOnline: true,
    isVerified: true
  },
  {
    id: "2",
    username: "maya",
    displayName: "Maya",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    coverUrl: "https://picsum.photos/seed/maya/800/600",
    bio: "Müzik prodüktörü 🎵",
    followerCount: 9700,
    likeCount: 67000,
    postCount: 156,
    category: "music",
    isFollowing: true,
    isOnline: false,
    isVerified: true
  },
  {
    id: "3",
    username: "jasmine",
    displayName: "Jasmine",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    coverUrl: "https://picsum.photos/seed/jasmine/800/600",
    bio: "Lifestyle & Fashion 👗",
    followerCount: 11000,
    likeCount: 78000,
    postCount: 312,
    category: "lifestyle",
    isFollowing: false,
    isOnline: true,
    isVerified: false
  },
  {
    id: "4",
    username: "alex",
    displayName: "Alex",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    coverUrl: "https://picsum.photos/seed/alex/800/600",
    bio: "Pro Gamer 🎮",
    followerCount: 8300,
    likeCount: 45000,
    postCount: 89,
    category: "gaming",
    isFollowing: false,
    isOnline: true,
    isVerified: true
  },
  {
    id: "5",
    username: "sophie",
    displayName: "Sophie",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
    coverUrl: "https://picsum.photos/seed/sophie/800/600",
    bio: "Fitness Coach 💪",
    followerCount: 15200,
    likeCount: 112000,
    postCount: 445,
    category: "fitness",
    isFollowing: true,
    isOnline: false,
    isVerified: true
  },
  {
    id: "6",
    username: "emma",
    displayName: "Emma",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
    coverUrl: "https://picsum.photos/seed/emma/800/600",
    bio: "Digital Artist 🎨",
    followerCount: 7800,
    likeCount: 56000,
    postCount: 178,
    category: "art",
    isFollowing: false,
    isOnline: true,
    isVerified: false
  },
  {
    id: "7",
    username: "olivia",
    displayName: "Olivia",
    avatarUrl: "https://i.pravatar.cc/150?img=7",
    coverUrl: "https://picsum.photos/seed/olivia/800/600",
    bio: "Stand-up Comedian 😂",
    followerCount: 6500,
    likeCount: 34000,
    postCount: 67,
    category: "comedy",
    isFollowing: false,
    isOnline: false,
    isVerified: true
  },
  {
    id: "8",
    username: "mia",
    displayName: "Mia",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
    coverUrl: "https://picsum.photos/seed/mia/800/600",
    bio: "Dance Instructor 💃",
    followerCount: 4200,
    likeCount: 28000,
    postCount: 123,
    category: "dance",
    isFollowing: false,
    isOnline: true,
    isVerified: false
  }
];

// Mock hero slides
export const MOCK_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    type: "featured",
    title: "Öne Çıkan",
    subtitle: "Luna ile Tanış",
    description: "Dans ve müzik dünyasının yıldızı Luna'yı keşfet",
    ctaText: "Profili Gör",
    mainCreator: MOCK_CREATORS[0],
    surroundingCreators: MOCK_CREATORS.slice(1, 5),
    gradientColors: ["#1a1a2e", "#16213e", "#0f3460"]
  },
  {
    id: "slide-2",
    type: "discover",
    title: "Keşfet",
    subtitle: "Yeni Yetenekler",
    description: "Bu hafta öne çıkan içerik üreticilerini keşfet",
    ctaText: "Keşfetmeye Başla",
    mainCreator: MOCK_CREATORS[4],
    surroundingCreators: [MOCK_CREATORS[0], MOCK_CREATORS[2], MOCK_CREATORS[3], MOCK_CREATORS[6]],
    gradientColors: ["#2d132c", "#801336", "#c72c41"]
  },
  {
    id: "slide-3",
    type: "trending",
    title: "Trend",
    subtitle: "En Popülerler",
    description: "Herkesin takip ettiği içerik üreticileri",
    ctaText: "Hepsini Gör",
    mainCreator: MOCK_CREATORS[2],
    surroundingCreators: [MOCK_CREATORS[1], MOCK_CREATORS[5], MOCK_CREATORS[7], MOCK_CREATORS[0]],
    gradientColors: ["#0d1b2a", "#1b263b", "#415a77"]
  }
];
