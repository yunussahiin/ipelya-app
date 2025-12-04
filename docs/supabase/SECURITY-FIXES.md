# Supabase Security Fixes - Düzeltme Rehberi

> **Son Güncelleme:** 3 Aralık 2025  
> **Öncelik:** 🔴 KRİTİK - Hemen uygulanmalı

---

## 🔴 1. RLS Disabled Tablolar - Düzeltme

### Etkilenen Tablolar (17 adet)

```sql
-- 1. ops_conversations
ALTER TABLE public.ops_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_ops_conversations" ON public.ops_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "admins_insert_ops_conversations" ON public.ops_conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- 2. ops_conversation_participants (zaten policy var, sadece RLS aktif et)
ALTER TABLE public.ops_conversation_participants ENABLE ROW LEVEL SECURITY;

-- 3. user_intents
ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_intents" ON public.user_intents
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 4. post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_shares" ON public.post_shares
  FOR SELECT USING (
    (SELECT auth.uid()) = sharer_id OR (SELECT auth.uid()) = recipient_id
  );

CREATE POLICY "users_create_shares" ON public.post_shares
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sharer_id);

-- 5. post_mentions
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_mentions" ON public.post_mentions
  FOR SELECT USING (
    (SELECT auth.uid()) = mentioned_user_id OR (SELECT auth.uid()) = mentioner_user_id
  );

-- 6. poll_options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_poll_options" ON public.poll_options
  FOR SELECT USING (true);

CREATE POLICY "poll_owner_manage_options" ON public.poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE polls.id = poll_options.poll_id AND polls.user_id = (SELECT auth.uid())
    )
  );

-- 7. poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_votes" ON public.poll_votes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "poll_owner_view_votes" ON public.poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE polls.id = poll_votes.poll_id AND polls.user_id = (SELECT auth.uid())
    )
  );

-- 8. user_vibes
ALTER TABLE public.user_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_vibes" ON public.user_vibes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "anyone_view_vibes" ON public.user_vibes
  FOR SELECT USING (true);

-- 9. user_interests
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_interests" ON public.user_interests
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "anyone_view_interests" ON public.user_interests
  FOR SELECT USING (true);

-- 10. user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_connections" ON public.user_connections
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- 11. crystal_gifts
ALTER TABLE public.crystal_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_gifts" ON public.crystal_gifts
  FOR SELECT USING (
    (SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = recipient_id
  );

CREATE POLICY "users_send_gifts" ON public.crystal_gifts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id);

-- 12. micro_groups
ALTER TABLE public.micro_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_groups" ON public.micro_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = micro_groups.id 
      AND group_members.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "owner_manage_groups" ON public.micro_groups
  FOR ALL USING ((SELECT auth.uid()) = owner_id);

-- 13. group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_view_group_members" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = (SELECT auth.uid())
    )
  );

-- 14. feed_items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_feed" ON public.feed_items
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "service_role_manage_feed" ON public.feed_items
  FOR ALL USING (auth.role() = 'service_role');

-- 15. algorithm_configs (sadece admin)
ALTER TABLE public.algorithm_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_algorithm_configs" ON public.algorithm_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- 16. moderation_queue (sadece admin)
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_moderation_queue" ON public.moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- 17. feed_analytics (sadece admin)
ALTER TABLE public.feed_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_feed_analytics" ON public.feed_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "service_role_manage_feed_analytics" ON public.feed_analytics
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 🔴 2. Security Definer View - Düzeltme

### current_coin_rate View

```sql
-- Mevcut view'ı kontrol et
SELECT definition FROM pg_views WHERE viewname = 'current_coin_rate';

-- View'ı SECURITY INVOKER olarak yeniden oluştur
DROP VIEW IF EXISTS public.current_coin_rate;

CREATE VIEW public.current_coin_rate
WITH (security_invoker = true)
AS
  SELECT * FROM public.coin_rates
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

-- View'a erişim izni ver
GRANT SELECT ON public.current_coin_rate TO authenticated;
GRANT SELECT ON public.current_coin_rate TO anon;
```

---

## 🟡 3. Function Search Path - Düzeltme

### Tüm Fonksiyonları Güncelle

```sql
-- 1. handle_new_follower_notification
CREATE OR REPLACE FUNCTION public.handle_new_follower_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- existing function body
  RETURN NEW;
END;
$$;

-- 2. handle_follow_back_notification
CREATE OR REPLACE FUNCTION public.handle_follow_back_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- existing function body
  RETURN NEW;
END;
$$;

-- 3. get_active_profile_type
CREATE OR REPLACE FUNCTION public.get_active_profile_type()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- existing function body
END;
$$;

-- 4. increment_post_likes
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- 5. decrement_post_likes
CREATE OR REPLACE FUNCTION public.decrement_post_likes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Diğer fonksiyonlar için aynı pattern'i uygula...
```

---

## 🟡 4. RLS Enabled No Policy - Düzeltme

### polls tablosu

```sql
-- Eğer polls tablosuna erişim gerekiyorsa policy ekle
CREATE POLICY "anyone_view_active_polls" ON public.polls
  FOR SELECT USING (is_active = true);

CREATE POLICY "users_manage_own_polls" ON public.polls
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Eğer erişim gerekmiyorsa RLS'i kapat
-- ALTER TABLE public.polls DISABLE ROW LEVEL SECURITY;
```

### voice_moments tablosu

```sql
-- Eğer voice_moments tablosuna erişim gerekiyorsa policy ekle
CREATE POLICY "anyone_view_voice_moments" ON public.voice_moments
  FOR SELECT USING (true);

CREATE POLICY "users_manage_own_voice_moments" ON public.voice_moments
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Eğer erişim gerekmiyorsa RLS'i kapat
-- ALTER TABLE public.voice_moments DISABLE ROW LEVEL SECURITY;
```

---

## 🟡 5. Leaked Password Protection

Supabase Dashboard'dan aktif et:

1. **Authentication** → **Settings** → **Security**
2. **Enable "Leaked Password Protection"** seçeneğini aç
3. **Save** butonuna tıkla

---

## 📋 Uygulama Sırası

1. ✅ Önce backup al
2. ✅ RLS Disabled tabloları düzelt (en kritik)
3. ✅ Security Definer View'ı düzelt
4. ✅ Function Search Path'leri düzelt
5. ✅ RLS Enabled No Policy tabloları düzelt
6. ✅ Leaked Password Protection'ı aktif et
7. ✅ Test et

---

## ⚠️ Dikkat Edilecekler

1. **Backup Al:** Değişikliklerden önce mutlaka backup al
2. **Test Et:** Her değişiklikten sonra uygulamayı test et
3. **Aşamalı Uygula:** Tüm değişiklikleri bir seferde yapma
4. **Monitoring:** Değişikliklerden sonra hata loglarını izle
5. **Rollback Planı:** Sorun olursa geri alma planın olsun
