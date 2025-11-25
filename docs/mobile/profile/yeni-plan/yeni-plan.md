# Profil Sistemi Yeniden Yapılandırma Planı

## Mevcut Durum Analizi

### Sorunlar
1. **Monolitik Yapı** - Tüm logic tek dosyada (index.tsx 547 satır)
2. **Başka Profil Yok** - Sadece kendi profilini görüntüleyebiliyorsun
3. **Creator Desteği Yok** - Creator'a özel UI/UX yok
4. **Apple Tarzı Değil** - Modern, premium tasarım eksik
5. **Kod Tekrarı** - Real/Shadow profil için duplicate kod
6. **Component Bazlı Değil** - Reusable component yok

### Mevcut Dosyalar
```
app/(profile)/
├── index.tsx          # Kendi profil (547 satır - çok büyük)
├── edit.tsx           # Profil düzenleme
├── shadow-edit.tsx    # Shadow profil düzenleme
├── shadow-pin.tsx     # Shadow PIN
├── followers.tsx      # Takipçi listesi
├── blocked-users.tsx  # Engellenenler
└── vibe-preferences.tsx

src/components/profile/
├── AvatarUploader.tsx
├── FollowersList.tsx
├── FollowingList.tsx
├── FollowerActionSheet.tsx
├── UnfollowSheet.tsx
├── FollowersFilterSheet.tsx
├── FollowersSearchBar.tsx
└── SortSheet.tsx
```

---

## Yeni Mimari

### Dizin Yapısı
```
app/
├── (profile)/                    # Kendi profilin (korunacak, refactor edilecek)
│   ├── _layout.tsx              # Stack navigator
│   ├── index.tsx                # Basitleştirilmiş - component kullanacak
│   ├── edit.tsx                 # Korunacak
│   └── ...
│
└── profile/                      # Başkalarının profili (YENİ) ✅
    └── [username].tsx           # Dynamic route - username bazlı profil

src/components/profile-view/      # YENİ - Profil görüntüleme componentleri
├── index.ts                     # Barrel exports
├── types.ts                     # Type definitions
│
├── ProfileScreen.tsx            # Ana container component
│
├── header/                      # Header bölümü
│   ├── ProfileHeader.tsx        # Cover + Avatar + Name + Bio
│   ├── ProfileCover.tsx         # Cover image with parallax
│   ├── ProfileAvatar.tsx        # Large avatar with ring
│   └── ProfileBadges.tsx        # Verified, Creator, etc.
│
├── stats/                       # İstatistikler
│   ├── ProfileStats.tsx         # Followers, Following, Posts
│   └── StatItem.tsx             # Tek stat item
│
├── actions/                     # Aksiyon butonları
│   ├── ProfileActions.tsx       # Follow, Message, More
│   ├── FollowButton.tsx         # Animated follow button
│   ├── MessageButton.tsx        # DM button
│   └── MoreMenu.tsx             # Block, Report, Share
│
├── tabs/                        # Tab içerikleri
│   ├── ProfileTabs.tsx          # Tab bar
│   ├── PostsTab.tsx             # Grid posts
│   ├── MediaTab.tsx             # Photos/Videos
│   └── LikesTab.tsx             # Liked content
│
├── sections/                    # Profil bölümleri
│   ├── AboutSection.tsx         # Bio, location, links
│   ├── HighlightsRow.tsx        # Story highlights
│   └── SocialLinks.tsx          # External links
│
├── creator/                     # Creator'a özel (YENİ)
│   ├── CreatorHeader.tsx        # Creator badge + tier info
│   ├── SubscribeButton.tsx      # Subscribe CTA
│   ├── TierSelector.tsx         # Subscription tiers
│   ├── TierCard.tsx             # Single tier card
│   ├── CreatorStats.tsx         # Earnings, subscribers
│   ├── ExclusiveContent.tsx     # Locked content preview
│   └── CreatorBio.tsx           # Extended bio for creators
│
└── skeletons/                   # Loading states
    ├── ProfileSkeleton.tsx      # Full page skeleton
    ├── HeaderSkeleton.tsx       # Header skeleton
    └── TabsSkeleton.tsx         # Tabs skeleton
```

---

## TODO List

### Phase 1: Temel Altyapı ✅
- [x] `src/components/profile-view/types.ts` - Type definitions
- [x] `src/components/profile-view/index.ts` - Barrel exports
- [x] `app/profile/[username].tsx` - Dynamic route oluştur (username bazlı)

### Phase 2: Header Components ✅
- [x] `header/ProfileCover.tsx` - Parallax cover image
- [x] `header/ProfileAvatar.tsx` - Large avatar with gradient ring
- [x] `header/ProfileBadges.tsx` - Verified, Creator badges
- [x] `header/ProfileHeader.tsx` - Combine all header elements (Instagram-style stats)
- [x] `header/ProfileTopBar.tsx` - Top navigation bar
  - [x] Username with dropdown
  - [x] Shadow profile switcher modal
  - [x] Create post button (+)
  - [x] Menu button (hamburger)
  - [x] Profile type indicator (green/red dot)

### Phase 3: Stats & Actions ✅
- [x] `stats/StatItem.tsx` - Single stat component
- [x] `stats/ProfileStats.tsx` - Stats row (artık ProfileHeader içinde inline)
- [x] `actions/FollowButton.tsx` - Animated follow/unfollow
- [x] `actions/MessageButton.tsx` - DM button
- [x] `actions/MoreMenu.tsx` - Action sheet menu
- [x] `actions/ProfileActions.tsx` - Actions container
  - [x] Kendi profil: "Profili Düzenle", "Paylaş", "Ayarlar" butonları
  - [x] Başka profil: "Takip Et", "Mesaj", "..." butonları

### Phase 4: Tabs System ✅
- [x] `tabs/ProfileTabs.tsx` - Animated tab bar (Grid, Crown, Reels, Reposts, Tagged)
- [x] Grid content - Posts grid with multi-media & video indicators
- [x] Exclusive content - Abonelere özel (locked/unlocked states)
- [x] Reels content - Video grid with views count
- [x] Reposts content - Shared posts
- [x] Tagged content - Tagged posts

### Phase 5: Creator Components
- [ ] `creator/CreatorHeader.tsx` - Creator-specific header
- [ ] `creator/SubscribeButton.tsx` - Subscribe CTA
- [ ] `creator/TierCard.tsx` - Subscription tier card
- [ ] `creator/TierSelector.tsx` - Tier selection
- [ ] `creator/CreatorStats.tsx` - Creator statistics
- [ ] `creator/ExclusiveContent.tsx` - Locked content preview

### Phase 6: Sections ✅
- [x] `sections/AboutSection.tsx` - Bio section (expandable text)
- [x] `sections/StoryHighlights.tsx` - Story highlights (Instagram-style)
- [x] `sections/MutualFollowers.tsx` - "Tanıdığın X kişi takip ediyor" component
- [x] `sections/SocialLinks.tsx` - External links (Instagram, Twitter, YouTube, Website)

### Phase 7: Skeletons ✅
- [x] `skeletons/HeaderSkeleton.tsx` - Animated pulse skeleton for header
- [x] `skeletons/TabsSkeleton.tsx` - Grid skeleton for tabs
- [x] `skeletons/ProfileSkeleton.tsx` - Full page skeleton (combines all)

### Phase 8: Ana Container ✅
- [x] `ProfileScreen.tsx` - Main profile screen component (app/profile/[username].tsx içinde)
- [x] `posts/PostsGrid.tsx` - Posts grid component
- [x] `posts/PostFeedModal.tsx` - Instagram-style vertical post feed modal
- [x] `sections/VibeSheet.tsx` - Vibe preferences bottom sheet

### Phase 9: Integration ✅
- [x] `app/profile/[username].tsx` - Implement with new components
- [x] `app/(profile)/index.tsx` - Refactored with new components (yedek: index.backup.tsx)
- [ ] Creator Discovery'den profile navigation

### Phase 10: Polish ✅
- [x] Animasyonlar (parallax, tab transitions)
- [x] Haptic feedback
- [x] Loading states (ProfileSkeleton)
- [ ] Error states
- [ ] Empty states
- [x] Pull-to-refresh

### Phase 11: Edge Functions ✅ (YENİ)
- [x] `get-profile` - Profil ve istatistikleri getir
- [x] `follow-user` - Takip et/takipten çık
- [x] `get-profile-posts` - Profil postlarını sayfalama ile getir
- [x] `block-user` - Kullanıcı engelle/engeli kaldır
- [x] `report-user` - Kullanıcı şikayet et
- [x] `user_reports` tablosu oluşturuldu

---

## UI/UX Standartları (Apple Design)

### Header
- **Cover Image**: Full-width, 200px height, parallax on scroll
- **Avatar**: 100px, 3px gradient ring (accent color), positioned -50px from cover
- **Name**: 24px, bold, white/dark based on theme
- **Username**: 15px, secondary color, @prefix
- **Bio**: 14px, max 3 lines, "more" link

### Stats Row
- **Layout**: 3 columns, equal width
- **Numbers**: 20px, bold
- **Labels**: 12px, secondary color
- **Tap**: Navigate to followers/following

### Action Buttons
- **Follow**: Primary color, filled, 44px height
- **Following**: Outline style, "Following" text
- **Message**: Secondary button, icon + text
- **More**: Icon button, opens action sheet

### Tabs
- **Style**: Underline indicator, animated
- **Icons**: Grid, Image, Heart
- **Content**: Lazy loaded

### Creator Section
- **Subscribe Button**: Gradient, prominent
- **Tiers**: Horizontal scroll cards
- **Locked Content**: Blur + lock icon overlay

### Animations
- **Parallax**: Cover image scales on scroll
- **Tab Indicator**: Spring animation
- **Follow Button**: Scale + haptic
- **Avatar**: Subtle scale on tap

### Colors
- Use theme colors consistently
- Accent for CTAs
- Gradient for creator elements
- Glassmorphism for overlays

---

## Database Schema Reference (GÜNCEL)

```sql
-- profiles table (GERÇEK YAPI)
profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  type text CHECK (type IN ('real', 'shadow')),
  
  -- Temel bilgiler
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  gender text CHECK (gender IN ('male', 'female', 'lgbt')),
  
  -- ROLE SİSTEMİ (CREATOR BURADAN!)
  role text DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  is_creator boolean DEFAULT false, -- DEPRECATED! role kullan
  
  -- Shadow mode
  shadow_pin_hash text,
  shadow_unlocked boolean DEFAULT false,
  shadow_profile_active boolean DEFAULT false,
  biometric_enabled boolean DEFAULT false,
  biometric_type text,
  shadow_pin_created_at timestamptz,
  
  -- Vibe sistemi
  vibe_preferences jsonb DEFAULT '[]',
  favorite_vibe text,
  
  -- Onboarding
  onboarding_step integer DEFAULT 0,
  onboarding_data jsonb,
  onboarding_completed_at timestamptz,
  
  -- Device & Auth
  last_device_info jsonb,
  last_ip_address inet,
  last_login_at timestamptz,
  device_token text,
  email text,
  phone text,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  banned_until timestamptz,
  is_super_admin boolean DEFAULT false,
  is_sso_user boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  
  -- Legal
  tos_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  anti_screenshot_accepted_at timestamptz,
  firewall_accepted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- followers table
-- ÖNEMLİ: follower_id ve following_id = auth.users.id (user_id değil profiles.id!)
followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id), -- takip eden
  following_id uuid REFERENCES auth.users(id), -- takip edilen
  created_at timestamptz DEFAULT now()
)

-- subscriptions table (Creator abonelik)
subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES auth.users(id),
  creator_id uuid REFERENCES auth.users(id),
  tier varchar DEFAULT 'basic',
  status varchar DEFAULT 'active',
  price_paid numeric,
  currency varchar DEFAULT 'TRY',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### ÖNEMLİ NOTLAR:

1. **Creator Belirleme:**
   - ✅ DOĞRU: `role = 'creator'`
   - ❌ YANLIŞ: `is_creator = true` (deprecated)

2. **ID Karışıklığı:**
   - `profiles.id` = Profile UUID (her profile için unique)
   - `profiles.user_id` = Auth User UUID (1 user = 2 profile: real + shadow)
   - `followers` tablosu `user_id` kullanıyor, `profiles.id` DEĞİL!

3. **Profile Routing:**
   - `/profile/[id]` → `profiles.id` ile sorgula
   - Followers için `profiles.user_id` kullan

4. **Verified Durumu:**
   - ✅ `is_verified` alanı eklendi (migration: 20241125_add_profile_fields.sql)
   - ✅ `location` alanı eklendi
   - ✅ `cover_url` alanı eklendi
   - ✅ `website` alanı eklendi

---

## Implementation Notes

### Profile Types
```typescript
type ProfileType = 'user' | 'creator';
type ViewMode = 'own' | 'other'; // Kendi profil mi, başkasının mı

interface ProfileViewProps {
  profileId: string;
  viewMode: ViewMode;
}
```

### Navigation
```typescript
// Başkasının profiline git (username ile)
router.push(`/profile/${username}`);

// Kendi profiline git
router.push('/(profile)');

// Creator profiline git (aynı route, farklı UI)
router.push(`/profile/${creatorUsername}`);
```

### Dizin Yapısı Açıklaması
```
app/
├── (profile)/          # Kendi profilin (group route - URL'de görünmez)
│   ├── index.tsx       # /profile olarak erişilir (kendi profil)
│   ├── edit.tsx        # /profile/edit
│   └── ...
│
└── profile/            # Başkalarının profili
    └── [username].tsx  # /profile/luna, /profile/maya, etc.
```

### ÖNEMLİ: ID vs Username
- **Mock data:** `id: "1"` → YANLIŞ! UUID olmalı
- **Routing:** Username kullan, ID değil
- **Database query:** `username` ile sorgula, `id` ile değil

### Data Fetching
- `useProfile(id)` - Profil verisi
- `useProfileStats(id)` - Takipçi/takip sayıları
- `useProfilePosts(id)` - Postlar
- `useCreatorTiers(id)` - Creator tier'ları

---

## Öncelik Sırası (GÜNCEL)

1. ~~**Types & Base** - Temel yapı~~ ✅
2. ~~**Header** - En görünür kısım~~ ✅
3. ~~**Actions** - Follow/Message~~ ✅
4. ~~**Profile Screen** - Birleştir~~ ✅
5. ~~**Tabs** - İçerik tabları~~ ✅
6. ~~**Skeletons** - Loading states~~ ✅
7. ~~**Sections** - AboutSection, SocialLinks~~ ✅
8. ~~**Kendi Profil Refactor**~~ ✅
9. **Creator** - Creator özellikleri ⏳
10. **Polish** - Error/Empty states ⏳

---

## Sıradaki Görevler

### 🟡 Orta Öncelik (Sonra Yapılacak)
1. **Creator Components (Phase 5)** - Creator'a özel UI
   - SubscribeButton
   - TierCard/TierSelector
   - CreatorStats
   - ExclusiveContent preview

### 🟢 Düşük Öncelik
2. **Polish (Phase 10)**
   - Error states
   - Empty states

3. **Integration (Phase 9)**
   - Creator Discovery'den profile navigation

---

## Son Güncelleme: 2025-11-25

### Bu Seansta Tamamlananlar:
- ✅ **Skeletons (Phase 7)**
  - HeaderSkeleton - Animated pulse skeleton for header
  - TabsSkeleton - Grid skeleton for tabs
  - ProfileSkeleton - Full page skeleton
- ✅ **Sections (Phase 6)**
  - AboutSection - Expandable bio section
  - SocialLinks - External links (Instagram, Twitter, YouTube, Website)
- ✅ **Kendi Profil Refactor (Phase 9)**
  - `app/(profile)/index.tsx` yeni componentlerle refactored
  - Yedek: `app/(profile)/index.backup.tsx`
- ✅ ProfileTopBar - Username dropdown, shadow profile switcher
- ✅ ProfileActions - Kendi profil için butonlar
- ✅ ProfileHeader - Instagram-style inline stats
