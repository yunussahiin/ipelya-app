-- ============================================
-- DUPLICATE INDEX TEMİZLİĞİ
-- Tarih: 2024-12-03
-- Açıklama: Aynı column'lar için duplicate index'leri sil
-- Risk: Düşük - Gereksiz disk kullanımı azalır
-- ============================================
-- device_tokens: device_tokens_user_id_idx ve idx_device_tokens_user_id
-- idx_ prefix'li olanı sil, standart naming convention'ı koru
DROP INDEX IF EXISTS idx_device_tokens_user_id;

-- notification_campaigns: idx_notification_campaigns_status ve notification_campaigns_status_idx
DROP INDEX IF EXISTS notification_campaigns_status_idx;

-- notification_logs: idx_notification_logs_campaign_id ve notification_logs_campaign_id_idx
DROP INDEX IF EXISTS notification_logs_campaign_id_idx;

-- notification_logs: idx_notification_logs_recipient_id ve notification_logs_recipient_id_idx
DROP INDEX IF EXISTS notification_logs_recipient_id_idx;

-- notification_preferences: idx_notification_preferences_user_id ve notification_preferences_user_id_idx
DROP INDEX IF EXISTS notification_preferences_user_id_idx;

-- post_media: idx_post_media_post_id ve post_media_post_id_idx
DROP INDEX IF EXISTS post_media_post_id_idx;

-- NOT: ops_messages için idx_ops_messages_conversation ve idx_ops_messages_conversation_created
-- Bu ikisi farklı olabilir (biri sadece conversation_id, diğeri conversation_id + created_at)
-- Kontrol edip gerekirse ayrı migration'da sil