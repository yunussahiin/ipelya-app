# Creator Discovery Anasayfa

## Genel Bakış

Apple Arcade tarzı premium UI/UX ile creator'ların keşfedildiği anasayfa. Modern, animasyonlu ve kullanıcı dostu bir deneyim sunar.

## Ekran Görüntüsü Yapısı

```
┌─────────────────────────────────────────┐
│ Keşfet                                  │
│ En popüler içerik üreticilerini keşfet  │
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────────────────────────────┐  │
│    │                                 │  │
│    │      HERO CREATOR CARD          │  │
│    │      (Featured Creator)         │  │
│    │                                 │  │
│    │  [Avatar] Luna                  │  │
│    │          @luna                  │  │
│    │          ❤️ 89K  👥 12.4K       │  │
│    │                                 │  │
│    │  [────── Takip Et ──────]       │  │
│    │                                 │  │
│    └─────────────────────────────────┘  │
│                                         │
│ [🔥 Tümü] [💃 Dans] [🎵 Müzik] ...     │
│                                         │
│ Trend Olanlar                    Tümü > │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │ 🟣 │ │ 🔵 │ │ 🟢 │ │ 🟡 │ │ 🔴 │     │
│ └────┘ └────┘ └────┘ └────┘ └────┘     │
│  Luna   Maya  Jasmine Alex  Sophie      │
│                                         │
│ Yükselen Yıldızlar               Tümü > │
│ ┌──────────┐ ┌──────────┐              │
│ │          │ │          │              │
│ │  [Card]  │ │  [Card]  │              │
│ │          │ │          │              │
│ └──────────┘ └──────────┘              │
│ ┌──────────┐ ┌──────────┐              │
│ │          │ │          │              │
│ │  [Card]  │ │  [Card]  │              │
│ │          │ │          │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ Senin İçin                       Tümü > │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │      [Large For You Card]           │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Dosya Yapısı

```
apps/mobile/
├── app/(creator)/
│   ├── _layout.tsx          # Tab navigator (5 tab)
│   ├── index.tsx            # Discovery anasayfa ✅
│   ├── dashboard.tsx        # Creator dashboard
│   ├── revenue.tsx          # Gelir
│   ├── schedule.tsx         # Takvim
│   └── upload.tsx           # Yükleme
│
└── src/components/creator-discovery/
    ├── index.ts             # Barrel exports
    ├── types.ts             # Types & mock data
    ├── HeroCreatorCard.tsx  # Featured creator hero
    ├── TrendingCreatorsRow.tsx  # Horizontal carousel
    ├── RisingStarsGrid.tsx  # 2-column grid
    ├── CategoryChips.tsx    # Category filter
    ├── ForYouSection.tsx    # Personalized section
    ├── shared/
    │   ├── index.ts
    │   ├── CreatorAvatar.tsx    # Avatar with status
    │   ├── FollowButton.tsx     # Animated follow button
    │   └── StatsBadge.tsx       # Follower/like count
    └── skeletons/
        ├── index.ts
        └── DiscoverySkeleton.tsx  # Loading skeleton
```

## Component'ler

### 1. HeroCreatorCard
- **Amaç:** Featured creator'ı büyük hero card olarak gösterir
- **Özellikler:**
  - Full-width cover image
  - Gradient overlay
  - Avatar, isim, username
  - Like & follower stats
  - Follow button
  - Parallax scroll animation

### 2. TrendingCreatorsRow
- **Amaç:** Trend olan creator'ları horizontal carousel'de gösterir
- **Özellikler:**
  - Circular avatars (72x72)
  - Online status ring
  - Snap scroll behavior
  - "Tümü" button

### 3. RisingStarsGrid
- **Amaç:** Yükselen yıldızları 2 kolonlu grid'de gösterir
- **Özellikler:**
  - Cover image cards
  - Gradient overlay
  - Avatar + name + stats
  - Follow button
  - Press animation

### 4. CategoryChips
- **Amaç:** Kategori filtreleme
- **Özellikler:**
  - Horizontal scroll
  - Active/inactive states
  - Emoji icons
  - Spring animation

### 5. ForYouSection
- **Amaç:** Kişiselleştirilmiş öneriler
- **Özellikler:**
  - Large cards (240px height)
  - Cover image + gradient
  - Category label
  - "Keşfet" button

### 6. Shared Components
- **CreatorAvatar:** Gradient ring, online indicator, verified badge
- **FollowButton:** Animated press, filled/outline variants
- **StatsBadge:** Follower/like count with icons

## Animasyonlar

1. **Hero Parallax:** Scroll'da scale + translateY
2. **Card Press:** Scale down 0.98 on press
3. **Follow Button:** Spring animation on tap
4. **Category Chip:** Spring animation on select
5. **Skeleton Pulse:** Opacity 0.3 → 0.7 loop

## Theme Support

Tüm component'ler `useTheme()` hook'u ile theme colors kullanır:
- `colors.background` - Ana arka plan
- `colors.surface` - Card arka planları
- `colors.accent` - Vurgu rengi
- `colors.textPrimary` - Ana metin
- `colors.textSecondary` - İkincil metin
- `colors.border` - Border rengi

## Mock Data

`types.ts` dosyasında 8 adet mock creator tanımlı:
- Luna (dance)
- Maya (music)
- Jasmine (lifestyle)
- Alex (gaming)
- Sophie (fitness)
- Emma (art)
- Olivia (comedy)
- Mia (dance)

## Sonraki Adımlar

1. [ ] Supabase entegrasyonu - gerçek creator verisi
2. [ ] useCreatorDiscovery hook oluştur
3. [ ] Follow/unfollow API entegrasyonu
4. [ ] Kategori filtreleme backend
5. [ ] Pull-to-refresh gerçek data
6. [ ] Creator profil sayfasına navigation
7. [ ] Search functionality
8. [ ] Infinite scroll pagination

## Tab Bar

5 tab ile creator panel:
1. **Keşfet** (Compass) - Discovery anasayfa
2. **Panel** (LayoutDashboard) - Creator dashboard
3. **Gelir** (DollarSign) - Revenue tracking
4. **Takvim** (Calendar) - Content scheduling
5. **Yükle** (Upload) - Content upload

## Kullanım

```tsx
// Navigation
router.push("/(creator)"); // Discovery tab
router.push("/(creator)/dashboard"); // Dashboard tab

// Component import
import {
  HeroCreatorCard,
  TrendingCreatorsRow,
  RisingStarsGrid,
  CategoryChips,
  ForYouSection,
  DiscoverySkeleton,
  MOCK_CREATORS,
  type Creator,
  type CreatorCategory
} from "@/components/creator-discovery";
```
