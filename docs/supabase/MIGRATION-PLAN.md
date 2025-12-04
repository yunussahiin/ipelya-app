# Supabase Database Optimization - Migration Plan

> **Oluşturulma Tarihi:** 3 Aralık 2025  
> **Durum:** 📋 PLANLAMA AŞAMASI  
> **Risk Seviyesi:** 🟡 ORTA (Dikkatli uygulama gerekli)

---

## 📊 Mevcut Durum Analizi

### Tespit Edilen Sorunlar

| Kategori                     | Seviye  | Adet | Öncelik            |
| ---------------------------- | ------- | ---- | ------------------ |
| RLS Disabled Tables          | 🔴 ERROR | 17   | 1 - Kritik         |
| Policy Exists RLS Disabled   | 🔴 ERROR | 1    | 1 - Kritik         |
| Security Definer View        | 🔴 ERROR | 1    | 2 - Yüksek         |
| Function Search Path         | 🟡 WARN  | 30+  | 3 - Orta           |
| Auth RLS InitPlan            | 🟡 WARN  | 70+  | 4 - Orta           |
| Multiple Permissive Policies | 🟡 WARN  | 40+  | 5 - Düşük          |
| Duplicate Index              | 🟡 WARN  | 7    | 6 - Düşük          |
| Unindexed Foreign Keys       | 🔵 INFO  | 50+  | 7 - Düşük          |
| Unused Index                 | 🔵 INFO  | 70+  | 8 - Analiz Gerekli |

---

## 🎯 Migration Stratejisi

### Faz 1: Güvenlik Düzeltmeleri (Kritik)

**Hedef:** RLS kapalı tabloları güvence altına al  
**Risk:** 🔴 Yüksek - Yanlış policy uygulamayı bozabilir  
**Yaklaşım:** Her tablo için mevcut kullanımı analiz et, test et, uygula

### Faz 2: Performans Optimizasyonu (Orta)

**Hedef:** RLS policy'lerini optimize et  
**Risk:** 🟡 Orta - Syntax hatası uygulamayı bozabilir  
**Yaklaşım:** Küçük batch'ler halinde uygula

### Faz 3: Index Temizliği (Düşük)

**Hedef:** Duplicate index'leri sil, eksik index'leri ekle  
**Risk:** 🟢 Düşük - Performans etkisi  
**Yaklaşım:** Bir seferde uygula

---

## 📋 Faz 1: RLS Disabled Tables

### Analiz Edilen Tablolar

| Tablo                           | Mevcut Kullanım     | Önerilen Policy      | Risk   |
| ------------------------------- | ------------------- | -------------------- | ------ |
| `ops_conversations`             | Admin chat          | Sadece admin erişimi | Düşük  |
| `ops_conversation_participants` | Admin chat          | Sadece admin erişimi | Düşük  |
| `user_intents`                  | Kullanıcı niyetleri | Kendi verisi         | Orta   |
| `post_shares`                   | Post paylaşımları   | Gönderen/alıcı       | Orta   |
| `post_mentions`                 | Mention'lar         | Mention eden/edilen  | Orta   |
| `poll_options`                  | Anket seçenekleri   | Herkes okuyabilir    | Düşük  |
| `poll_votes`                    | Anket oyları        | Kendi oyu            | Orta   |
| `user_vibes`                    | Kullanıcı vibes     | Herkes okuyabilir    | Düşük  |
| `user_interests`                | İlgi alanları       | Herkes okuyabilir    | Düşük  |
| `user_connections`              | Bağlantılar         | Kendi verisi         | Orta   |
| `crystal_gifts`                 | Hediye kristalleri  | Gönderen/alıcı       | Yüksek |
| `micro_groups`                  | Mikro gruplar       | Üyeler               | Orta   |
| `group_members`                 | Grup üyeleri        | Üyeler               | Orta   |
| `feed_items`                    | Feed öğeleri        | Kendi feed'i         | Orta   |
| `algorithm_configs`             | Algoritma ayarları  | Sadece admin         | Düşük  |
| `moderation_queue`              | Moderasyon          | Sadece admin         | Düşük  |
| `feed_analytics`                | Feed analitiği      | Sadece admin         | Düşük  |

---

## 🔧 Uygulama Adımları

### Adım 1: Backup Al

```bash
# Supabase CLI ile backup
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Adım 2: Test Ortamı Hazırla

```bash
# Branch oluştur (opsiyonel)
supabase db branch create security-fixes
```

### Adım 3: Migration Dosyaları Oluştur

Her faz için ayrı migration dosyası:

```
supabase/migrations/
├── 20241203_001_enable_rls_admin_tables.sql
├── 20241203_002_enable_rls_user_tables.sql
├── 20241203_003_fix_rls_initplan.sql
├── 20241203_004_remove_duplicate_policies.sql
├── 20241203_005_remove_duplicate_indexes.sql
└── 20241203_006_add_missing_indexes.sql
```

### Adım 4: Her Migration'ı Test Et

```sql
-- Test query'leri çalıştır
-- Mobile app'i test et
-- Admin panel'i test et
```

### Adım 5: Production'a Uygula

```bash
supabase db push
```

---

## 📝 Migration Dosyaları

### Migration 1: Admin Tabloları RLS

**Dosya:** `20241203_001_enable_rls_admin_tables.sql`

```sql
-- ============================================
-- ADMIN TABLOLARI - RLS AKTİF ET
-- Tarih: 2024-12-03
-- Açıklama: Admin-only tablolar için RLS
-- ============================================

-- ops_conversations
ALTER TABLE public.ops_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_conversations_admin_select" ON public.ops_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "ops_conversations_admin_insert" ON public.ops_conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "ops_conversations_admin_update" ON public.ops_conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- ops_conversation_participants (zaten policy var)
ALTER TABLE public.ops_conversation_participants ENABLE ROW LEVEL SECURITY;

-- algorithm_configs
ALTER TABLE public.algorithm_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "algorithm_configs_admin_all" ON public.algorithm_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- moderation_queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_queue_admin_all" ON public.moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- feed_analytics
ALTER TABLE public.feed_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_analytics_admin_select" ON public.feed_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "feed_analytics_service_role" ON public.feed_analytics
  FOR ALL USING ((SELECT auth.role()) = 'service_role');
```

### Migration 2: User Tabloları RLS

**Dosya:** `20241203_002_enable_rls_user_tables.sql`

```sql
-- ============================================
-- USER TABLOLARI - RLS AKTİF ET
-- Tarih: 2024-12-03
-- Açıklama: User tablolar için RLS
-- ============================================

-- user_intents
ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_intents_own" ON public.user_intents
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_shares_select" ON public.post_shares
  FOR SELECT USING (
    (SELECT auth.uid()) = sharer_id OR (SELECT auth.uid()) = recipient_id
  );

CREATE POLICY "post_shares_insert" ON public.post_shares
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sharer_id);

-- post_mentions
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_mentions_select" ON public.post_mentions
  FOR SELECT USING (
    (SELECT auth.uid()) = mentioned_user_id OR 
    (SELECT auth.uid()) = mentioner_user_id
  );

CREATE POLICY "post_mentions_insert" ON public.post_mentions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = mentioner_user_id);

-- poll_options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_options_select" ON public.poll_options
  FOR SELECT USING (true);

CREATE POLICY "poll_options_manage" ON public.poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = (SELECT auth.uid())
    )
  );

-- poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes_own" ON public.poll_votes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "poll_votes_owner_view" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE polls.id = poll_votes.poll_id 
      AND polls.user_id = (SELECT auth.uid())
    )
  );

-- user_vibes
ALTER TABLE public.user_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_vibes_select" ON public.user_vibes
  FOR SELECT USING (true);

CREATE POLICY "user_vibes_own" ON public.user_vibes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- user_interests
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_interests_select" ON public.user_interests
  FOR SELECT USING (true);

CREATE POLICY "user_interests_own" ON public.user_interests
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_connections_own" ON public.user_connections
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- crystal_gifts
ALTER TABLE public.crystal_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crystal_gifts_select" ON public.crystal_gifts
  FOR SELECT USING (
    (SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = recipient_id
  );

CREATE POLICY "crystal_gifts_insert" ON public.crystal_gifts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id);

-- micro_groups
ALTER TABLE public.micro_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "micro_groups_owner" ON public.micro_groups
  FOR ALL USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "micro_groups_member_view" ON public.micro_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = micro_groups.id 
      AND group_members.user_id = (SELECT auth.uid())
    )
  );

-- group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_view" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "group_members_owner_manage" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.micro_groups
      WHERE micro_groups.id = group_members.group_id 
      AND micro_groups.owner_id = (SELECT auth.uid())
    )
  );

-- feed_items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_items_own" ON public.feed_items
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "feed_items_service_role" ON public.feed_items
  FOR ALL USING ((SELECT auth.role()) = 'service_role');
```

### Migration 3: RLS InitPlan Fix

**Dosya:** `20241203_003_fix_rls_initplan.sql`

```sql
-- ============================================
-- RLS INITPLAN FIX
-- Tarih: 2024-12-03
-- Açıklama: auth.uid() -> (SELECT auth.uid())
-- ============================================

-- profiles tablosu
DROP POLICY IF EXISTS "users_view_own_profiles" ON public.profiles;
CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_update_own_profiles" ON public.profiles;
CREATE POLICY "users_update_own_profiles" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_insert_own_profiles" ON public.profiles;
CREATE POLICY "users_insert_own_profiles" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

DROP POLICY IF EXISTS "admins_insert_profiles" ON public.profiles;
CREATE POLICY "admins_insert_profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- admin_profiles tablosu
DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_profiles;
CREATE POLICY "Admins can update own profile" ON public.admin_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can create own profile" ON public.admin_profiles;
CREATE POLICY "Admins can create own profile" ON public.admin_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_profiles;
CREATE POLICY "Admins can view own profile" ON public.admin_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

-- blocked_users tablosu
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;
CREATE POLICY "Users can view their own blocks" ON public.blocked_users
  FOR SELECT USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can create their own blocks" ON public.blocked_users;
CREATE POLICY "Users can create their own blocks" ON public.blocked_users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocked_users;
CREATE POLICY "Users can delete their own blocks" ON public.blocked_users
  FOR DELETE USING ((SELECT auth.uid()) = blocker_id);

-- notifications tablosu
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING ((SELECT auth.uid()) = recipient_id);

-- device_tokens tablosu
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

-- sessions tablosu
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

-- audit_logs tablosu
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid()) AND p.role = 'admin'
    )
  );
```

### Migration 4: Duplicate Policy Temizliği

**Dosya:** `20241203_004_remove_duplicate_policies.sql`

```sql
-- ============================================
-- DUPLICATE POLICY TEMİZLİĞİ
-- Tarih: 2024-12-03
-- Açıklama: Aynı işlevi gören duplicate policy'leri sil
-- ============================================

-- device_tokens - duplicate policy'ler
DROP POLICY IF EXISTS "Users can view own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.device_tokens;

-- notification_preferences - duplicate policy'ler
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
```

### Migration 5: Duplicate Index Temizliği

**Dosya:** `20241203_005_remove_duplicate_indexes.sql`

```sql
-- ============================================
-- DUPLICATE INDEX TEMİZLİĞİ
-- Tarih: 2024-12-03
-- Açıklama: Aynı column'lar için duplicate index'leri sil
-- ============================================

-- device_tokens
DROP INDEX IF EXISTS idx_device_tokens_user_id;

-- notification_campaigns
DROP INDEX IF EXISTS notification_campaigns_status_idx;

-- notification_logs
DROP INDEX IF EXISTS notification_logs_campaign_id_idx;
DROP INDEX IF EXISTS notification_logs_recipient_id_idx;

-- notification_preferences
DROP INDEX IF EXISTS notification_preferences_user_id_idx;

-- post_media
DROP INDEX IF EXISTS post_media_post_id_idx;

-- NOT: ops_messages için idx_ops_messages_conversation ve 
-- idx_ops_messages_conversation_created farklı olabilir, kontrol et
```

### Migration 6: Eksik Index'ler

**Dosya:** `20241203_006_add_missing_indexes.sql`

```sql
-- ============================================
-- EKSİK INDEX'LER
-- Tarih: 2024-12-03
-- Açıklama: Unindexed FK'lar için index ekle
-- ============================================

-- Yüksek öncelikli (sık kullanılan tablolar)
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile 
  ON public.messages(sender_profile_id);

CREATE INDEX IF NOT EXISTS idx_notifications_actor 
  ON public.notifications(actor_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sender 
  ON public.broadcast_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_tier 
  ON public.creator_subscriptions(tier_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON public.conversations(created_by);

-- Orta öncelikli
CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_banned_by 
  ON public.broadcast_channel_members(banned_by);

CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_muted_by 
  ON public.broadcast_channel_members(muted_by);

CREATE INDEX IF NOT EXISTS idx_kyc_applications_reviewed_by 
  ON public.kyc_applications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_reviewed_by 
  ON public.moderation_queue(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_posts_moderated_by 
  ON public.posts(moderated_by);
```

---

## ✅ Test Checklist

Her migration sonrası test edilecekler:

### Mobile App
- [ ] Login/Logout
- [ ] Profile görüntüleme/düzenleme
- [ ] Post oluşturma/görüntüleme/beğenme
- [ ] Yorum yapma
- [ ] Mesajlaşma (DM)
- [ ] Broadcast kanalları
- [ ] Story görüntüleme
- [ ] Bildirimler
- [ ] Abone olma

### Admin Panel
- [ ] Login
- [ ] User listesi
- [ ] Moderasyon kuyruğu
- [ ] KYC başvuruları
- [ ] Analytics dashboard
- [ ] Admin chat

### Edge Functions
- [ ] send-notification
- [ ] buy-coins
- [ ] buy-ppv
- [ ] Diğer functions

---

## 🔄 Rollback Planı

Her migration için rollback script'i:

```sql
-- Migration 1 Rollback
ALTER TABLE public.ops_conversations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ops_conversations_admin_select" ON public.ops_conversations;
-- ... diğer policy'ler

-- Migration 2 Rollback
ALTER TABLE public.user_intents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_intents_own" ON public.user_intents;
-- ... diğer policy'ler
```

---

## 📊 İlerleme Takibi

| Migration                     | Durum      | Tarih | Notlar |
| ----------------------------- | ---------- | ----- | ------ |
| 001_enable_rls_admin_tables   | ⏳ Bekliyor | -     | -      |
| 002_enable_rls_user_tables    | ⏳ Bekliyor | -     | -      |
| 003_fix_rls_initplan          | ⏳ Bekliyor | -     | -      |
| 004_remove_duplicate_policies | ⏳ Bekliyor | -     | -      |
| 005_remove_duplicate_indexes  | ⏳ Bekliyor | -     | -      |
| 006_add_missing_indexes       | ⏳ Bekliyor | -     | -      |

---

## ⚠️ Önemli Notlar

1. **Sıralama Önemli:** Migration'ları sırayla uygula
2. **Test Et:** Her migration sonrası uygulamayı test et
3. **Backup Al:** Her migration öncesi backup al
4. **Rollback Hazır:** Sorun olursa rollback script'ini çalıştır
5. **Peak Saatlerde Yapma:** Düşük trafik saatlerinde uygula
6. **Monitoring:** Uygulama sonrası hata loglarını izle
