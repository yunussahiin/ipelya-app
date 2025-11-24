# İpelya Home Feed - Web Ops Database Tables

## 📊 Ops-Specific Tables

Bu döküman, Web Ops paneline özel database tablolarını içerir. Home Feed core tables (posts, mini_posts, vb.) Phase 2'de oluşturulacak.

---

## 🔔 Notification Management Tables

### 1. notification_campaigns

Toplu bildirim kampanyaları.

```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES admin_profiles(id),
  
  -- Campaign Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Targeting
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'segment', 'custom')),
  target_criteria JSONB, -- Segment criteria (vibe, intent, location, etc.)
  target_user_ids UUID[], -- Custom user list
  
  -- Notification
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notification_campaigns_created_by_idx ON notification_campaigns(created_by);
CREATE INDEX notification_campaigns_status_idx ON notification_campaigns(status);
CREATE INDEX notification_campaigns_scheduled_at_idx ON notification_campaigns(scheduled_at);
```

---

### 2. notification_templates

Bildirim şablonları.

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES admin_profiles(id),
  
  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'social', 'content', 'system', 'marketing'
  
  -- Template Content
  title_template TEXT NOT NULL, -- "{{user_name}} seni takip etti"
  body_template TEXT NOT NULL,
  data_template JSONB, -- Template variables
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notification_templates_created_by_idx ON notification_templates(created_by);
CREATE INDEX notification_templates_category_idx ON notification_templates(category);
CREATE INDEX notification_templates_is_active_idx ON notification_templates(is_active);
```

---

### 3. notification_logs

Gönderilen bildirimlerin detaylı logları.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE SET NULL,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES profiles(user_id),
  
  -- Delivery
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  
  -- Device
  device_token TEXT,
  device_type TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notification_logs_campaign_id_idx ON notification_logs(campaign_id);
CREATE INDEX notification_logs_recipient_id_idx ON notification_logs(recipient_id);
CREATE INDEX notification_logs_status_idx ON notification_logs(status);
CREATE INDEX notification_logs_created_at_idx ON notification_logs(created_at DESC);
```

---

## ⚙️ Algorithm Configuration Tables

### 4. algorithm_configs

Algoritma parametreleri ve A/B test konfigürasyonları.

```sql
CREATE TABLE algorithm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES admin_profiles(id),
  
  -- Config Info
  name TEXT NOT NULL,
  description TEXT,
  config_type TEXT NOT NULL CHECK (config_type IN ('weights', 'vibe', 'intent', 'diversity', 'experiment')),
  
  -- Configuration
  config_data JSONB NOT NULL,
  /*
    weights: { base: 0.30, vibe: 0.25, intent: 0.25, social: 0.20 }
    vibe: { energetic: { energetic: 1.0, social: 0.8, ... }, ... }
    intent: { meet_new: { post: 0.8, mini_post: 0.7, ... }, ... }
    diversity: { post: 10, mini_post: 4, ... }
    experiment: { variant: 'treatment', allocation: 0.5, ... }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  
  -- A/B Testing
  experiment_id TEXT,
  variant TEXT, -- 'control', 'treatment'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX algorithm_configs_config_type_idx ON algorithm_configs(config_type);
CREATE INDEX algorithm_configs_is_active_idx ON algorithm_configs(is_active);
CREATE INDEX algorithm_configs_experiment_id_idx ON algorithm_configs(experiment_id);
```

---

## 🛡️ Content Moderation Tables

### 5. moderation_queue

İçerik moderasyon kuyruğu.

```sql
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content Reference
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'mini_post', 'voice_moment', 'poll', 'comment')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  
  -- Moderation
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  reason TEXT NOT NULL CHECK (reason IN ('ai_flagged', 'user_reported', 'manual_review')),
  
  -- AI Scores
  toxicity_score DECIMAL(5,2),
  nsfw_score DECIMAL(5,2),
  spam_score DECIMAL(5,2),
  
  -- Reports
  report_count INTEGER DEFAULT 0,
  report_reasons JSONB, -- Array of report reasons
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'escalated')),
  reviewed_by UUID REFERENCES admin_profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX moderation_queue_status_idx ON moderation_queue(status);
CREATE INDEX moderation_queue_priority_idx ON moderation_queue(priority DESC);
CREATE INDEX moderation_queue_content_idx ON moderation_queue(content_type, content_id);
CREATE INDEX moderation_queue_user_id_idx ON moderation_queue(user_id);
CREATE INDEX moderation_queue_created_at_idx ON moderation_queue(created_at DESC);
```

---

## 📊 Analytics Tables

### 6. feed_analytics

Feed performans metrikleri (günlük snapshot).

```sql
CREATE TABLE feed_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- Feed Metrics
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  
  -- Engagement
  avg_dwell_time DECIMAL(10,2), -- seconds
  avg_session_length DECIMAL(10,2), -- seconds
  engagement_rate DECIMAL(5,2), -- (likes + comments + shares) / views
  
  -- Content Distribution
  posts_count INTEGER DEFAULT 0,
  mini_posts_count INTEGER DEFAULT 0,
  voice_moments_count INTEGER DEFAULT 0,
  polls_count INTEGER DEFAULT 0,
  
  -- Algorithm Performance
  vibe_match_success_rate DECIMAL(5,2),
  intent_match_success_rate DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date)
);

CREATE INDEX feed_analytics_date_idx ON feed_analytics(date DESC);
```

---

### 7. user_behavior_logs

Kullanıcı davranış logları (adaptive feed için).

```sql
CREATE TABLE user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  
  -- Action
  action TEXT NOT NULL CHECK (action IN ('view', 'like', 'comment', 'share', 'skip')),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  
  -- Context
  dwell_time DECIMAL(10,2), -- seconds
  scroll_depth DECIMAL(5,2), -- percentage
  
  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_behavior_logs_user_id_idx ON user_behavior_logs(user_id);
CREATE INDEX user_behavior_logs_action_idx ON user_behavior_logs(action);
CREATE INDEX user_behavior_logs_timestamp_idx ON user_behavior_logs(timestamp DESC);

-- Partition by month for performance
CREATE TABLE user_behavior_logs_2025_11 PARTITION OF user_behavior_logs
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

---

## 🔄 RLS Policies

### notification_campaigns

```sql
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can view all campaigns
CREATE POLICY "Admins can view campaigns"
ON notification_campaigns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Admins can create campaigns
CREATE POLICY "Admins can create campaigns"
ON notification_campaigns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
  AND created_by = auth.uid()
);

-- Admins can update own campaigns
CREATE POLICY "Admins can update own campaigns"
ON notification_campaigns FOR UPDATE
USING (created_by = auth.uid());
```

### moderation_queue

```sql
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Moderators can view queue
CREATE POLICY "Moderators can view queue"
ON moderation_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
);

-- Moderators can update queue
CREATE POLICY "Moderators can update queue"
ON moderation_queue FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
);
```

---

## 🔧 Functions & Triggers

### Update campaign stats

```sql
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE notification_campaigns
    SET 
      total_sent = total_sent + 1,
      total_delivered = total_delivered + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'delivered' AND NEW.status = 'delivered' THEN
      UPDATE notification_campaigns
      SET total_delivered = total_delivered + 1
      WHERE id = NEW.campaign_id;
    END IF;
    
    IF OLD.opened_at IS NULL AND NEW.opened_at IS NOT NULL THEN
      UPDATE notification_campaigns
      SET total_opened = total_opened + 1
      WHERE id = NEW.campaign_id;
    END IF;
    
    IF OLD.clicked_at IS NULL AND NEW.clicked_at IS NOT NULL THEN
      UPDATE notification_campaigns
      SET total_clicked = total_clicked + 1
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT OR UPDATE ON notification_logs
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();
```

---

## 📈 Materialized Views

### Active campaigns summary

```sql
CREATE MATERIALIZED VIEW active_campaigns_summary AS
SELECT
  nc.id,
  nc.name,
  nc.status,
  nc.scheduled_at,
  nc.total_recipients,
  nc.total_sent,
  nc.total_delivered,
  nc.total_opened,
  nc.total_clicked,
  CASE 
    WHEN nc.total_sent > 0 
    THEN (nc.total_delivered::DECIMAL / nc.total_sent::DECIMAL) * 100
    ELSE 0
  END as delivery_rate,
  CASE 
    WHEN nc.total_delivered > 0 
    THEN (nc.total_opened::DECIMAL / nc.total_delivered::DECIMAL) * 100
    ELSE 0
  END as open_rate,
  CASE 
    WHEN nc.total_opened > 0 
    THEN (nc.total_clicked::DECIMAL / nc.total_opened::DECIMAL) * 100
    ELSE 0
  END as click_rate
FROM notification_campaigns nc
WHERE nc.status IN ('scheduled', 'sending', 'sent')
ORDER BY nc.created_at DESC;

CREATE INDEX active_campaigns_summary_status_idx ON active_campaigns_summary(status);
```

---

**Son Güncelleme:** 2025-11-24 04:15 UTC+03:00
**Durum:** Tamamlandı ✅
**Sonraki Adım:** Phase 2 - Migration'ları oluştur ve deploy et
