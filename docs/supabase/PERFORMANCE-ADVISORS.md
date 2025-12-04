# Supabase Performance Advisors - Detaylı Analiz

> **Son Güncelleme:** 3 Aralık 2025  
> **Kaynak:** Supabase Dashboard → Database → Linter → Performance

---

## 📊 Performans Uyarıları Özeti

| Kategori                     | Seviye | Sayı | Etki                                               |
| ---------------------------- | ------ | ---- | -------------------------------------------------- |
| Auth RLS InitPlan            | 🟡 WARN | 70+  | Yüksek - Her satır için auth fonksiyonu çağrılıyor |
| Multiple Permissive Policies | 🟡 WARN | 40+  | Orta - Her policy ayrı ayrı çalıştırılıyor         |
| Duplicate Index              | 🟡 WARN | 7    | Düşük - Gereksiz disk kullanımı                    |
| Unindexed Foreign Keys       | 🔵 INFO | 50+  | Orta - JOIN performansı düşük                      |
| Unused Index                 | 🔵 INFO | 70+  | Düşük - Gereksiz disk kullanımı                    |

---

## 🟡 WARN: Auth RLS InitPlan (70+ policy)

### Problem Nedir?

RLS policy'lerinde `auth.uid()`, `auth.jwt()` gibi fonksiyonlar **her satır için** yeniden çağrılıyor. Bu, büyük tablolarda ciddi performans sorunlarına yol açar.

### Etkilenen Tablolar (Örnekler)

| Tablo                      | Policy Sayısı | Öncelik  |
| -------------------------- | ------------- | -------- |
| `profiles`                 | 10+           | 🔴 Yüksek |
| `notifications`            | 5+            | 🔴 Yüksek |
| `device_tokens`            | 4             | 🟡 Orta   |
| `notification_preferences` | 3             | 🟡 Orta   |
| `blocked_users`            | 3             | 🟡 Orta   |
| `admin_profiles`           | 2             | 🟡 Orta   |
| `sessions`                 | 2             | 🟡 Orta   |
| `audit_logs`               | 2             | 🟡 Orta   |
| `notification_campaigns`   | 4             | 🟡 Orta   |
| `notification_templates`   | 4             | 🟡 Orta   |
| `notification_logs`        | 1             | 🟢 Düşük  |
| `notification_categories`  | 2             | 🟢 Düşük  |
| `content`                  | 1             | 🟢 Düşük  |

### ❌ Yanlış Kullanım

```sql
CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
```

### ✅ Doğru Kullanım

```sql
CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

### Fark Nedir?

| Yanlış                  | Doğru                         |
| ----------------------- | ----------------------------- |
| `auth.uid()`            | `(SELECT auth.uid())`         |
| Her satır için çağrılır | Bir kez çağrılır, cache'lenir |
| O(n) performans         | O(1) performans               |

### Düzeltme Script'i

```sql
-- Örnek: profiles tablosu için
DROP POLICY IF EXISTS "users_view_own_profiles" ON public.profiles;

CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

---

## 🟡 WARN: Multiple Permissive Policies (40+ tablo)

### Problem Nedir?

Aynı tablo, rol ve aksiyon için birden fazla PERMISSIVE policy varsa, **her biri ayrı ayrı** çalıştırılır. Bu gereksiz yük oluşturur.

### Etkilenen Tablolar (Örnekler)

| Tablo           | Aksiyon | Policy Sayısı | Policy'ler                                                                                        |
| --------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `profiles`      | SELECT  | 6             | users_view_own_profiles, admins_view_all_profiles, shadow_isolation, ...                          |
| `profiles`      | INSERT  | 3             | Only authenticated users can create profiles, admins_insert_profiles, users_insert_own_profiles   |
| `profiles`      | UPDATE  | 3             | Users can update own real profile, Users can update own shadow profile, users_update_own_profiles |
| `device_tokens` | SELECT  | 2             | Users can view own device tokens, Users can view own tokens                                       |
| `device_tokens` | INSERT  | 2             | Users can insert own device tokens, Users can insert own tokens                                   |
| `device_tokens` | UPDATE  | 2             | Users can update own device tokens, Users can update own tokens                                   |
| `device_tokens` | DELETE  | 2             | Users can delete own device tokens, Users can delete own tokens                                   |
| `notifications` | INSERT  | 2             | Admin can insert notifications, Service role can insert notifications                             |
| `sessions`      | SELECT  | 2             | Admins can view all sessions, Users can view own sessions                                         |
| `sessions`      | UPDATE  | 2             | Admins can update all sessions, Users can update own sessions                                     |

### Çözüm

Birden fazla PERMISSIVE policy'yi tek bir policy'de birleştir:

```sql
-- ❌ Yanlış: 2 ayrı policy
CREATE POLICY "Users can view own tokens" ON device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own device tokens" ON device_tokens FOR SELECT USING (auth.uid() = user_id);

-- ✅ Doğru: Tek policy
DROP POLICY IF EXISTS "Users can view own tokens" ON device_tokens;
DROP POLICY IF EXISTS "Users can view own device tokens" ON device_tokens;

CREATE POLICY "users_view_own_device_tokens" ON device_tokens
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

---

## 🟡 WARN: Duplicate Index (7 index)

### Problem Nedir?

Aynı column(lar) için birden fazla aynı index var. Bu gereksiz disk alanı kullanır ve INSERT/UPDATE performansını düşürür.

### Etkilenen Tablolar

| Tablo                      | Duplicate Index'ler                                                            | Aksiyon    |
| -------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `device_tokens`            | `device_tokens_user_id_idx`, `idx_device_tokens_user_id`                       | Birini sil |
| `notification_campaigns`   | `idx_notification_campaigns_status`, `notification_campaigns_status_idx`       | Birini sil |
| `notification_logs`        | `idx_notification_logs_campaign_id`, `notification_logs_campaign_id_idx`       | Birini sil |
| `notification_logs`        | `idx_notification_logs_recipient_id`, `notification_logs_recipient_id_idx`     | Birini sil |
| `notification_preferences` | `idx_notification_preferences_user_id`, `notification_preferences_user_id_idx` | Birini sil |
| `ops_messages`             | `idx_ops_messages_conversation`, `idx_ops_messages_conversation_created`       | Kontrol et |
| `post_media`               | `idx_post_media_post_id`, `post_media_post_id_idx`                             | Birini sil |

### Düzeltme Script'i

```sql
-- Duplicate index'leri sil (birini tut)
DROP INDEX IF EXISTS idx_device_tokens_user_id;
DROP INDEX IF EXISTS notification_campaigns_status_idx;
DROP INDEX IF EXISTS notification_logs_campaign_id_idx;
DROP INDEX IF EXISTS notification_logs_recipient_id_idx;
DROP INDEX IF EXISTS notification_preferences_user_id_idx;
DROP INDEX IF EXISTS post_media_post_id_idx;
```

---

## 🔵 INFO: Unindexed Foreign Keys (50+ FK)

### Problem Nedir?

Foreign key constraint'leri için index yoksa, JOIN ve CASCADE işlemleri yavaşlar.

### En Önemli Olanlar

| Tablo                   | Foreign Key                          | Önerilen Index                                                                   |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `messages`              | `messages_sender_profile_id_fkey`    | `CREATE INDEX idx_messages_sender_profile ON messages(sender_profile_id);`       |
| `messages`              | `messages_forwarded_from_id_fkey`    | `CREATE INDEX idx_messages_forwarded_from ON messages(forwarded_from_id);`       |
| `notifications`         | `notifications_actor_id_fkey`        | `CREATE INDEX idx_notifications_actor ON notifications(actor_id);`               |
| `broadcast_messages`    | `broadcast_messages_sender_id_fkey`  | `CREATE INDEX idx_broadcast_messages_sender ON broadcast_messages(sender_id);`   |
| `creator_subscriptions` | `creator_subscriptions_tier_id_fkey` | `CREATE INDEX idx_creator_subscriptions_tier ON creator_subscriptions(tier_id);` |

### Tüm Liste

Detaylı liste için: `docs/supabase/performance/info.md`

---

## 🔵 INFO: Unused Index (70+ index)

### Problem Nedir?

Hiç kullanılmayan index'ler disk alanı tüketir ve INSERT/UPDATE performansını düşürür.

### Önemli Notlar

⚠️ **DİKKAT:** Unused index'leri silmeden önce:
1. Uygulama tam olarak production'da mı kontrol et
2. Tüm query path'leri test edildi mi kontrol et
3. Index'in gelecekte kullanılıp kullanılmayacağını değerlendir

### Silinebilecek Index Örnekleri

| Tablo         | Index                            | Neden Silinebilir |
| ------------- | -------------------------------- | ----------------- |
| `feed_items`  | `feed_items_user_id_idx`         | Kullanılmıyor     |
| `feed_items`  | `feed_items_expires_at_idx`      | Kullanılmıyor     |
| `feed_items`  | `feed_items_relevance_score_idx` | Kullanılmıyor     |
| `stories`     | `idx_stories_user_id`            | Kullanılmıyor     |
| `stories`     | `idx_stories_expires_at`         | Kullanılmıyor     |
| `stories`     | `idx_stories_visibility`         | Kullanılmıyor     |
| `story_views` | `idx_story_views_story_id`       | Kullanılmıyor     |
| `story_views` | `idx_story_views_viewer_id`      | Kullanılmıyor     |

### Tüm Liste

Detaylı liste için: `docs/supabase/performance/info.md`

---

## 📋 Düzeltme Öncelik Sırası

| Öncelik | Kategori                     | Etki   | Zorluk   | Aksiyon                              |
| ------- | ---------------------------- | ------ | -------- | ------------------------------------ |
| 1️⃣       | Auth RLS InitPlan            | Yüksek | Kolay    | `auth.uid()` → `(SELECT auth.uid())` |
| 2️⃣       | Multiple Permissive Policies | Orta   | Orta     | Policy'leri birleştir                |
| 3️⃣       | Duplicate Index              | Düşük  | Kolay    | Duplicate'leri sil                   |
| 4️⃣       | Unindexed FK                 | Orta   | Kolay    | Index ekle                           |
| 5️⃣       | Unused Index                 | Düşük  | Dikkatli | Analiz et, gerekirse sil             |

---

## 🔗 Referanslar

- [RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Database Linter - Auth RLS InitPlan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Database Linter - Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Database Linter - Duplicate Index](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index)
- [Database Linter - Unindexed FK](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [Database Linter - Unused Index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)
