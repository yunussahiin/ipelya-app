-- ============================================
-- EKSİK INDEX'LER
-- Tarih: 2024-12-03
-- Açıklama: Unindexed FK'lar için index ekle
-- Risk: Düşük - Performans iyileştirmesi
-- ============================================
-- ============================================
-- YÜKSEK ÖNCELİKLİ (Sık kullanılan tablolar)
-- ============================================
-- messages tablosu
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile ON public.messages (sender_profile_id);

CREATE INDEX IF NOT EXISTS idx_messages_forwarded_from ON public.messages (forwarded_from_id);

CREATE INDEX IF NOT EXISTS idx_messages_sent_by_admin ON public.messages (sent_by_admin_id);

-- notifications tablosu
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications (actor_id);

-- broadcast_messages tablosu
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sender ON public.broadcast_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_poll ON public.broadcast_messages (poll_id);

-- creator_subscriptions tablosu
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_tier ON public.creator_subscriptions (tier_id);

-- conversations tablosu
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations (created_by);

CREATE INDEX IF NOT EXISTS idx_conversations_theme_changed_by ON public.conversations (theme_changed_by);

-- ============================================
-- ORTA ÖNCELİKLİ
-- ============================================
-- broadcast_channel_members tablosu
CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_banned_by ON public.broadcast_channel_members (banned_by);

CREATE INDEX IF NOT EXISTS idx_broadcast_channel_members_muted_by ON public.broadcast_channel_members (muted_by);

-- broadcast_channels tablosu
CREATE INDEX IF NOT EXISTS idx_broadcast_channels_required_tier ON public.broadcast_channels (required_tier_id);

-- broadcast_poll_votes tablosu
CREATE INDEX IF NOT EXISTS idx_broadcast_poll_votes_user ON public.broadcast_poll_votes (user_id);

-- broadcast_polls tablosu
CREATE INDEX IF NOT EXISTS idx_broadcast_polls_message ON public.broadcast_polls (message_id);

-- creator_transactions tablosu
CREATE INDEX IF NOT EXISTS idx_creator_transactions_created_by ON public.creator_transactions (created_by);

-- kyc_applications tablosu
CREATE INDEX IF NOT EXISTS idx_kyc_applications_reviewed_by ON public.kyc_applications (reviewed_by);

-- moderation_queue tablosu
CREATE INDEX IF NOT EXISTS idx_moderation_queue_reviewed_by ON public.moderation_queue (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_user ON public.moderation_queue (user_id);

-- posts tablosu
CREATE INDEX IF NOT EXISTS idx_posts_moderated_by ON public.posts (moderated_by);

-- post_comments tablosu
CREATE INDEX IF NOT EXISTS idx_post_comments_moderated_by ON public.post_comments (moderated_by);

-- ============================================
-- DÜŞÜK ÖNCELİKLİ (Admin/System tabloları)
-- ============================================
-- admin_impersonation_logs tablosu
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_logs_conversation ON public.admin_impersonation_logs (conversation_id);

CREATE INDEX IF NOT EXISTS idx_admin_impersonation_logs_message ON public.admin_impersonation_logs (message_id);

-- ai_action_logs tablosu
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_reverted_by ON public.ai_action_logs (reverted_by);

-- ai_settings tablosu
CREATE INDEX IF NOT EXISTS idx_ai_settings_updated_by ON public.ai_settings (updated_by);

-- algorithm_configs tablosu
CREATE INDEX IF NOT EXISTS idx_algorithm_configs_created_by ON public.algorithm_configs (created_by);

-- anomaly_alerts tablosu
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_acknowledged_by ON public.anomaly_alerts (acknowledged_by);

-- auto_payout_settings tablosu
CREATE INDEX IF NOT EXISTS idx_auto_payout_settings_payment_method ON public.auto_payout_settings (payment_method_id);

-- ops_message_reactions tablosu
CREATE INDEX IF NOT EXISTS idx_ops_message_reactions_admin ON public.ops_message_reactions (admin_id);

-- ops_message_read_receipts tablosu
CREATE INDEX IF NOT EXISTS idx_ops_message_read_receipts_admin ON public.ops_message_read_receipts (admin_id);

-- ops_typing_status tablosu
CREATE INDEX IF NOT EXISTS idx_ops_typing_status_admin ON public.ops_typing_status (admin_id);

-- payout_requests tablosu
CREATE INDEX IF NOT EXISTS idx_payout_requests_processed_by ON public.payout_requests (processed_by);

-- report_actions tablosu
CREATE INDEX IF NOT EXISTS idx_report_actions_admin ON public.report_actions (admin_id);

-- user_reports tablosu
CREATE INDEX IF NOT EXISTS idx_user_reports_assigned_to ON public.user_reports (assigned_to);