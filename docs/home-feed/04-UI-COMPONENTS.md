# İpelya Home Feed - UI/UX Components

## 🎨 Genel Bakış

Bu döküman, İpelya Home Feed sisteminin tüm UI component'lerini, tasarım sistemini, renk paletini ve kullanım örneklerini içerir.

---

## 🎨 Design System

### Color Palette

**Light Mode:**
```typescript
const lightColors = {
  // Primary
  primary: '#FF6B9D',        // Ana marka rengi (pembe)
  primaryLight: '#FFB3D1',   // Açık pembe
  primaryDark: '#E5527A',    // Koyu pembe
  
  // Secondary
  secondary: '#4ECDC4',      // Turkuaz
  secondaryLight: '#A8E6E3', // Açık turkuaz
  secondaryDark: '#2BA39C',  // Koyu turkuaz
  
  // Neutral
  background: '#FFFFFF',     // Arka plan
  surface: '#F8F9FA',        // Kart arka planı
  border: '#E9ECEF',         // Kenarlık
  
  // Text
  textPrimary: '#212529',    // Ana metin
  textSecondary: '#6C757D',  // İkincil metin
  textTertiary: '#ADB5BD',   // Üçüncül metin
  
  // Status
  success: '#51CF66',        // Başarı (yeşil)
  warning: '#FFD43B',        // Uyarı (sarı)
  error: '#FF6B6B',          // Hata (kırmızı)
  info: '#4DABF7',           // Bilgi (mavi)
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};
```

**Dark Mode:**
```typescript
const darkColors = {
  // Primary
  primary: '#FF6B9D',
  primaryLight: '#FF8FB3',
  primaryDark: '#E5527A',
  
  // Secondary
  secondary: '#4ECDC4',
  secondaryLight: '#6FD9D1',
  secondaryDark: '#2BA39C',
  
  // Neutral
  background: '#121212',     // Arka plan
  surface: '#1E1E1E',        // Kart arka planı
  border: '#2C2C2C',         // Kenarlık
  
  // Text
  textPrimary: '#FFFFFF',    // Ana metin
  textSecondary: '#B0B0B0',  // İkincil metin
  textTertiary: '#808080',   // Üçüncül metin
  
  // Status
  success: '#51CF66',
  warning: '#FFD43B',
  error: '#FF6B6B',
  info: '#4DABF7',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
};
```

### Typography

```typescript
const typography = {
  // Font Families
  fontFamily: {
    primary: 'Inter',        // Ana font
    secondary: 'Poppins',    // Başlıklar için
    mono: 'JetBrains Mono',  // Kod için
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### Spacing

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};
```

### Border Radius

```typescript
const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};
```

### Shadows

```typescript
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};
```

---

## 📱 Core Components

### 1. FeedScreen

Ana feed ekranı.

**Props:**
```typescript
interface FeedScreenProps {
  initialTab?: 'feed' | 'trending' | 'following';
}
```

**Usage:**
```tsx
import { FeedScreen } from '@/screens/FeedScreen';

<FeedScreen initialTab="feed" />
```

**Structure:**
```tsx
<SafeAreaView>
  <Header />
  <TabBar tabs={['Feed', 'Trending', 'Following']} />
  <FeedList />
</SafeAreaView>
```

---

### 2. FeedList

Infinite scroll feed list.

**Props:**
```typescript
interface FeedListProps {
  vibe?: VibeType;
  intent?: IntentType;
  contentTypes?: ContentType[];
  onRefresh?: () => void;
  onEndReached?: () => void;
}
```

**Usage:**
```tsx
import { FeedList } from '@/components/feed/FeedList';

<FeedList
  vibe="energetic"
  intent="activity_partner"
  onRefresh={handleRefresh}
  onEndReached={handleLoadMore}
/>
```

**Features:**
- Infinite scroll
- Pull to refresh
- Skeleton loading
- Empty state
- Error state

---

### 3. PostCard

Instagram-style post card.

**Props:**
```typescript
interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onUserPress?: () => void;
  onMediaPress?: (index: number) => void;
}
```

**Usage:**
```tsx
import { PostCard } from '@/components/feed/PostCard';

<PostCard
  post={post}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
/>
```

**Structure:**
```tsx
<Card style={styles.card}>
  <PostHeader
    user={post.user}
    location={post.location}
    onUserPress={onUserPress}
  />
  <PostMedia
    media={post.media}
    onPress={onMediaPress}
  />
  <PostActions
    stats={post.stats}
    isLiked={post.is_liked}
    onLike={onLike}
    onComment={onComment}
    onShare={onShare}
  />
  <PostCaption
    caption={post.caption}
    mentions={post.mentions}
    interests={post.interests}
  />
  <CommentPreview
    comments={post.comments}
    onViewAll={onViewAllComments}
  />
</Card>
```

**Styling:**
```tsx
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
});
```

---

### 4. PostHeader

Post header with user info.

**Props:**
```typescript
interface PostHeaderProps {
  user: User;
  location?: string;
  timestamp?: string;
  onUserPress?: () => void;
  onMenuPress?: () => void;
}
```

**Usage:**
```tsx
<PostHeader
  user={user}
  location="Kadıköy, İstanbul"
  timestamp="2 saat önce"
  onUserPress={handleUserPress}
/>
```

**Structure:**
```tsx
<View style={styles.header}>
  <Pressable onPress={onUserPress} style={styles.userInfo}>
    <Avatar
      source={{ uri: user.avatar }}
      size={40}
      verified={user.verified}
    />
    <View style={styles.textContainer}>
      <Text style={styles.name}>
        {user.name}, {user.age}
      </Text>
      {location && (
        <Text style={styles.location}>
          <MapPin size={12} /> {location}
        </Text>
      )}
    </View>
  </Pressable>
  <IconButton
    icon={<MoreVertical size={20} />}
    onPress={onMenuPress}
  />
</View>
```

---

### 5. PostMedia

Image/video carousel.

**Props:**
```typescript
interface PostMediaProps {
  media: Media[];
  onPress?: (index: number) => void;
  aspectRatio?: number;
}
```

**Usage:**
```tsx
<PostMedia
  media={post.media}
  onPress={handleMediaPress}
  aspectRatio={4/5}
/>
```

**Features:**
- Swipeable carousel
- Pagination dots
- Zoom on press
- Video playback
- Image optimization

---

### 6. PostActions

Like, comment, share buttons.

**Props:**
```typescript
interface PostActionsProps {
  stats: PostStats;
  isLiked: boolean;
  isBookmarked?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark?: () => void;
}
```

**Usage:**
```tsx
<PostActions
  stats={post.stats}
  isLiked={post.is_liked}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
/>
```

**Structure:**
```tsx
<View style={styles.actions}>
  <View style={styles.leftActions}>
    <IconButton
      icon={<Heart size={24} fill={isLiked ? colors.primary : 'none'} />}
      onPress={onLike}
      label={formatNumber(stats.likes)}
    />
    <IconButton
      icon={<MessageCircle size={24} />}
      onPress={onComment}
      label={formatNumber(stats.comments)}
    />
    <IconButton
      icon={<Share2 size={24} />}
      onPress={onShare}
      label={formatNumber(stats.shares)}
    />
  </View>
  <IconButton
    icon={<Bookmark size={24} fill={isBookmarked ? colors.primary : 'none'} />}
    onPress={onBookmark}
  />
</View>
```

---

### 7. PostCaption

Caption with mentions and hashtags.

**Props:**
```typescript
interface PostCaptionProps {
  caption: string;
  mentions?: string[];
  interests?: string[];
  maxLines?: number;
  onMentionPress?: (userId: string) => void;
  onInterestPress?: (interest: string) => void;
}
```

**Usage:**
```tsx
<PostCaption
  caption={post.caption}
  mentions={post.mentions}
  interests={post.interests}
  maxLines={3}
  onMentionPress={handleMentionPress}
/>
```

**Features:**
- Expandable text (Read more)
- Clickable mentions (@username)
- Clickable hashtags (#tag)
- Interest tags

---

### 8. MiniPostCard

Twitter/X-style short post.

**Props:**
```typescript
interface MiniPostCardProps {
  miniPost: MiniPost;
  onLike?: () => void;
  onReply?: () => void;
  onUserPress?: () => void;
}
```

**Usage:**
```tsx
<MiniPostCard
  miniPost={miniPost}
  onLike={handleLike}
  onReply={handleReply}
/>
```

**Structure:**
```tsx
<Card style={styles.miniCard}>
  <View style={styles.header}>
    <Avatar
      source={{ uri: user.avatar }}
      size={32}
    />
    <View style={styles.userInfo}>
      <Text style={styles.name}>
        {miniPost.is_anon ? 'Anon' : user.name}
      </Text>
      <Text style={styles.timestamp}>
        {formatTimestamp(miniPost.created_at)}
      </Text>
    </View>
  </View>
  <Text style={styles.content}>
    {miniPost.content}
  </Text>
  <View style={styles.actions}>
    <IconButton
      icon={<Heart size={18} />}
      label={miniPost.stats.likes}
      onPress={onLike}
    />
    <IconButton
      icon={<MessageCircle size={18} />}
      label={miniPost.stats.replies}
      onPress={onReply}
    />
  </View>
</Card>
```

---

### 9. VoiceMomentCard

Voice recording card.

**Props:**
```typescript
interface VoiceMomentCardProps {
  voiceMoment: VoiceMoment;
  onPlay?: () => void;
  onLike?: () => void;
  onReply?: () => void;
}
```

**Usage:**
```tsx
<VoiceMomentCard
  voiceMoment={voiceMoment}
  onPlay={handlePlay}
  onLike={handleLike}
/>
```

**Features:**
- Waveform visualization
- Play/pause button
- Progress bar
- Playback speed control

---

### 10. PollCard

Poll/survey card.

**Props:**
```typescript
interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  onUserPress?: () => void;
}
```

**Usage:**
```tsx
<PollCard
  poll={poll}
  onVote={handleVote}
/>
```

**Structure:**
```tsx
<Card style={styles.pollCard}>
  <PostHeader user={poll.user} />
  <Text style={styles.question}>
    {poll.question}
  </Text>
  <View style={styles.options}>
    {poll.options.map((option) => (
      <PollOption
        key={option.id}
        option={option}
        hasVoted={poll.has_voted}
        onPress={() => onVote([option.id])}
      />
    ))}
  </View>
  <Text style={styles.totalVotes}>
    {poll.total_votes} oy • {formatTimeRemaining(poll.expires_at)}
  </Text>
</Card>
```

---

### 11. SuggestionsRow

Horizontal profile suggestions.

**Props:**
```typescript
interface SuggestionsRowProps {
  profiles: Profile[];
  onProfilePress?: (userId: string) => void;
  onViewAll?: () => void;
}
```

**Usage:**
```tsx
<SuggestionsRow
  profiles={suggestions}
  onProfilePress={handleProfilePress}
  onViewAll={handleViewAll}
/>
```

**Structure:**
```tsx
<View style={styles.container}>
  <View style={styles.header}>
    <Text style={styles.title}>Önerilen Profiller</Text>
    <TextButton onPress={onViewAll}>
      Tümünü Gör
    </TextButton>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {profiles.map((profile) => (
      <ProfileCard
        key={profile.id}
        profile={profile}
        onPress={() => onProfilePress(profile.id)}
      />
    ))}
  </ScrollView>
</View>
```

---

### 12. VibeMatchBlock

Mood selector block.

**Props:**
```typescript
interface VibeMatchBlockProps {
  currentVibe?: VibeType;
  onVibeSelect?: (vibe: VibeType, intensity: number) => void;
}
```

**Usage:**
```tsx
<VibeMatchBlock
  currentVibe="energetic"
  onVibeSelect={handleVibeSelect}
/>
```

**Structure:**
```tsx
<Card style={styles.vibeCard}>
  <Text style={styles.title}>
    Bugün nasıl hissediyorsun?
  </Text>
  <View style={styles.vibes}>
    {vibeTypes.map((vibe) => (
      <VibeButton
        key={vibe.type}
        vibe={vibe}
        selected={currentVibe === vibe.type}
        onPress={() => onVibeSelect(vibe.type, 4)}
      />
    ))}
  </View>
</Card>
```

---

### 13. TimeCapsuleCard

24h expiring post card.

**Props:**
```typescript
interface TimeCapsuleCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onUserPress?: () => void;
}
```

**Usage:**
```tsx
<TimeCapsuleCard
  post={post}
  onLike={handleLike}
  onComment={handleComment}
/>
```

**Features:**
- Countdown timer
- Expiration badge
- Auto-remove on expiry

---

### 14. CommentSection

Comments list with replies.

**Props:**
```typescript
interface CommentSectionProps {
  comments: Comment[];
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  onLoadMore?: () => void;
}
```

**Usage:**
```tsx
<CommentSection
  comments={comments}
  onLike={handleCommentLike}
  onReply={handleReply}
/>
```

**Features:**
- Nested replies
- Load more
- Like comments
- Reply to comments

---

### 15. ShareMenu

Share options modal.

**Props:**
```typescript
interface ShareMenuProps {
  visible: boolean;
  post: Post;
  onDismiss: () => void;
  onShareDM?: () => void;
  onShareExternal?: () => void;
  onShareStory?: () => void;
}
```

**Usage:**
```tsx
<ShareMenu
  visible={showShareMenu}
  post={post}
  onDismiss={() => setShowShareMenu(false)}
  onShareDM={handleShareDM}
/>
```

---

## 🎯 Utility Components

### Avatar

**Props:**
```typescript
interface AvatarProps {
  source: ImageSourcePropType;
  size?: number;
  verified?: boolean;
  online?: boolean;
  onPress?: () => void;
}
```

**Usage:**
```tsx
<Avatar
  source={{ uri: user.avatar }}
  size={40}
  verified={user.verified}
  online={user.is_online}
/>
```

---

### IconButton

**Props:**
```typescript
interface IconButtonProps {
  icon: ReactNode;
  label?: string | number;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}
```

**Usage:**
```tsx
<IconButton
  icon={<Heart size={24} />}
  label={120}
  onPress={handleLike}
/>
```

---

### Card

**Props:**
```typescript
interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}
```

**Usage:**
```tsx
<Card style={styles.customCard}>
  <Text>Content</Text>
</Card>
```

---

### Skeleton

**Props:**
```typescript
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}
```

**Usage:**
```tsx
<Skeleton width="100%" height={200} borderRadius={12} />
```

---

### EmptyState

**Props:**
```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={<Inbox size={48} />}
  title="Henüz gönderi yok"
  description="Takip ettiğin kişiler gönderi paylaştığında burada görünecek"
  action={{
    label: "Keşfet",
    onPress: handleExplore
  }}
/>
```

---

## 🎬 Animations

### Like Animation

```tsx
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

const LikeButton = ({ isLiked, onPress }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <IconButton
        icon={<Heart fill={isLiked ? colors.primary : 'none'} />}
        onPress={handlePress}
      />
    </Animated.View>
  );
};
```

---

### Card Enter Animation

```tsx
import { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.delay(index * 100)}>
  <PostCard post={post} />
</Animated.View>
```

---

## 📱 Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: 375,  // iPhone SE
  md: 414,  // iPhone Pro
  lg: 768,  // iPad
  xl: 1024, // iPad Pro
};
```

### Usage

```tsx
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const isTablet = width >= breakpoints.lg;

<View style={[
  styles.container,
  isTablet && styles.containerTablet
]} />
```

---

## ♿ Accessibility

### Labels

```tsx
<Pressable
  accessible={true}
  accessibilityLabel="Gönderiyi beğen"
  accessibilityRole="button"
  accessibilityState={{ selected: isLiked }}
  onPress={onLike}
>
  <Heart />
</Pressable>
```

### Screen Reader

```tsx
<Text
  accessibilityLabel={`${user.name}, ${user.age} yaşında, ${post.stats.likes} beğeni`}
>
  {user.name}, {user.age}
</Text>
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
