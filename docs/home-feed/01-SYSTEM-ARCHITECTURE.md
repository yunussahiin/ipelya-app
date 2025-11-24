# İpelya Home Feed - System Architecture

## 📐 Genel Mimari

İpelya Home Feed sistemi, modern bir sosyal medya platformunun tüm özelliklerini içeren, ölçeklenebilir ve performanslı bir mimari üzerine kurulmuştur.

---

## 🏗️ Mimari Katmanlar

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native + Expo)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Feed Screen │  │ Post Screen  │  │ Profile Screen│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Packages (Monorepo)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    @types    │  │     @api     │  │    @hooks    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Edge Functions│  │  PostgreSQL  │  │   Realtime   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Storage    │  │     Auth     │  │   Triggers   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AI Services │  │  CDN (Images)│  │  Analytics   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Components

### 1. Feed Engine (Algoritma Motoru)

**Sorumluluklar:**
- Feed içeriklerini sıralama
- Kullanıcı davranışlarına göre kişiselleştirme
- Vibe Match scoring
- Social Graph hesaplama
- Intent-based filtering

**Teknolojiler:**
- PostgreSQL Functions
- Edge Functions (Deno)
- Redis (caching)

### 2. Content Management (İçerik Yönetimi)

**Sorumluluklar:**
- Post oluşturma/düzenleme/silme
- Media upload & processing
- Mention & hashtag parsing
- Content moderation
- Time capsule expiration

**Teknolojiler:**
- Supabase Storage
- Image optimization (Sharp)
- Video transcoding (FFmpeg)
- AI moderation

### 3. Social Interactions (Sosyal Etkileşimler)

**Sorumluluklar:**
- Like/unlike
- Comment/reply
- Share (DM/external)
- Mention notifications
- Crystal gifts

**Teknolojiler:**
- Supabase Realtime
- Push notifications (Expo)
- WebSocket connections

### 4. Discovery Engine (Keşfet Motoru)

**Sorumluluklar:**
- Profile suggestions
- Vibe Match recommendations
- IRL event integration
- Micro-groups discovery
- First Move suggestions

**Teknolojiler:**
- Graph algorithms
- ML models (TensorFlow.js)
- Location services

---

## 🔄 Data Flow

### Feed Loading Flow

```
User Opens App
    ↓
FeedScreen.tsx
    ↓
useFeed() hook
    ↓
GET /feed?cursor=xyz&vibe=energetic&intent=activity
    ↓
Edge Function: get-feed
    ↓
┌─────────────────────────────────────┐
│  Feed Algorithm                     │
│  1. Get user preferences            │
│  2. Calculate vibe score            │
│  3. Apply intent filter             │
│  4. Fetch social graph              │
│  5. Mix content types               │
│  6. Apply RLS policies              │
│  7. Return paginated results        │
└─────────────────────────────────────┘
    ↓
Response: FeedItem[]
    ↓
FeedList.tsx (FlatList)
    ↓
Render: PostCard | MiniPostCard | PollCard | etc.
```

### Post Creation Flow

```
User Creates Post
    ↓
CreatePostScreen.tsx
    ↓
1. Upload media (if any)
    ↓
Supabase Storage
    ↓
2. Parse mentions & hashtags
    ↓
3. POST /create-post
    ↓
Edge Function: create-post
    ↓
┌─────────────────────────────────────┐
│  Post Creation Logic                │
│  1. Validate content                │
│  2. AI moderation check             │
│  3. Insert post record              │
│  4. Insert media records            │
│  5. Insert mention records          │
│  6. Trigger notifications           │
│  7. Update feed cache               │
└─────────────────────────────────────┘
    ↓
Supabase Realtime Broadcast
    ↓
All Followers Receive Update
    ↓
Feed Auto-Refreshes
```

### Realtime Interaction Flow

```
User Likes Post
    ↓
POST /like-post
    ↓
Edge Function: like-post
    ↓
Insert into post_likes
    ↓
Supabase Realtime Channel: post:{postId}
    ↓
┌─────────────────────────────────────┐
│  Broadcast Event                    │
│  {                                  │
│    type: "like",                    │
│    postId: "123",                   │
│    userId: "456",                   │
│    totalLikes: 121                  │
│  }                                  │
└─────────────────────────────────────┘
    ↓
All Users Viewing Post Receive Update
    ↓
UI Updates Instantly (like count)
```

---

## 🗄️ Database Architecture

### Core Tables

**posts**
- User-generated content
- Full posts with media

**mini_posts**
- Short text content
- Twitter-style posts

**voice_moments**
- Voice recordings
- Audio waveform data

**time_capsules**
- 24h expiring posts
- Auto-deletion trigger

**polls**
- Poll questions
- Voting mechanism

**feed_items**
- Unified feed table
- Pre-computed feed cache

### Relationship Tables

**post_likes**
- User-post like relationships

**post_comments**
- Nested comments support

**post_shares**
- Share tracking

**post_mentions**
- Mention indexing

**user_connections**
- Social graph edges

### Configuration Tables

**user_vibes**
- Current mood state
- Vibe history

**user_intents**
- Dating intentions
- Dynamic preferences

**user_interests**
- Interest tags
- Proficiency levels

---

## 🔐 Security Architecture

### Row Level Security (RLS)

**Policies:**
- Users can only see public posts
- Users can only edit their own posts
- Shadow profile isolation
- Admin override capabilities

**Example Policy:**
```sql
CREATE POLICY "Users can view public posts"
ON posts FOR SELECT
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_connections
    WHERE user_id = posts.user_id
    AND connected_user_id = auth.uid()
    AND status = 'accepted'
  )
);
```

### Content Moderation

**Layers:**
1. **Client-side validation** - Basic checks
2. **Edge function validation** - Business rules
3. **AI moderation** - Toxicity detection
4. **Manual review** - Flagged content
5. **Automated actions** - Auto-hide/delete

---

## 📊 Performance Optimization

### Caching Strategy

**Feed Cache:**
- Pre-computed feed items
- 5-minute TTL
- Invalidate on new post

**Media Cache:**
- CDN caching (CloudFlare)
- Image optimization (WebP)
- Lazy loading

**Query Optimization:**
- Materialized views
- Indexed columns
- Query result caching

### Pagination

**Cursor-based pagination:**
```typescript
GET /feed?cursor=post_123&limit=20
```

**Benefits:**
- Consistent results
- No duplicate items
- Efficient for infinite scroll

---

## 🔄 Scalability

### Horizontal Scaling

**Database:**
- Read replicas
- Connection pooling
- Query optimization

**Edge Functions:**
- Auto-scaling (Deno Deploy)
- Regional deployment
- Load balancing

**Storage:**
- CDN distribution
- Multi-region buckets
- Compression

### Vertical Scaling

**Database:**
- Larger instance size
- More RAM
- Faster SSD

---

## 🎨 UI/UX Architecture

### Component Hierarchy

```
FeedScreen
├── Header
│   ├── Logo
│   ├── NotificationBell
│   └── MessagesIcon
├── StoryRing (optional)
├── FeedList
│   ├── FeedItem (type: post)
│   │   └── PostCard
│   │       ├── PostHeader
│   │       ├── PostMedia
│   │       ├── PostCaption
│   │       ├── PostActions
│   │       └── CommentSection
│   ├── FeedItem (type: mini_post)
│   │   └── MiniPostCard
│   ├── FeedItem (type: poll)
│   │   └── PollCard
│   ├── FeedItem (type: suggestions)
│   │   └── SuggestionsRow
│   └── FeedItem (type: vibe_match)
│       └── VibeMatchBlock
└── BottomNav
```

### State Management

**Zustand Stores:**
- `feed.store.ts` - Feed state
- `post.store.ts` - Post interactions
- `vibe.store.ts` - Mood state
- `intent.store.ts` - Dating intent

**React Query:**
- Server state caching
- Automatic refetching
- Optimistic updates

---

## 🌐 API Architecture

### RESTful Endpoints

**Feed:**
- `GET /feed` - Get feed items
- `GET /feed/trending` - Trending posts
- `GET /feed/following` - Following feed

**Posts:**
- `POST /posts` - Create post
- `GET /posts/:id` - Get post details
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

**Interactions:**
- `POST /posts/:id/like` - Like post
- `DELETE /posts/:id/like` - Unlike post
- `POST /posts/:id/comment` - Add comment
- `POST /posts/:id/share` - Share post

**Social:**
- `GET /suggestions` - Get profile suggestions
- `POST /crystal-gifts` - Send gift
- `GET /social-graph` - Get connections

### WebSocket Channels

**Realtime Subscriptions:**
- `feed:user:{userId}` - Personal feed updates
- `post:{postId}` - Post interactions
- `mentions:user:{userId}` - Mention notifications
- `chat:{chatId}` - DM messages

---

## 🧠 AI/ML Architecture

### AI Services

**Content Moderation:**
- Toxicity detection
- NSFW image detection
- Spam detection

**Recommendation Engine:**
- Collaborative filtering
- Content-based filtering
- Hybrid approach

**Sentiment Analysis:**
- Emotional Insight AI
- Mood detection
- Tone analysis

**Smart Features:**
- Caption suggestions
- Hashtag recommendations
- First Move Engine

---

## 📱 Mobile Architecture

### Expo Configuration

**SDK:** 54+
**Plugins:**
- expo-image
- expo-av (video)
- expo-camera
- expo-notifications
- expo-location
- expo-local-authentication

### Navigation

**Expo Router:**
- File-based routing
- Deep linking support
- Tab navigation
- Stack navigation

### Performance

**Optimizations:**
- Memoized components
- Lazy loading
- Image caching
- Virtual lists (FlatList)
- Skeleton loaders

---

## 🔍 Monitoring & Analytics

### Metrics

**Performance:**
- Feed load time
- API response time
- Image load time
- App crash rate

**Engagement:**
- Post views
- Like rate
- Comment rate
- Share rate
- Time spent

**Business:**
- DAU/MAU
- Retention rate
- Vibe Match success
- Instant Chemistry conversion

### Tools

- Sentry (error tracking)
- Mixpanel (analytics)
- Supabase Dashboard (logs)
- Grafana (monitoring)

---

## 🚀 Deployment

### Environments

**Development:**
- Local Supabase
- Expo Go
- Mock data

**Staging:**
- Supabase staging project
- EAS development build
- Test data

**Production:**
- Supabase production project
- EAS production build
- Real data

### CI/CD

**Pipeline:**
1. Code push to GitHub
2. Run tests (Jest)
3. Build app (EAS)
4. Deploy Edge Functions
5. Run migrations
6. Deploy to stores

---

## 📚 Technology Stack

### Frontend
- React Native 0.76+
- Expo SDK 54+
- TypeScript 5.7+
- Zustand (state)
- React Query (server state)
- expo-image (images)
- expo-av (video)

### Backend
- Supabase (BaaS)
- PostgreSQL 15+
- Deno (Edge Functions)
- Supabase Realtime
- Supabase Storage

### DevOps
- GitHub Actions (CI/CD)
- EAS Build/Submit
- Sentry (monitoring)
- Mixpanel (analytics)

### AI/ML
- OpenAI API (moderation)
- TensorFlow.js (recommendations)
- Sentiment analysis libraries

---

## 🎯 Design Principles

### Performance First
- Lazy loading
- Caching
- Optimization

### User Privacy
- RLS policies
- Data encryption
- GDPR compliance

### Scalability
- Horizontal scaling
- Caching layers
- CDN usage

### Maintainability
- Clean code
- Documentation
- Testing

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
