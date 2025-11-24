# İpelya Home Feed - Security & Moderation

## 🔐 Genel Bakış

Bu döküman, İpelya Home Feed sisteminin güvenlik protokollerini, içerik moderasyon stratejilerini ve kullanıcı güvenliği önlemlerini detaylı olarak açıklar.

---

## 🛡️ Security Layers

### 1. Authentication & Authorization

**Supabase Auth:**
```typescript
// Auth middleware
const requireAuth = async (req: Request): Promise<User | null> => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
};

// Role-based access control
const requireRole = async (userId: string, requiredRole: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  return profile?.role === requiredRole;
};
```

---

### 2. Row Level Security (RLS)

**Posts Table:**
```sql
-- Users can only view posts they have access to
CREATE POLICY "Users can view accessible posts"
ON posts FOR SELECT
USING (
  -- Public posts
  (visibility = 'public' AND is_hidden = FALSE)
  OR
  -- Own posts
  (user_id = auth.uid())
  OR
  -- Friends-only posts (if connected)
  (
    visibility = 'friends'
    AND is_hidden = FALSE
    AND EXISTS (
      SELECT 1 FROM user_connections
      WHERE user_id = posts.user_id
      AND connected_user_id = auth.uid()
      AND connection_type = 'friend'
      AND status = 'accepted'
    )
  )
);

-- Users can only create posts for themselves
CREATE POLICY "Users can create own posts"
ON posts FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND profile_type IN (
    SELECT profile_type FROM profiles WHERE user_id = auth.uid()
  )
);

-- Users can only update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (user_id = auth.uid());
```

**Shadow Profile Isolation:**
```sql
-- Shadow profile posts are isolated
CREATE POLICY "Shadow profile isolation"
ON posts FOR SELECT
USING (
  -- Real profile can't see shadow posts
  (
    profile_type = 'real'
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND current_profile_type = 'shadow'
    )
  )
  OR
  -- Shadow profile can't see real posts
  (
    profile_type = 'shadow'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND current_profile_type = 'shadow'
    )
  )
);
```

---

### 3. Rate Limiting

**Implementation:**
```typescript
interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
}

const rateLimits: RateLimitConfig[] = [
  { endpoint: '/feed', maxRequests: 100, windowMs: 60000 },
  { endpoint: '/posts', maxRequests: 10, windowMs: 60000 },
  { endpoint: '/posts/:id/like', maxRequests: 60, windowMs: 60000 },
  { endpoint: '/posts/:id/comment', maxRequests: 30, windowMs: 60000 },
];

const checkRateLimit = async (
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  const config = rateLimits.find((r) => r.endpoint === endpoint);
  
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 };
  }
  
  const key = `ratelimit:${userId}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get request count in window
  const { data: requests } = await supabase
    .from('rate_limit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('timestamp', new Date(windowStart).toISOString());
  
  const count = requests?.length || 0;
  
  if (count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + config.windowMs,
    };
  }
  
  // Log request
  await supabase.from('rate_limit_logs').insert({
    user_id: userId,
    endpoint,
    timestamp: new Date().toISOString(),
  });
  
  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    resetAt: windowStart + config.windowMs,
  };
};
```

---

### 4. Input Validation

**Content Validation:**
```typescript
import { z } from 'zod';

const PostSchema = z.object({
  caption: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  media: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
  })).max(10),
  visibility: z.enum(['public', 'friends', 'private']),
  post_type: z.enum(['standard', 'time_capsule', 'anon']),
  mentions: z.array(z.string().uuid()).max(20).optional(),
});

const validatePost = (data: unknown) => {
  try {
    return PostSchema.parse(data);
  } catch (error) {
    throw new Error('INVALID_POST_DATA');
  }
};
```

**SQL Injection Prevention:**
```typescript
// Always use parameterized queries
const getUserPosts = async (userId: string) => {
  // ✅ SAFE
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);
  
  // ❌ UNSAFE - Never do this
  // const { data } = await supabase.rpc('raw_query', {
  //   query: `SELECT * FROM posts WHERE user_id = '${userId}'`
  // });
};
```

---

## 🚨 Content Moderation

### 1. AI Moderation

**OpenAI Moderation API:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: Record<string, number>;
}

const moderateText = async (text: string): Promise<ModerationResult> => {
  const response = await openai.moderations.create({
    input: text,
  });
  
  return response.results[0];
};

const moderateImage = async (imageUrl: string): Promise<ModerationResult> => {
  // Use vision API for image moderation
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image for inappropriate content. Check for: nudity, violence, hate symbols, drugs, weapons. Respond with JSON: { "flagged": boolean, "categories": {...}, "reason": string }',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result;
};
```

**Moderation Pipeline:**
```typescript
const moderateContent = async (
  contentType: 'post' | 'comment' | 'mini_post',
  content: {
    text?: string;
    images?: string[];
  }
): Promise<{
  approved: boolean;
  flagged: boolean;
  reasons: string[];
  toxicity_score: number;
  nsfw_score: number;
}> => {
  const reasons: string[] = [];
  let toxicity_score = 0;
  let nsfw_score = 0;
  
  // Moderate text
  if (content.text) {
    const textResult = await moderateText(content.text);
    
    if (textResult.flagged) {
      reasons.push('Inappropriate text content');
      toxicity_score = Math.max(
        textResult.category_scores.hate || 0,
        textResult.category_scores.harassment || 0,
        textResult.category_scores.violence || 0
      );
    }
  }
  
  // Moderate images
  if (content.images) {
    for (const imageUrl of content.images) {
      const imageResult = await moderateImage(imageUrl);
      
      if (imageResult.flagged) {
        reasons.push('Inappropriate image content');
        nsfw_score = Math.max(nsfw_score, imageResult.category_scores.sexual || 0);
      }
    }
  }
  
  const flagged = reasons.length > 0;
  const approved = !flagged || (toxicity_score < 0.7 && nsfw_score < 0.7);
  
  return {
    approved,
    flagged,
    reasons,
    toxicity_score,
    nsfw_score,
  };
};
```

---

### 2. User Reporting

**Report System:**
```sql
CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Content Reference
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'mini_post', 'voice_moment', 'user')),
  content_id UUID NOT NULL,
  
  -- Report Details
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'hate_speech',
    'violence',
    'nudity',
    'false_information',
    'impersonation',
    'other'
  )),
  description TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX content_reports_reporter_id_idx ON content_reports(reporter_id);
CREATE INDEX content_reports_content_idx ON content_reports(content_type, content_id);
CREATE INDEX content_reports_status_idx ON content_reports(status);
```

**Report API:**
```typescript
const reportContent = async (
  reporterId: string,
  contentType: string,
  contentId: string,
  reason: string,
  description?: string
) => {
  // Check if user already reported this content
  const { data: existing } = await supabase
    .from('content_reports')
    .select('*')
    .eq('reporter_id', reporterId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .single();
  
  if (existing) {
    throw new Error('ALREADY_REPORTED');
  }
  
  // Create report
  const { data: report } = await supabase
    .from('content_reports')
    .insert({
      reporter_id: reporterId,
      content_type: contentType,
      content_id: contentId,
      reason,
      description,
    })
    .select()
    .single();
  
  // Auto-hide content if multiple reports
  const { data: reports } = await supabase
    .from('content_reports')
    .select('*')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('status', 'pending');
  
  if (reports && reports.length >= 5) {
    await autoHideContent(contentType, contentId);
  }
  
  return report;
};
```

---

### 3. Automated Actions

**Auto-hide Content:**
```typescript
const autoHideContent = async (
  contentType: string,
  contentId: string
) => {
  const table = contentType === 'post' ? 'posts' : 
                contentType === 'comment' ? 'post_comments' : 
                'mini_posts';
  
  await supabase
    .from(table)
    .update({
      is_hidden: true,
      is_flagged: true,
    })
    .eq('id', contentId);
  
  // Notify moderators
  await notifyModerators({
    type: 'auto_hide',
    content_type: contentType,
    content_id: contentId,
    reason: 'Multiple user reports',
  });
};
```

**Shadowban System:**
```typescript
const shadowbanUser = async (
  userId: string,
  reason: string,
  duration: number // hours
) => {
  await supabase.from('user_shadowbans').insert({
    user_id: userId,
    reason,
    expires_at: new Date(Date.now() + duration * 3600000).toISOString(),
  });
  
  // Hide all user's content
  await supabase
    .from('posts')
    .update({ is_hidden: true })
    .eq('user_id', userId);
  
  await supabase
    .from('mini_posts')
    .update({ is_hidden: true })
    .eq('user_id', userId);
};
```

---

### 4. Manual Review Queue

**Moderator Dashboard:**
```typescript
const getModerationQueue = async (
  status: 'pending' | 'reviewing' = 'pending',
  limit: number = 50
) => {
  const { data: reports } = await supabase
    .from('content_reports')
    .select(`
      *,
      reporter:profiles!reporter_id(name, avatar),
      content:posts(*)
    `)
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  return reports;
};

const reviewReport = async (
  reportId: string,
  moderatorId: string,
  action: 'approve' | 'remove' | 'warn' | 'ban',
  resolution: string
) => {
  // Update report
  await supabase
    .from('content_reports')
    .update({
      status: 'resolved',
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
      resolution,
    })
    .eq('id', reportId);
  
  // Get report details
  const { data: report } = await supabase
    .from('content_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  if (!report) return;
  
  // Take action
  switch (action) {
    case 'remove':
      await removeContent(report.content_type, report.content_id);
      break;
    case 'warn':
      await warnUser(report.content_id, resolution);
      break;
    case 'ban':
      await banUser(report.content_id, resolution);
      break;
  }
};
```

---

## 🔒 Data Privacy

### 1. GDPR Compliance

**Data Export:**
```typescript
const exportUserData = async (userId: string) => {
  const data = {
    profile: await supabase.from('profiles').select('*').eq('user_id', userId).single(),
    posts: await supabase.from('posts').select('*').eq('user_id', userId),
    comments: await supabase.from('post_comments').select('*').eq('user_id', userId),
    likes: await supabase.from('post_likes').select('*').eq('user_id', userId),
    connections: await supabase.from('user_connections').select('*').eq('user_id', userId),
  };
  
  return data;
};
```

**Data Deletion:**
```typescript
const deleteUserData = async (userId: string) => {
  // Soft delete (anonymize)
  await supabase
    .from('profiles')
    .update({
      name: 'Deleted User',
      avatar: null,
      bio: null,
      is_deleted: true,
    })
    .eq('user_id', userId);
  
  // Delete posts
  await supabase.from('posts').delete().eq('user_id', userId);
  
  // Delete comments
  await supabase.from('post_comments').delete().eq('user_id', userId);
  
  // Delete connections
  await supabase.from('user_connections').delete().eq('user_id', userId);
  
  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);
};
```

---

### 2. Sensitive Data Handling

**Encryption:**
```typescript
import crypto from 'crypto';

const encryptSensitiveData = (data: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

const decryptSensitiveData = (encryptedData: string, key: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

---

## 🚫 Abuse Prevention

### 1. Spam Detection

**Spam Indicators:**
```typescript
const detectSpam = async (
  userId: string,
  content: string
): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }> => {
  const reasons: string[] = [];
  let spamScore = 0;
  
  // Check posting frequency
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  
  if (recentPosts && recentPosts.length > 10) {
    spamScore += 0.3;
    reasons.push('High posting frequency');
  }
  
  // Check for duplicate content
  const { data: duplicates } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .eq('caption', content)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());
  
  if (duplicates && duplicates.length > 0) {
    spamScore += 0.4;
    reasons.push('Duplicate content');
  }
  
  // Check for spam keywords
  const spamKeywords = ['buy now', 'click here', 'limited offer', 'act now'];
  const hasSpamKeywords = spamKeywords.some((keyword) =>
    content.toLowerCase().includes(keyword)
  );
  
  if (hasSpamKeywords) {
    spamScore += 0.3;
    reasons.push('Spam keywords detected');
  }
  
  return {
    isSpam: spamScore > 0.6,
    confidence: spamScore,
    reasons,
  };
};
```

---

### 2. Bot Detection

**Behavioral Analysis:**
```typescript
const detectBot = async (userId: string): Promise<boolean> => {
  // Check account age
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('user_id', userId)
    .single();
  
  const accountAge = Date.now() - new Date(profile?.created_at || 0).getTime();
  
  if (accountAge < 3600000) { // Less than 1 hour old
    return true;
  }
  
  // Check activity patterns
  const { data: activities } = await supabase
    .from('user_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString());
  
  if (!activities) return false;
  
  // Check for suspicious patterns
  const timestamps = activities.map((a) => new Date(a.timestamp).getTime());
  const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
  
  // Bot-like behavior: very consistent intervals
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  
  return variance < 1000; // Very low variance = bot
};
```

---

## 📊 Security Monitoring

**Audit Logging:**
```sql
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id),
  
  -- Event
  event_type TEXT NOT NULL,
  event_data JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX security_audit_logs_user_id_idx ON security_audit_logs(user_id);
CREATE INDEX security_audit_logs_event_type_idx ON security_audit_logs(event_type);
CREATE INDEX security_audit_logs_created_at_idx ON security_audit_logs(created_at DESC);
```

**Anomaly Detection:**
```typescript
const detectAnomalies = async (userId: string) => {
  const { data: logs } = await supabase
    .from('security_audit_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());
  
  if (!logs) return [];
  
  const anomalies: string[] = [];
  
  // Check for multiple IP addresses
  const uniqueIPs = new Set(logs.map((l) => l.ip_address));
  if (uniqueIPs.size > 5) {
    anomalies.push('Multiple IP addresses detected');
  }
  
  // Check for unusual activity times
  const hours = logs.map((l) => new Date(l.created_at).getHours());
  const nightActivity = hours.filter((h) => h >= 2 && h <= 5).length;
  
  if (nightActivity > logs.length * 0.5) {
    anomalies.push('Unusual activity times');
  }
  
  return anomalies;
};
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
