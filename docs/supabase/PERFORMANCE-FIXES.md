# Supabase Performance Fixes - Düzeltme Rehberi

> **Son Güncelleme:** 3 Aralık 2025  
> **Öncelik:** 🟡 ORTA - Performans iyileştirmesi

---

## 🟡 1. Auth RLS InitPlan - Düzeltme

### Toplu Düzeltme Script'i

Bu script, tüm RLS policy'lerindeki `auth.uid()` çağrılarını `(SELECT auth.uid())` ile değiştirir.

```sql
-- ============================================
-- PROFILES TABLOSU
-- ============================================

-- 1. users_view_own_profiles
DROP POLICY IF EXISTS "users_view_own_profiles" ON public.profiles;
CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 2. users_update_own_profiles
DROP POLICY IF EXISTS "users_update_own_profiles" ON public.profiles;
CREATE POLICY "users_update_own_profiles" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- 3. shadow_isolation
DROP POLICY IF EXISTS "shadow_isolation" ON public.profiles;
CREATE POLICY "shadow_isolation" ON public.profiles
  FOR SELECT USING (
    type = 'real' OR 
    ((SELECT auth.uid()) = user_id AND type = 'shadow')
  );

-- 4. admins_view_all_profiles
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- 5. admins_insert_profiles
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.profiles;
CREATE POLICY "admins_insert_profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- 6. users_insert_own_profiles
DROP POLICY IF EXISTS "users_insert_own_profiles" ON public.profiles;
CREATE POLICY "users_insert_own_profiles" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7. Users can view own real profile
DROP POLICY IF EXISTS "Users can view own real profile" ON public.profiles;
CREATE POLICY "Users can view own real profile" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id AND type = 'real');

-- 8. Users can update own real profile
DROP POLICY IF EXISTS "Users can update own real profile" ON public.profiles;
CREATE POLICY "Users can update own real profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id AND type = 'real');

-- 9. Users can update own shadow profile
DROP POLICY IF EXISTS "Users can update own shadow profile" ON public.profiles;
CREATE POLICY "Users can update own shadow profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id AND type = 'shadow');

-- 10. Only authenticated users can create profiles
DROP POLICY IF EXISTS "Only authenticated users can create profiles" ON public.profiles;
CREATE POLICY "Only authenticated users can create profiles" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 11. Only admins can delete profiles
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Only admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- ============================================
-- ADMIN_PROFILES TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_profiles;
CREATE POLICY "Admins can update own profile" ON public.admin_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can create own profile" ON public.admin_profiles;
CREATE POLICY "Admins can create own profile" ON public.admin_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- BLOCKED_USERS TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;
CREATE POLICY "Users can view their own blocks" ON public.blocked_users
  FOR SELECT USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can create their own blocks" ON public.blocked_users;
CREATE POLICY "Users can create their own blocks" ON public.blocked_users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocked_users;
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
  FOR DELETE USING ((SELECT auth.uid()) = blocker_id);

-- ============================================
-- NOTIFICATIONS TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Admin can insert notifications" ON public.notifications;
CREATE POLICY "Admin can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- ============================================
-- DEVICE_TOKENS TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view own device tokens" ON public.device_tokens;
CREATE POLICY "Users can view own device tokens" ON public.device_tokens
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own device tokens" ON public.device_tokens;
CREATE POLICY "Users can insert own device tokens" ON public.device_tokens
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own device tokens" ON public.device_tokens;
CREATE POLICY "Users can update own device tokens" ON public.device_tokens
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own device tokens" ON public.device_tokens;
CREATE POLICY "Users can delete own device tokens" ON public.device_tokens
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Duplicate policy'leri sil
DROP POLICY IF EXISTS "Users can view own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.device_tokens;

-- ============================================
-- NOTIFICATION_PREFERENCES TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Duplicate policy'leri sil
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;

-- ============================================
-- SESSIONS TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
CREATE POLICY "Admins can view all sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all sessions" ON public.sessions;
CREATE POLICY "Admins can update all sessions" ON public.sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- ============================================
-- AUDIT_LOGS TABLOSU
-- ============================================

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );
```

---

## 🟡 2. Duplicate Index - Düzeltme

```sql
-- Duplicate index'leri sil (birini tut)
DROP INDEX IF EXISTS idx_device_tokens_user_id;
DROP INDEX IF EXISTS notification_campaigns_status_idx;
DROP INDEX IF EXISTS notification_logs_campaign_id_idx;
DROP INDEX IF EXISTS notification_logs_recipient_id_idx;
DROP INDEX IF EXISTS notification_preferences_user_id_idx;
DROP INDEX IF EXISTS post_media_post_id_idx;

-- ops_messages için kontrol et (farklı olabilir)
-- idx_ops_messages_conversation vs idx_ops_messages_conversation_created
-- Eğer ikisi de aynı column'ları içeriyorsa birini sil
```

---

## 🔵 3. Unindexed Foreign Keys - Düzeltme

### Yüksek Öncelikli Index'ler

```sql
-- Messages tablosu
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile 
  ON public.messages(sender_profile_id);

CREATE INDEX IF NOT EXISTS idx_messages_forwarded_from 
  ON public.messages(forwarded_from_id);

CREATE INDEX IF NOT EXISTS idx_messages_sent_by_admin 
  ON public.messages(sent_by_admin_id);

-- Notifications tablosu
CREATE INDEX IF NOT EXISTS idx_notifications_actor 
  ON public.notifications(actor_id);

-- Broadcast tabloları
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sender 
  ON public.broadcast_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_poll 
  ON public.broadcast_messages(poll_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_banned_by 
  ON public.broadcast_channel_members(banned_by);

CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_muted_by 
  ON public.broadcast_channel_members(muted_by);

-- Creator tabloları
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_tier 
  ON public.creator_subscriptions(tier_id);

CREATE INDEX IF NOT EXISTS idx_creator_transactions_created_by 
  ON public.creator_transactions(created_by);

-- Conversations tablosu
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON public.conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_theme_changed_by 
  ON public.conversations(theme_changed_by);

-- KYC tabloları
CREATE INDEX IF NOT EXISTS idx_kyc_applications_reviewed_by 
  ON public.kyc_applications(reviewed_by);

-- Moderation tabloları
CREATE INDEX IF NOT EXISTS idx_moderation_queue_reviewed_by 
  ON public.moderation_queue(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_user 
  ON public.moderation_queue(user_id);

-- Posts tabloları
CREATE INDEX IF NOT EXISTS idx_posts_moderated_by 
  ON public.posts(moderated_by);

CREATE INDEX IF NOT EXISTS idx_post_comments_moderated_by 
  ON public.post_comments(moderated_by);

-- Ops tabloları
CREATE INDEX IF NOT EXISTS idx_ops_message_reactions_admin 
  ON public.ops_message_reactions(admin_id);

CREATE INDEX IF NOT EXISTS idx_ops_message_read_receipts_admin 
  ON public.ops_message_read_receipts(admin_id);

CREATE INDEX IF NOT EXISTS idx_ops_typing_status_admin 
  ON public.ops_typing_status(admin_id);
```

---

## 🔵 4. Unused Index - Analiz

⚠️ **DİKKAT:** Bu index'leri silmeden önce uygulamanın tüm query'lerini kontrol et!

### Muhtemelen Silinebilecek Index'ler

```sql
-- Feed tabloları (henüz kullanılmıyor olabilir)
-- DROP INDEX IF EXISTS feed_items_user_id_idx;
-- DROP INDEX IF EXISTS feed_items_expires_at_idx;
-- DROP INDEX IF EXISTS feed_items_relevance_score_idx;

-- Story tabloları (henüz kullanılmıyor olabilir)
-- DROP INDEX IF EXISTS idx_stories_user_id;
-- DROP INDEX IF EXISTS idx_stories_expires_at;
-- DROP INDEX IF EXISTS idx_stories_visibility;
-- DROP INDEX IF EXISTS idx_stories_processing;

-- Story views (henüz kullanılmıyor olabilir)
-- DROP INDEX IF EXISTS idx_story_views_story_id;
-- DROP INDEX IF EXISTS idx_story_views_viewer_id;
-- DROP INDEX IF EXISTS idx_story_views_viewed_at;

-- AI tabloları (yeni eklendi, henüz kullanılmıyor)
-- DROP INDEX IF EXISTS idx_ai_model_config_type;
-- DROP INDEX IF EXISTS idx_ai_model_config_active;
-- DROP INDEX IF EXISTS idx_ai_model_config_use_cases;
-- DROP INDEX IF EXISTS idx_ai_action_logs_tool_name;
-- DROP INDEX IF EXISTS idx_ai_action_logs_target;
-- DROP INDEX IF EXISTS idx_ai_action_logs_status;
-- DROP INDEX IF EXISTS idx_ai_action_logs_admin_id;
```

### Kesinlikle Silme (Önce Kontrol Et)

Bu index'ler gelecekte kullanılabilir:
- `idx_subscriptions_subscriber`
- `idx_tier_templates_active`
- `idx_tier_benefits_category`
- `idx_creator_balances_available`

---

## 📋 Uygulama Sırası

1. ✅ Backup al
2. ✅ Auth RLS InitPlan düzeltmelerini uygula
3. ✅ Duplicate Index'leri sil
4. ✅ Unindexed FK'lar için index ekle
5. ✅ Test et
6. ⏳ Unused Index'leri analiz et (acil değil)

---

## 🧪 Test Checklist

Her düzeltmeden sonra test et:

- [ ] Mobile app login/logout
- [ ] Profile görüntüleme
- [ ] Post oluşturma/görüntüleme
- [ ] Mesajlaşma
- [ ] Bildirimler
- [ ] Admin panel erişimi
- [ ] Story görüntüleme
- [ ] Broadcast kanalları

---

## 📊 Performans Karşılaştırması

Düzeltmelerden önce ve sonra bu query'leri çalıştır:

```sql
-- Query performansını ölç
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE user_id = 'test-user-id';

EXPLAIN ANALYZE
SELECT * FROM notifications WHERE recipient_id = 'test-user-id';

EXPLAIN ANALYZE
SELECT * FROM messages WHERE conversation_id = 'test-conv-id';
```
