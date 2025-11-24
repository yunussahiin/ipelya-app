# İpelya Home Feed - Database Schema

## 📊 Genel Bakış

Bu döküman, İpelya Home Feed sisteminin tüm database tablolarını, ilişkilerini, indexlerini ve RLS policy'lerini içerir.

---

## 🗄️ Core Tables

### 1. posts

Kullanıcıların paylaştığı ana içerikler (Instagram tarzı).

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  
  -- Content
  caption TEXT,
  location TEXT,
  
  -- Metadata
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  post_type TEXT NOT NULL DEFAULT 'standard' CHECK (post_type IN ('standard', 'time_capsule', 'anon')),
  
  -- Stats
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For time capsules
  
  -- Indexes
  CONSTRAINT posts_user_id_idx FOREIGN KEY (user_id) REFERENCES profiles(user_id)
);

-- Indexes
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX posts_visibility_idx ON posts(visibility);
CREATE INDEX posts_expires_at_idx ON posts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX posts_profile_type_idx ON posts(profile_type);

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. post_media

Post'lara ait medya dosyaları (images/videos).

```sql
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Media Info
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Dimensions
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For videos (seconds)
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX post_media_post_id_idx ON post_media(post_id);
CREATE INDEX post_media_display_order_idx ON post_media(post_id, display_order);
```

---

### 3. mini_posts

Kısa metin paylaşımları (Twitter/X tarzı).

```sql
CREATE TABLE mini_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  
  -- Content
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  is_anon BOOLEAN DEFAULT FALSE,
  
  -- Stats
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX mini_posts_user_id_idx ON mini_posts(user_id);
CREATE INDEX mini_posts_created_at_idx ON mini_posts(created_at DESC);
CREATE INDEX mini_posts_is_anon_idx ON mini_posts(is_anon);
```

---

### 4. voice_moments

Ses paylaşımları.

```sql
CREATE TABLE voice_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  
  -- Audio
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Seconds
  waveform_data JSONB, -- Waveform visualization data
  
  -- Content
  caption TEXT,
  
  -- Stats
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  plays_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX voice_moments_user_id_idx ON voice_moments(user_id);
CREATE INDEX voice_moments_created_at_idx ON voice_moments(created_at DESC);
```

---

### 5. polls

Anketler.

```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  
  -- Content
  question TEXT NOT NULL,
  
  -- Settings
  multiple_choice BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  
  -- Stats
  total_votes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX polls_user_id_idx ON polls(user_id);
CREATE INDEX polls_created_at_idx ON polls(created_at DESC);
CREATE INDEX polls_expires_at_idx ON polls(expires_at) WHERE expires_at IS NOT NULL;
```

---

### 6. poll_options

Anket seçenekleri.

```sql
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  
  -- Content
  option_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  -- Stats
  votes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX poll_options_poll_id_idx ON poll_options(poll_id);
CREATE INDEX poll_options_display_order_idx ON poll_options(poll_id, display_order);
```

---

### 7. poll_votes

Anket oyları.

```sql
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(poll_id, user_id, option_id)
);

-- Indexes
CREATE INDEX poll_votes_poll_id_idx ON poll_votes(poll_id);
CREATE INDEX poll_votes_user_id_idx ON poll_votes(user_id);
CREATE INDEX poll_votes_option_id_idx ON poll_votes(option_id);
```

---

## 🔗 Interaction Tables

### 8. post_likes

Post beğenileri.

```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX post_likes_user_id_idx ON post_likes(user_id);
CREATE INDEX post_likes_created_at_idx ON post_likes(created_at DESC);
```

---

### 9. post_comments

Post yorumları (nested comments support).

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Stats
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX post_comments_user_id_idx ON post_comments(user_id);
CREATE INDEX post_comments_parent_id_idx ON post_comments(parent_comment_id);
CREATE INDEX post_comments_created_at_idx ON post_comments(created_at DESC);
```

---

### 10. post_shares

Post paylaşımları.

```sql
CREATE TABLE post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Share Type
  share_type TEXT NOT NULL CHECK (share_type IN ('dm', 'external', 'story')),
  recipient_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL, -- For DM shares
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX post_shares_post_id_idx ON post_shares(post_id);
CREATE INDEX post_shares_user_id_idx ON post_shares(user_id);
CREATE INDEX post_shares_recipient_id_idx ON post_shares(recipient_id);
```

---

### 11. post_mentions

Post'lardaki mention'lar.

```sql
CREATE TABLE post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  mini_post_id UUID REFERENCES mini_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  
  mentioned_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  mentioner_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Notification
  is_notified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (post_id IS NOT NULL AND mini_post_id IS NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND mini_post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND mini_post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX post_mentions_mentioned_user_idx ON post_mentions(mentioned_user_id);
CREATE INDEX post_mentions_post_id_idx ON post_mentions(post_id);
CREATE INDEX post_mentions_mini_post_id_idx ON post_mentions(mini_post_id);
CREATE INDEX post_mentions_comment_id_idx ON post_mentions(comment_id);
```

---

## 🎯 User Preference Tables

### 12. user_vibes

Kullanıcı mood/vibe durumu.

```sql
CREATE TABLE user_vibes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Vibe
  vibe_type TEXT NOT NULL CHECK (vibe_type IN ('energetic', 'chill', 'social', 'creative', 'adventurous')),
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes
CREATE INDEX user_vibes_user_id_idx ON user_vibes(user_id);
CREATE INDEX user_vibes_expires_at_idx ON user_vibes(expires_at);

-- Function to get current vibe
CREATE OR REPLACE FUNCTION get_current_vibe(p_user_id UUID)
RETURNS TABLE(vibe_type TEXT, intensity INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT uv.vibe_type, uv.intensity
  FROM user_vibes uv
  WHERE uv.user_id = p_user_id
    AND uv.expires_at > NOW()
  ORDER BY uv.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

---

### 13. user_intents

Kullanıcı dating intent'leri.

```sql
CREATE TABLE user_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Intent
  intent_type TEXT NOT NULL CHECK (intent_type IN ('meet_new', 'activity_partner', 'flirt', 'serious_relationship')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, intent_type)
);

-- Indexes
CREATE INDEX user_intents_user_id_idx ON user_intents(user_id);
CREATE INDEX user_intents_intent_type_idx ON user_intents(intent_type);
```

---

### 14. user_interests

Kullanıcı ilgi alanları.

```sql
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Interest
  interest_name TEXT NOT NULL,
  category TEXT, -- e.g., 'sports', 'music', 'books'
  proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, interest_name)
);

-- Indexes
CREATE INDEX user_interests_user_id_idx ON user_interests(user_id);
CREATE INDEX user_interests_interest_name_idx ON user_interests(interest_name);
CREATE INDEX user_interests_category_idx ON user_interests(category);
```

---

## 🌐 Social Graph Tables

### 15. user_connections

Kullanıcı bağlantıları (social graph).

```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Connection Type
  connection_type TEXT NOT NULL CHECK (connection_type IN ('follow', 'friend', 'block')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  
  -- Metadata
  common_interests_count INTEGER DEFAULT 0,
  interaction_score DECIMAL(5,2) DEFAULT 0.0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, connected_user_id),
  CHECK(user_id != connected_user_id)
);

-- Indexes
CREATE INDEX user_connections_user_id_idx ON user_connections(user_id);
CREATE INDEX user_connections_connected_user_id_idx ON user_connections(connected_user_id);
CREATE INDEX user_connections_status_idx ON user_connections(status);
CREATE INDEX user_connections_connection_type_idx ON user_connections(connection_type);
```

---

## 🎁 Gamification Tables

### 16. crystal_gifts

Dijital hediyeler.

```sql
CREATE TABLE crystal_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Gift
  gift_type TEXT NOT NULL CHECK (gift_type IN ('energy_crystal', 'coffee', 'motivation_card', 'flower', 'star')),
  message TEXT,
  
  -- Status
  is_opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK(sender_id != recipient_id)
);

-- Indexes
CREATE INDEX crystal_gifts_sender_id_idx ON crystal_gifts(sender_id);
CREATE INDEX crystal_gifts_recipient_id_idx ON crystal_gifts(recipient_id);
CREATE INDEX crystal_gifts_is_opened_idx ON crystal_gifts(is_opened);
```

---

## 👥 Community Tables

### 17. micro_groups

Mini topluluklar.

```sql
CREATE TABLE micro_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Group Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'books', 'sports', 'music'
  
  -- Settings
  is_private BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 50,
  
  -- Stats
  members_count INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX micro_groups_creator_id_idx ON micro_groups(creator_id);
CREATE INDEX micro_groups_category_idx ON micro_groups(category);
CREATE INDEX micro_groups_is_private_idx ON micro_groups(is_private);
```

---

### 18. group_members

Grup üyeleri.

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES micro_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Role
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'muted', 'banned')),
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX group_members_group_id_idx ON group_members(group_id);
CREATE INDEX group_members_user_id_idx ON group_members(user_id);
CREATE INDEX group_members_role_idx ON group_members(role);
```

---

## 📊 Feed Cache Table

### 19. feed_items

Pre-computed feed cache.

```sql
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Content Reference
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'mini_post', 'voice_moment', 'poll', 'suggestion', 'vibe_block', 'irl_event', 'micro_group')),
  content_id UUID NOT NULL,
  
  -- Scoring
  relevance_score DECIMAL(5,2) NOT NULL,
  vibe_match_score DECIMAL(5,2),
  intent_match_score DECIMAL(5,2),
  social_graph_score DECIMAL(5,2),
  
  -- Metadata
  display_order INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  
  -- Constraints
  UNIQUE(user_id, content_type, content_id)
);

-- Indexes
CREATE INDEX feed_items_user_id_idx ON feed_items(user_id);
CREATE INDEX feed_items_expires_at_idx ON feed_items(expires_at);
CREATE INDEX feed_items_relevance_score_idx ON feed_items(user_id, relevance_score DESC);
CREATE INDEX feed_items_display_order_idx ON feed_items(user_id, display_order);

-- Function to clean expired feed items
CREATE OR REPLACE FUNCTION clean_expired_feed_items()
RETURNS void AS $$
BEGIN
  DELETE FROM feed_items WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cron job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('clean-feed-items', '*/5 * * * *', 'SELECT clean_expired_feed_items()');
```

---

## 🔐 Row Level Security (RLS) Policies

### posts

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can view public posts
CREATE POLICY "Users can view public posts"
ON posts FOR SELECT
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM user_connections
      WHERE user_id = posts.user_id
      AND connected_user_id = auth.uid()
      AND status = 'accepted'
    )
  )
);

-- Users can create their own posts
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (user_id = auth.uid());
```

### post_likes

```sql
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Users can view likes"
ON post_likes FOR SELECT
USING (true);

-- Users can like posts
CREATE POLICY "Users can like posts"
ON post_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can unlike posts
CREATE POLICY "Users can unlike posts"
ON post_likes FOR DELETE
USING (user_id = auth.uid());
```

### post_comments

```sql
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on visible posts
CREATE POLICY "Users can view comments"
ON post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_comments.post_id
    AND (
      posts.visibility = 'public'
      OR posts.user_id = auth.uid()
      OR (
        posts.visibility = 'friends'
        AND EXISTS (
          SELECT 1 FROM user_connections
          WHERE user_id = posts.user_id
          AND connected_user_id = auth.uid()
          AND status = 'accepted'
        )
      )
    )
  )
);

-- Users can create comments
CREATE POLICY "Users can create comments"
ON post_comments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update own comments
CREATE POLICY "Users can update own comments"
ON post_comments FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON post_comments FOR DELETE
USING (user_id = auth.uid());
```

---

## 🔄 Database Functions & Triggers

### Update Stats Functions

```sql
-- Increment post likes count
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_increment
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION increment_post_likes();

-- Decrement post likes count
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_decrement
AFTER DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_post_likes();

-- Increment post comments count
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_increment
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comments();

-- Decrement post comments count
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_decrement
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comments();
```

### Time Capsule Expiration

```sql
-- Delete expired time capsules
CREATE OR REPLACE FUNCTION delete_expired_time_capsules()
RETURNS void AS $$
BEGIN
  DELETE FROM posts
  WHERE post_type = 'time_capsule'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cron job (requires pg_cron extension)
-- SELECT cron.schedule('delete-expired-capsules', '0 * * * *', 'SELECT delete_expired_time_capsules()');
```

---

## 📈 Materialized Views

### Trending Posts View

```sql
CREATE MATERIALIZED VIEW trending_posts AS
SELECT
  p.id,
  p.user_id,
  p.caption,
  p.created_at,
  p.likes_count,
  p.comments_count,
  p.shares_count,
  p.views_count,
  (
    p.likes_count * 2 +
    p.comments_count * 3 +
    p.shares_count * 5 +
    p.views_count * 0.1
  ) / EXTRACT(EPOCH FROM (NOW() - p.created_at)) AS trending_score
FROM posts p
WHERE p.visibility = 'public'
  AND p.is_hidden = FALSE
  AND p.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC
LIMIT 100;

-- Refresh every 5 minutes
CREATE INDEX trending_posts_score_idx ON trending_posts(trending_score DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_posts;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Performance Optimization

### Partitioning (for large tables)

```sql
-- Partition posts by month
CREATE TABLE posts_partitioned (
  LIKE posts INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE posts_2025_01 PARTITION OF posts_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE posts_2025_02 PARTITION OF posts_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Auto-create partitions (requires pg_partman extension)
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
