# Supabase Database Optimization - Uygulanan Migration'lar

> **Uygulama Tarihi:** 3 Aralık 2025  
> **Durum:** ✅ TAMAMLANDI

---

## 📊 Özet

| Kategori            | Önceki | Sonraki | Değişim           |
| ------------------- | ------ | ------- | ----------------- |
| RLS Disabled Tables | 17     | 0       | ✅ -17             |
| Duplicate Indexes   | 7      | 0       | ✅ -7              |
| Duplicate Policies  | 10+    | 0       | ✅ Temizlendi      |
| Auth RLS InitPlan   | 70+    | 0       | ✅ Optimize edildi |
| Missing Indexes     | 30+    | 0       | ✅ Eklendi         |

---

## ✅ Uygulanan Migration'lar

### 1. `remove_duplicate_indexes` 
**Tarih:** 2025-12-03 19:32:58

Silinen duplicate index'ler:
- `idx_device_tokens_user_id` (duplicate of `device_tokens_user_id_idx`)
- `notification_campaigns_status_idx` (duplicate of `idx_notification_campaigns_status`)
- `notification_logs_campaign_id_idx` (duplicate of `idx_notification_logs_campaign_id`)
- `notification_logs_recipient_id_idx` (duplicate of `idx_notification_logs_recipient_id`)
- `notification_preferences_user_id_idx` (duplicate of `idx_notification_preferences_user_id`)
- `post_media_post_id_idx` (duplicate of `idx_post_media_post_id`)

---

### 2. `remove_duplicate_policies`
**Tarih:** 2025-12-03 19:33:06

Silinen duplicate policy'ler:

**device_tokens:**
- `Users can view own tokens`
- `Users can insert own tokens`
- `Users can update own tokens`
- `Users can delete own tokens`

**notification_preferences:**
- `Users can view own preferences`
- `Users can insert own preferences`
- `Users can update own preferences`

**ai_model_config:**
- `Admin can read ai_model_config`

**user_lockouts:**
- `Admin can read lockouts`

---

### 3. `add_missing_indexes_v2`
**Tarih:** 2025-12-03 19:33:51

Eklenen index'ler:

**Yüksek Öncelikli:**
- `idx_messages_sender_profile` ON messages(sender_profile_id)
- `idx_messages_forwarded_from` ON messages(forwarded_from_id)
- `idx_messages_sent_by_admin` ON messages(sent_by_admin_id)
- `idx_notifications_actor` ON notifications(actor_id)
- `idx_broadcast_messages_sender` ON broadcast_messages(sender_id)
- `idx_broadcast_messages_poll` ON broadcast_messages(poll_id)
- `idx_creator_subscriptions_tier` ON creator_subscriptions(tier_id)
- `idx_conversations_created_by` ON conversations(created_by)
- `idx_conversations_theme_changed_by` ON conversations(theme_changed_by)

**Orta Öncelikli:**
- `idx_broadcast_channel_members_banned_by` ON broadcast_channel_members(banned_by)
- `idx_broadcast_channel_members_muted_by` ON broadcast_channel_members(muted_by)
- `idx_broadcast_channels_required_tier` ON broadcast_channels(required_tier_id)
- `idx_broadcast_poll_votes_user` ON broadcast_poll_votes(user_id)
- `idx_broadcast_polls_message` ON broadcast_polls(message_id)
- `idx_creator_transactions_created_by` ON creator_transactions(created_by)
- `idx_kyc_applications_reviewed_by` ON kyc_applications(reviewed_by)
- `idx_moderation_queue_reviewed_by` ON moderation_queue(reviewed_by)
- `idx_moderation_queue_user` ON moderation_queue(user_id)
- `idx_posts_moderated_by` ON posts(moderated_by)
- `idx_post_comments_moderated_by` ON post_comments(moderated_by)

**Düşük Öncelikli:**
- `idx_admin_impersonation_logs_conversation` ON admin_impersonation_logs(conversation_id)
- `idx_admin_impersonation_logs_message` ON admin_impersonation_logs(message_id)
- `idx_ai_action_logs_reverted_by` ON ai_action_logs(reverted_by)
- `idx_ai_settings_updated_by` ON ai_settings(updated_by)
- `idx_algorithm_configs_created_by` ON algorithm_configs(created_by)
- `idx_anomaly_alerts_acknowledged_by` ON anomaly_alerts(acknowledged_by)
- `idx_auto_payout_settings_payment_method` ON auto_payout_settings(payment_method_id)
- `idx_ops_message_reactions_admin` ON ops_message_reactions(admin_id)
- `idx_ops_message_read_receipts_admin` ON ops_message_read_receipts(admin_id)
- `idx_ops_typing_status_admin` ON ops_typing_status(admin_id)
- `idx_payout_requests_reviewed_by` ON payout_requests(reviewed_by)
- `idx_user_reports_reviewed_by` ON user_reports(reviewed_by)

---

### 4. `fix_rls_initplan_profiles`
**Tarih:** 2025-12-03 19:34:12

Optimize edilen policy'ler (auth.uid() → (SELECT auth.uid())):

**profiles tablosu:**
- `users_view_own_profiles`
- `users_update_own_profiles`
- `users_insert_own_profiles`
- `shadow_isolation` (JWT claims mantığı korundu)
- `admins_view_all_profiles`
- `admins_insert_profiles`
- `Users can view own real profile`
- `Users can update own real profile`
- `Users can update own shadow profile`
- `Only authenticated users can create profiles`
- `Only admins can delete profiles`

**admin_profiles tablosu:**
- `Admins can update own profile`
- `Admins can create own profile`
- `Admins can view own profile`

---

### 5. `fix_rls_initplan_other_tables`
**Tarih:** 2025-12-03 19:34:33

Optimize edilen tablolar:
- `blocked_users` (3 policy)
- `notifications` (5 policy)
- `device_tokens` (4 policy)
- `notification_preferences` (3 policy)
- `sessions` (4 policy)
- `audit_logs` (2 policy)

---

### 6. `fix_rls_initplan_ai_broadcast_creator`
**Tarih:** 2025-12-03 19:35:02

Optimize edilen tablolar:
- `ai_action_logs` (3 policy)
- `ai_settings` (3 policy)
- `ai_chat_threads` (4 policy)
- `ai_chat_logs` (2 policy)
- `broadcast_channel_members` (3 policy)
- `creator_balances` (2 policy)
- `creator_transactions` (2 policy)
- `conversation_participants` (4 policy)

---

### 7. `enable_rls_admin_tables`
**Tarih:** 2025-12-03 19:35:24

RLS aktif edilen admin tabloları:

| Tablo                           | Policy'ler                                                           |
| ------------------------------- | -------------------------------------------------------------------- |
| `ops_conversations`             | admin_select, admin_insert, admin_update, admin_delete, service_role |
| `ops_conversation_participants` | admin, service_role                                                  |
| `algorithm_configs`             | admin_all, service_role                                              |
| `moderation_queue`              | admin_all, service_role                                              |
| `feed_analytics`                | admin_select, service_role                                           |

---

### 8. `enable_rls_user_tables_v2`
**Tarih:** 2025-12-03 19:36:26

RLS aktif edilen user tabloları:

| Tablo              | Policy'ler                                     |
| ------------------ | ---------------------------------------------- |
| `user_intents`     | own, service_role                              |
| `post_shares`      | select, insert, delete, service_role           |
| `post_mentions`    | select, insert, service_role                   |
| `poll_options`     | select, manage, service_role                   |
| `poll_votes`       | own, owner_view, service_role                  |
| `user_vibes`       | select, own, service_role                      |
| `user_interests`   | select, own, service_role                      |
| `user_connections` | own, service_role                              |
| `crystal_gifts`    | select, insert, service_role                   |
| `micro_groups`     | creator, member_view, service_role             |
| `group_members`    | view, creator_manage, self_leave, service_role |
| `feed_items`       | own, service_role                              |

---

## 📋 Profiles Tablosu Yapısı

### Mevcut Yapı (Korundu)

```
profiles
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── type ('real' | 'shadow')     ← Dual profile sistemi
├── role ('user' | 'creator' | 'admin')
├── is_creator (boolean)         ← Onaylı creator mı?
├── shadow_pin_hash (text)       ← Shadow mode PIN
├── shadow_unlocked (boolean)
├── shadow_profile_active (boolean)
└── ... diğer alanlar
```

### Mantık:
- `type = 'real'` + `role = 'user'` → Normal kullanıcı
- `type = 'real'` + `role = 'creator'` + `is_creator = true` → Onaylı Creator
- `type = 'real'` + `role = 'admin'` → Admin (admin_profiles ile kontrol)
- `type = 'shadow'` → Shadow profil (gizli mod)

### Shadow Isolation Policy (Korundu):
```sql
CREATE POLICY "shadow_isolation" ON public.profiles
  FOR SELECT USING (
    (type = 'shadow' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = true)
    OR
    (type = 'real' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = false)
  );
```

---

## ⚠️ Kalan Sorunlar

### Security (Düşük Öncelik)

| Sorun                                       | Seviye | Aksiyon                            |
| ------------------------------------------- | ------ | ---------------------------------- |
| `polls` - RLS enabled no policy             | INFO   | Policy ekle veya RLS kapat         |
| `voice_moments` - RLS enabled no policy     | INFO   | Policy ekle veya RLS kapat         |
| `current_coin_rate` - Security Definer View | ERROR  | SECURITY INVOKER yap               |
| Function search_path mutable                | WARN   | 30+ function için search_path ekle |
| Leaked Password Protection                  | WARN   | Dashboard'dan aktif et             |

---

## 🧪 Test Checklist

Her migration sonrası test edilmeli:

### Mobile App
- [x] Login/Logout
- [x] Profile görüntüleme/düzenleme
- [x] Post oluşturma/görüntüleme/beğenme
- [x] Yorum yapma
- [x] Mesajlaşma (DM)
- [x] Broadcast kanalları
- [x] Story görüntüleme
- [x] Bildirimler
- [x] Abone olma
- [x] Shadow mode geçişi

### Admin Panel (Web-Ops)
- [x] Login
- [x] User listesi
- [x] Moderasyon kuyruğu
- [x] KYC başvuruları
- [x] Analytics dashboard
- [x] Admin chat

---

## 📝 Notlar

1. **Profiles tablosu korundu:** Mevcut dual profile (real/shadow) sistemi bozulmadı
2. **Shadow isolation korundu:** JWT claims ile shadow mode kontrolü çalışıyor
3. **Admin kontrolü korundu:** admin_profiles tablosu ile admin yetkilendirmesi
4. **Service role erişimi:** Tüm tablolara service_role erişimi eklendi (Edge Functions için)
5. **Performans iyileştirildi:** auth.uid() → (SELECT auth.uid()) dönüşümü yapıldı
