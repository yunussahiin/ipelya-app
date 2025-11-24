# İpelya Home Feed - Algorithm & Scoring System

## 🧠 Genel Bakış

Bu döküman, İpelya Home Feed'in algoritma mantığını, scoring sistemini ve kişiselleştirme stratejilerini detaylı olarak açıklar.

---

## 🎯 Feed Algorithm Overview

İpelya feed algoritması 4 ana katmandan oluşur:

```
1. Content Retrieval (İçerik Toplama)
   ↓
2. Relevance Scoring (İlgi Skoru Hesaplama)
   ↓
3. Diversity Mixing (Çeşitlilik Karıştırma)
   ↓
4. Final Ranking (Son Sıralama)
```

---

## 📊 Scoring Components

### 1. Base Relevance Score

Her içerik için temel ilgi skoru hesaplanır.

**Formula:**
```
base_score = (
  interest_match * 0.30 +
  location_proximity * 0.20 +
  recency * 0.15 +
  engagement_rate * 0.20 +
  content_quality * 0.15
)
```

**Components:**

#### Interest Match (İlgi Alanı Eşleşmesi)
```sql
CREATE OR REPLACE FUNCTION calculate_interest_match(
  p_user_id UUID,
  p_content_user_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  common_interests INTEGER;
  total_interests INTEGER;
BEGIN
  -- Ortak ilgi alanı sayısı
  SELECT COUNT(*)
  INTO common_interests
  FROM user_interests ui1
  JOIN user_interests ui2 ON ui1.interest_name = ui2.interest_name
  WHERE ui1.user_id = p_user_id
    AND ui2.user_id = p_content_user_id;
  
  -- Toplam ilgi alanı sayısı
  SELECT COUNT(DISTINCT interest_name)
  INTO total_interests
  FROM user_interests
  WHERE user_id IN (p_user_id, p_content_user_id);
  
  -- Jaccard similarity
  IF total_interests = 0 THEN
    RETURN 0.0;
  END IF;
  
  RETURN (common_interests::DECIMAL / total_interests::DECIMAL);
END;
$$ LANGUAGE plpgsql;
```

#### Location Proximity (Konum Yakınlığı)
```sql
CREATE OR REPLACE FUNCTION calculate_location_proximity(
  p_user_lat DECIMAL,
  p_user_lng DECIMAL,
  p_content_lat DECIMAL,
  p_content_lng DECIMAL
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  distance_km DECIMAL;
BEGIN
  -- Haversine formula
  distance_km := (
    6371 * acos(
      cos(radians(p_user_lat)) *
      cos(radians(p_content_lat)) *
      cos(radians(p_content_lng) - radians(p_user_lng)) +
      sin(radians(p_user_lat)) *
      sin(radians(p_content_lat))
    )
  );
  
  -- Normalize to 0-1 (max 50km)
  IF distance_km >= 50 THEN
    RETURN 0.0;
  END IF;
  
  RETURN (1.0 - (distance_km / 50.0));
END;
$$ LANGUAGE plpgsql;
```

#### Recency (Yenilik)
```sql
CREATE OR REPLACE FUNCTION calculate_recency_score(
  p_created_at TIMESTAMPTZ
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  hours_ago DECIMAL;
BEGIN
  hours_ago := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;
  
  -- Exponential decay (half-life: 24 hours)
  RETURN EXP(-0.693 * hours_ago / 24.0);
END;
$$ LANGUAGE plpgsql;
```

#### Engagement Rate (Etkileşim Oranı)
```sql
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
  p_likes INTEGER,
  p_comments INTEGER,
  p_shares INTEGER,
  p_views INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_engagement INTEGER;
  engagement_rate DECIMAL;
BEGIN
  total_engagement := (p_likes * 1) + (p_comments * 3) + (p_shares * 5);
  
  IF p_views = 0 THEN
    RETURN 0.0;
  END IF;
  
  engagement_rate := (total_engagement::DECIMAL / p_views::DECIMAL);
  
  -- Normalize to 0-1 (cap at 0.5 engagement rate)
  RETURN LEAST(engagement_rate / 0.5, 1.0);
END;
$$ LANGUAGE plpgsql;
```

#### Content Quality (İçerik Kalitesi)
```sql
CREATE OR REPLACE FUNCTION calculate_content_quality(
  p_has_media BOOLEAN,
  p_caption_length INTEGER,
  p_is_flagged BOOLEAN,
  p_moderation_score DECIMAL
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  quality_score DECIMAL := 0.5;
BEGIN
  -- Media bonus
  IF p_has_media THEN
    quality_score := quality_score + 0.2;
  END IF;
  
  -- Caption length bonus (optimal: 100-300 chars)
  IF p_caption_length BETWEEN 100 AND 300 THEN
    quality_score := quality_score + 0.2;
  ELSIF p_caption_length > 0 THEN
    quality_score := quality_score + 0.1;
  END IF;
  
  -- Moderation penalty
  IF p_is_flagged THEN
    quality_score := quality_score * 0.5;
  END IF;
  
  quality_score := quality_score * p_moderation_score;
  
  RETURN LEAST(quality_score, 1.0);
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Vibe Match Score

Kullanıcının mevcut mood'una göre içerik uyumu.

**Formula:**
```
vibe_match_score = (
  mood_compatibility * 0.40 +
  energy_level_match * 0.30 +
  time_of_day_match * 0.30
)
```

**Implementation:**
```typescript
const calculateVibeMatchScore = (
  userVibe: VibeType,
  userIntensity: number,
  contentVibe: VibeType,
  contentIntensity: number,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): number => {
  // Mood compatibility matrix
  const compatibilityMatrix: Record<VibeType, Record<VibeType, number>> = {
    energetic: {
      energetic: 1.0,
      social: 0.8,
      adventurous: 0.9,
      creative: 0.6,
      chill: 0.3,
    },
    chill: {
      chill: 1.0,
      creative: 0.8,
      social: 0.5,
      energetic: 0.3,
      adventurous: 0.2,
    },
    social: {
      social: 1.0,
      energetic: 0.8,
      adventurous: 0.7,
      creative: 0.6,
      chill: 0.5,
    },
    creative: {
      creative: 1.0,
      chill: 0.8,
      social: 0.6,
      adventurous: 0.5,
      energetic: 0.6,
    },
    adventurous: {
      adventurous: 1.0,
      energetic: 0.9,
      social: 0.7,
      creative: 0.5,
      chill: 0.2,
    },
  };
  
  const moodCompatibility = compatibilityMatrix[userVibe][contentVibe];
  
  // Energy level match (intensity difference)
  const intensityDiff = Math.abs(userIntensity - contentIntensity);
  const energyLevelMatch = 1.0 - (intensityDiff / 5.0);
  
  // Time of day match
  const timeOfDayBonus: Record<string, Record<VibeType, number>> = {
    morning: {
      energetic: 1.0,
      social: 0.8,
      adventurous: 0.9,
      creative: 0.7,
      chill: 0.5,
    },
    afternoon: {
      social: 1.0,
      energetic: 0.9,
      adventurous: 0.8,
      creative: 0.8,
      chill: 0.6,
    },
    evening: {
      social: 1.0,
      chill: 0.9,
      creative: 0.8,
      energetic: 0.6,
      adventurous: 0.5,
    },
    night: {
      chill: 1.0,
      creative: 0.9,
      social: 0.7,
      energetic: 0.4,
      adventurous: 0.3,
    },
  };
  
  const timeOfDayMatch = timeOfDayBonus[timeOfDay][contentVibe];
  
  return (
    moodCompatibility * 0.4 +
    energyLevelMatch * 0.3 +
    timeOfDayMatch * 0.3
  );
};
```

---

### 3. Intent Match Score

Kullanıcının dating intent'ine göre içerik uyumu.

**Formula:**
```
intent_match_score = (
  intent_compatibility * 0.50 +
  content_type_match * 0.30 +
  user_behavior_match * 0.20
)
```

**Implementation:**
```typescript
const calculateIntentMatchScore = (
  userIntents: UserIntent[],
  contentType: ContentType,
  contentMetadata: any
): number => {
  // Intent compatibility with content types
  const intentContentMatrix: Record<IntentType, Record<ContentType, number>> = {
    meet_new: {
      post: 0.8,
      mini_post: 0.7,
      voice_moment: 0.9,
      poll: 0.6,
      suggestions: 1.0,
      vibe_block: 0.7,
      irl_event: 0.8,
      micro_group: 0.9,
    },
    activity_partner: {
      post: 0.7,
      mini_post: 0.5,
      voice_moment: 0.6,
      poll: 0.8,
      suggestions: 0.9,
      vibe_block: 0.8,
      irl_event: 1.0,
      micro_group: 1.0,
    },
    flirt: {
      post: 1.0,
      mini_post: 0.8,
      voice_moment: 1.0,
      poll: 0.7,
      suggestions: 1.0,
      vibe_block: 0.9,
      irl_event: 0.6,
      micro_group: 0.5,
    },
    serious_relationship: {
      post: 0.9,
      mini_post: 0.6,
      voice_moment: 0.8,
      poll: 0.7,
      suggestions: 1.0,
      vibe_block: 0.8,
      irl_event: 0.7,
      micro_group: 0.8,
    },
  };
  
  // Weighted average based on intent priorities
  let intentCompatibility = 0;
  let totalPriority = 0;
  
  userIntents.forEach((intent) => {
    const compatibility = intentContentMatrix[intent.intent_type][contentType];
    intentCompatibility += compatibility * intent.priority;
    totalPriority += intent.priority;
  });
  
  intentCompatibility = totalPriority > 0 ? intentCompatibility / totalPriority : 0;
  
  // Content type specific bonuses
  let contentTypeMatch = 0.5;
  
  if (contentType === 'post' && contentMetadata.has_media) {
    contentTypeMatch += 0.3;
  }
  
  if (contentType === 'voice_moment') {
    contentTypeMatch += 0.2;
  }
  
  if (contentType === 'irl_event') {
    contentTypeMatch += 0.3;
  }
  
  // User behavior match (placeholder - would use ML model)
  const userBehaviorMatch = 0.7;
  
  return (
    intentCompatibility * 0.5 +
    contentTypeMatch * 0.3 +
    userBehaviorMatch * 0.2
  );
};
```

---

### 4. Social Graph Score

Kullanıcının sosyal bağlantılarına göre içerik uyumu.

**Formula:**
```
social_graph_score = (
  connection_strength * 0.40 +
  mutual_friends * 0.30 +
  interaction_history * 0.30
)
```

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION calculate_social_graph_score(
  p_user_id UUID,
  p_content_user_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  connection_strength DECIMAL := 0.0;
  mutual_friends INTEGER := 0;
  interaction_history DECIMAL := 0.0;
BEGIN
  -- Connection strength
  SELECT
    CASE
      WHEN connection_type = 'friend' AND status = 'accepted' THEN 1.0
      WHEN connection_type = 'follow' AND status = 'accepted' THEN 0.7
      ELSE 0.0
    END
  INTO connection_strength
  FROM user_connections
  WHERE user_id = p_user_id
    AND connected_user_id = p_content_user_id;
  
  -- Mutual friends
  SELECT COUNT(*)
  INTO mutual_friends
  FROM user_connections uc1
  JOIN user_connections uc2 ON uc1.connected_user_id = uc2.connected_user_id
  WHERE uc1.user_id = p_user_id
    AND uc2.user_id = p_content_user_id
    AND uc1.status = 'accepted'
    AND uc2.status = 'accepted';
  
  -- Normalize mutual friends (max 10)
  mutual_friends := LEAST(mutual_friends, 10);
  
  -- Interaction history (likes, comments, shares in last 30 days)
  SELECT
    (COUNT(*) / 30.0)
  INTO interaction_history
  FROM (
    SELECT created_at FROM post_likes
    WHERE user_id = p_user_id
      AND post_id IN (
        SELECT id FROM posts WHERE user_id = p_content_user_id
      )
      AND created_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT created_at FROM post_comments
    WHERE user_id = p_user_id
      AND post_id IN (
        SELECT id FROM posts WHERE user_id = p_content_user_id
      )
      AND created_at > NOW() - INTERVAL '30 days'
  ) interactions;
  
  -- Normalize interaction history (cap at 1.0)
  interaction_history := LEAST(interaction_history, 1.0);
  
  RETURN (
    connection_strength * 0.4 +
    (mutual_friends / 10.0) * 0.3 +
    interaction_history * 0.3
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🎲 Diversity Mixing

Feed'de çeşitlilik sağlamak için içerik tipleri karıştırılır.

**Strategy:**
```typescript
const mixFeedItems = (items: FeedItem[]): FeedItem[] => {
  const mixed: FeedItem[] = [];
  
  // Content type distribution (per 20 items)
  const distribution = {
    post: 10,           // 50%
    mini_post: 4,       // 20%
    suggestions: 2,     // 10%
    poll: 2,            // 10%
    voice_moment: 1,    // 5%
    vibe_block: 1,      // 5%
  };
  
  // Group items by type
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.content_type]) {
      acc[item.content_type] = [];
    }
    acc[item.content_type].push(item);
    return acc;
  }, {} as Record<ContentType, FeedItem[]>);
  
  // Mix items based on distribution
  let position = 0;
  while (mixed.length < 20 && position < items.length) {
    for (const [type, count] of Object.entries(distribution)) {
      const typeItems = grouped[type as ContentType] || [];
      const itemsToAdd = typeItems.splice(0, count);
      mixed.push(...itemsToAdd);
    }
    position += 20;
  }
  
  return mixed;
};
```

---

## 🔄 Adaptive Feed Algorithm

Kullanıcı davranışlarına göre feed'i adapte eder.

**Behavior Tracking:**
```typescript
interface UserBehavior {
  content_type_preferences: Record<ContentType, number>;
  engagement_patterns: {
    time_of_day: Record<string, number>;
    day_of_week: Record<string, number>;
  };
  skip_rate: Record<ContentType, number>;
  dwell_time: Record<ContentType, number>;
}

const updateUserBehavior = async (
  userId: string,
  action: 'view' | 'like' | 'comment' | 'share' | 'skip',
  contentType: ContentType,
  dwellTime?: number
) => {
  // Track behavior in database
  await supabase.from('user_behavior_logs').insert({
    user_id: userId,
    action,
    content_type: contentType,
    dwell_time: dwellTime,
    timestamp: new Date().toISOString(),
  });
  
  // Update behavior model
  const behavior = await getUserBehavior(userId);
  
  // Adjust content type preferences
  if (action === 'like' || action === 'comment' || action === 'share') {
    behavior.content_type_preferences[contentType] += 0.1;
  } else if (action === 'skip') {
    behavior.content_type_preferences[contentType] -= 0.05;
  }
  
  // Normalize preferences
  const total = Object.values(behavior.content_type_preferences).reduce((a, b) => a + b, 0);
  Object.keys(behavior.content_type_preferences).forEach((key) => {
    behavior.content_type_preferences[key as ContentType] /= total;
  });
  
  await saveUserBehavior(userId, behavior);
};
```

**Adaptive Scoring:**
```typescript
const calculateAdaptiveScore = (
  baseScore: number,
  vibeMatchScore: number,
  intentMatchScore: number,
  socialGraphScore: number,
  userBehavior: UserBehavior,
  contentType: ContentType
): number => {
  // Base weights
  let weights = {
    base: 0.30,
    vibe: 0.25,
    intent: 0.25,
    social: 0.20,
  };
  
  // Adjust weights based on user behavior
  const contentPreference = userBehavior.content_type_preferences[contentType];
  
  if (contentPreference > 0.3) {
    // User likes this content type - boost base score
    weights.base += 0.1;
    weights.vibe -= 0.05;
    weights.intent -= 0.05;
  } else if (contentPreference < 0.1) {
    // User dislikes this content type - reduce base score
    weights.base -= 0.1;
    weights.vibe += 0.05;
    weights.intent += 0.05;
  }
  
  // Calculate final score
  return (
    baseScore * weights.base +
    vibeMatchScore * weights.vibe +
    intentMatchScore * weights.intent +
    socialGraphScore * weights.social
  );
};
```

---

## 🚀 Performance Optimization

### Caching Strategy

**Feed Cache:**
```sql
-- Pre-compute feed items for active users
CREATE OR REPLACE FUNCTION precompute_feed_items(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete old cache
  DELETE FROM feed_items
  WHERE user_id = p_user_id
    AND expires_at < NOW();
  
  -- Insert new feed items
  INSERT INTO feed_items (
    user_id,
    content_type,
    content_id,
    relevance_score,
    vibe_match_score,
    intent_match_score,
    social_graph_score,
    display_order
  )
  SELECT
    p_user_id,
    'post',
    p.id,
    calculate_base_relevance_score(p_user_id, p.id),
    calculate_vibe_match_score(p_user_id, p.id),
    calculate_intent_match_score(p_user_id, p.id),
    calculate_social_graph_score(p_user_id, p.user_id),
    ROW_NUMBER() OVER (ORDER BY relevance_score DESC)
  FROM posts p
  WHERE p.visibility = 'public'
    AND p.is_hidden = FALSE
    AND p.created_at > NOW() - INTERVAL '7 days'
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
```

### Batch Processing

```typescript
const batchComputeFeedScores = async (userIds: string[]) => {
  const batchSize = 100;
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map((userId) => precomputeFeedItems(userId))
    );
  }
};
```

---

## 📈 A/B Testing

**Experiment Framework:**
```typescript
interface Experiment {
  id: string;
  name: string;
  variants: {
    control: AlgorithmConfig;
    treatment: AlgorithmConfig;
  };
  allocation: number; // 0-1 (50% = 0.5)
}

const getAlgorithmConfig = (userId: string): AlgorithmConfig => {
  const experiments = getActiveExperiments();
  
  for (const experiment of experiments) {
    const hash = hashUserId(userId, experiment.id);
    const allocation = hash % 100 / 100;
    
    if (allocation < experiment.allocation) {
      return experiment.variants.treatment;
    }
  }
  
  return defaultAlgorithmConfig;
};
```

---

## 🎯 Success Metrics

**Key Metrics:**
- **Engagement Rate:** (likes + comments + shares) / views
- **Dwell Time:** Average time spent per item
- **Session Length:** Total time in feed
- **Return Rate:** Users returning within 24h
- **Vibe Match Success:** Conversion rate from vibe-matched content
- **Intent Match Success:** Conversion rate from intent-matched content

**Tracking:**
```typescript
const trackFeedMetrics = async (
  userId: string,
  sessionId: string,
  metrics: {
    items_viewed: number;
    items_liked: number;
    items_commented: number;
    items_shared: number;
    total_dwell_time: number;
    session_length: number;
  }
) => {
  await supabase.from('feed_metrics').insert({
    user_id: userId,
    session_id: sessionId,
    ...metrics,
    timestamp: new Date().toISOString(),
  });
};
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
