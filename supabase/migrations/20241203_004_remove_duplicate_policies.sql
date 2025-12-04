-- ============================================
-- DUPLICATE POLICY TEMİZLİĞİ
-- Tarih: 2024-12-03
-- Açıklama: Aynı işlevi gören duplicate policy'leri sil
-- Risk: Düşük - Sadece gereksiz policy'ler siliniyor
-- ============================================
-- ============================================
-- DEVICE_TOKENS - Duplicate policy'ler
-- "Users can view own tokens" vs "Users can view own device tokens"
-- İkisi de aynı işlevi görüyor, birini sil
-- ============================================
DROP POLICY IF EXISTS "Users can view own tokens" ON public.device_tokens;

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.device_tokens;

DROP POLICY IF EXISTS "Users can update own tokens" ON public.device_tokens;

DROP POLICY IF EXISTS "Users can delete own tokens" ON public.device_tokens;

-- ============================================
-- NOTIFICATION_PREFERENCES - Duplicate policy'ler
-- ============================================
DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;

-- ============================================
-- AI_MODEL_CONFIG - Duplicate policy'ler
-- "Admin can manage ai_model_config" ve "Admin can read ai_model_config"
-- ALL zaten SELECT'i kapsıyor
-- ============================================
DROP POLICY IF EXISTS "Admin can read ai_model_config" ON public.ai_model_config;

-- ============================================
-- USER_LOCKOUTS - Duplicate policy'ler
-- "Admin can manage lockouts" ve "Admin can read lockouts"
-- ============================================
DROP POLICY IF EXISTS "Admin can read lockouts" ON public.user_lockouts;