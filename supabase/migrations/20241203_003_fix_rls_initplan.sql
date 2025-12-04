-- ============================================
-- RLS INITPLAN FIX
-- Tarih: 2024-12-03
-- Açıklama: auth.uid() -> (SELECT auth.uid()) dönüşümü
-- Risk: Düşük - Sadece performans iyileştirmesi
-- NOT: Mevcut policy mantığı korunuyor, sadece auth.uid() optimize ediliyor
-- ============================================

-- ============================================
-- PROFILES TABLOSU
-- Mevcut yapı:
--   type: 'real' | 'shadow' (dual profile sistemi)
--   role: 'user' | 'creator' | 'admin'
--   is_creator: boolean (onaylı creator mı)
-- ============================================

-- users_view_own_profiles - Kullanıcı kendi profilini görebilir
DROP POLICY IF EXISTS "users_view_own_profiles" ON public.profiles;
CREATE POLICY "users_view_own_profiles" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- users_update_own_profiles - Kullanıcı kendi profilini güncelleyebilir
DROP POLICY IF EXISTS "users_update_own_profiles" ON public.profiles;
CREATE POLICY "users_update_own_profiles" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- users_insert_own_profiles - Kullanıcı kendi profilini oluşturabilir
DROP POLICY IF EXISTS "users_insert_own_profiles" ON public.profiles;
CREATE POLICY "users_insert_own_profiles" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- shadow_isolation - Shadow profil izolasyonu (JWT claims kullanıyor - MEVCUT MANTIK KORUNUYOR)
DROP POLICY IF EXISTS "shadow_isolation" ON public.profiles;
CREATE POLICY "shadow_isolation" ON public.profiles
  FOR SELECT USING (
    (type = 'shadow' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = true)
    OR
    (type = 'real' AND COALESCE((current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode')::boolean, false) = false)
  );

-- admins_view_all_profiles - Admin tüm profilleri görebilir
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- admins_insert_profiles - Admin profil oluşturabilir
DROP POLICY IF EXISTS "admins_insert_profiles" ON public.profiles;
CREATE POLICY "admins_insert_profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- Anyone can view real profiles basic info - Herkes real profilleri görebilir
DROP POLICY IF EXISTS "Anyone can view real profiles basic info" ON public.profiles;
CREATE POLICY "Anyone can view real profiles basic info" ON public.profiles
  FOR SELECT USING (type = 'real');

-- Anyone can view shadow profiles - Herkes shadow profilleri görebilir (kendi shadow'u için)
DROP POLICY IF EXISTS "Anyone can view shadow profiles" ON public.profiles;
CREATE POLICY "Anyone can view shadow profiles" ON public.profiles
  FOR SELECT USING (type = 'shadow');

-- Users can view own real profile
DROP POLICY IF EXISTS "Users can view own real profile" ON public.profiles;

CREATE POLICY "Users can view own real profile" ON public.profiles FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
        AND type = 'real'
    );

DROP POLICY IF EXISTS "Users can update own real profile" ON public.profiles;

CREATE POLICY "Users can update own real profile" ON public.profiles FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
    AND type = 'real'
);

DROP POLICY IF EXISTS "Users can update own shadow profile" ON public.profiles;

CREATE POLICY "Users can update own shadow profile" ON public.profiles FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
    AND type = 'shadow'
);

DROP POLICY IF EXISTS "Only authenticated users can create profiles" ON public.profiles;

CREATE POLICY "Only authenticated users can create profiles" ON public.profiles FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) IS NOT NULL
    );

DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Only admins can delete profiles" ON public.profiles FOR DELETE USING (
    EXISTS (
        SELECT
            1
        FROM
            public.admin_profiles
        WHERE
            id = (
                SELECT
                    auth.uid ()
            )
            AND is_active = true
    )
);

-- ============================================
-- ADMIN_PROFILES TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Admins can update own profile" ON public.admin_profiles;

CREATE POLICY "Admins can update own profile" ON public.admin_profiles FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = id
);

DROP POLICY IF EXISTS "Admins can create own profile" ON public.admin_profiles;

CREATE POLICY "Admins can create own profile" ON public.admin_profiles FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = id
    );

DROP POLICY IF EXISTS "Admins can view own profile" ON public.admin_profiles;

CREATE POLICY "Admins can view own profile" ON public.admin_profiles FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = id
    );

-- ============================================
-- BLOCKED_USERS TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;

CREATE POLICY "Users can view their own blocks" ON public.blocked_users FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = blocker_id
    );

DROP POLICY IF EXISTS "Users can create their own blocks" ON public.blocked_users;

CREATE POLICY "Users can create their own blocks" ON public.blocked_users FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = blocker_id
    );

DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocked_users;

CREATE POLICY "Users can delete their own blocks" ON public.blocked_users FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = blocker_id
);

-- ============================================
-- NOTIFICATIONS TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = recipient_id
    );

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;

CREATE POLICY "Users can mark own notifications as read" ON public.notifications FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = recipient_id
);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = recipient_id
);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.role ()
        ) = 'service_role'
    );

DROP POLICY IF EXISTS "Admin can insert notifications" ON public.notifications;

CREATE POLICY "Admin can insert notifications" ON public.notifications FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

-- ============================================
-- DEVICE_TOKENS TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view own device tokens" ON public.device_tokens;

CREATE POLICY "Users can view own device tokens" ON public.device_tokens FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Users can insert own device tokens" ON public.device_tokens;

CREATE POLICY "Users can insert own device tokens" ON public.device_tokens FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Users can update own device tokens" ON public.device_tokens;

CREATE POLICY "Users can update own device tokens" ON public.device_tokens FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

DROP POLICY IF EXISTS "Users can delete own device tokens" ON public.device_tokens;

CREATE POLICY "Users can delete own device tokens" ON public.device_tokens FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

-- ============================================
-- NOTIFICATION_PREFERENCES TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

-- ============================================
-- SESSIONS TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions" ON public.sessions FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;

CREATE POLICY "Users can update own sessions" ON public.sessions FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;

CREATE POLICY "Admins can view all sessions" ON public.sessions FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can update all sessions" ON public.sessions;

CREATE POLICY "Admins can update all sessions" ON public.sessions FOR
UPDATE USING (
    EXISTS (
        SELECT
            1
        FROM
            public.admin_profiles
        WHERE
            id = (
                SELECT
                    auth.uid ()
            )
            AND is_active = true
    )
);

-- ============================================
-- AUDIT_LOGS TABLOSU
-- ============================================
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.profiles p
            WHERE
                p.user_id = (
                    SELECT
                        auth.uid ()
                )
                AND p.role = 'admin'
        )
    );

-- ============================================
-- AI TABLOLARI
-- ============================================
DROP POLICY IF EXISTS "Admins can view all ai_action_logs" ON public.ai_action_logs;

CREATE POLICY "Admins can view all ai_action_logs" ON public.ai_action_logs FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
        )
    );

DROP POLICY IF EXISTS "Admins can insert ai_action_logs" ON public.ai_action_logs;

CREATE POLICY "Admins can insert ai_action_logs" ON public.ai_action_logs FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
        )
    );

DROP POLICY IF EXISTS "Admins can update ai_action_logs" ON public.ai_action_logs;

CREATE POLICY "Admins can update ai_action_logs" ON public.ai_action_logs FOR
UPDATE USING (
    EXISTS (
        SELECT
            1
        FROM
            public.admin_profiles
        WHERE
            id = (
                SELECT
                    auth.uid ()
            )
    )
);

DROP POLICY IF EXISTS "Admins can read ai_settings" ON public.ai_settings;

CREATE POLICY "Admins can read ai_settings" ON public.ai_settings FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can insert ai_settings" ON public.ai_settings;

CREATE POLICY "Admins can insert ai_settings" ON public.ai_settings FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can update ai_settings" ON public.ai_settings;

CREATE POLICY "Admins can update ai_settings" ON public.ai_settings FOR
UPDATE USING (
    EXISTS (
        SELECT
            1
        FROM
            public.admin_profiles
        WHERE
            id = (
                SELECT
                    auth.uid ()
            )
            AND is_active = true
    )
);

-- ============================================
-- AI_CHAT TABLOLARI
-- ============================================
DROP POLICY IF EXISTS "Admins can view own threads" ON public.ai_chat_threads;

CREATE POLICY "Admins can view own threads" ON public.ai_chat_threads FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = admin_id
    );

DROP POLICY IF EXISTS "Admins can insert own threads" ON public.ai_chat_threads;

CREATE POLICY "Admins can insert own threads" ON public.ai_chat_threads FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = admin_id
    );

DROP POLICY IF EXISTS "Admins can update own threads" ON public.ai_chat_threads;

CREATE POLICY "Admins can update own threads" ON public.ai_chat_threads FOR
UPDATE USING (
    (
        SELECT
            auth.uid ()
    ) = admin_id
);

DROP POLICY IF EXISTS "Admins can delete own threads" ON public.ai_chat_threads;

CREATE POLICY "Admins can delete own threads" ON public.ai_chat_threads FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = admin_id
);

DROP POLICY IF EXISTS "Admins can read all ai_chat_logs" ON public.ai_chat_logs;

CREATE POLICY "Admins can read all ai_chat_logs" ON public.ai_chat_logs FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can insert own ai_chat_logs" ON public.ai_chat_logs;

CREATE POLICY "Admins can insert own ai_chat_logs" ON public.ai_chat_logs FOR INSERT
WITH
    CHECK (
        admin_id = (
            SELECT
                auth.uid ()
        )
        AND EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

-- ============================================
-- BROADCAST TABLOLARI
-- ============================================
DROP POLICY IF EXISTS "broadcast_members_insert_policy" ON public.broadcast_channel_members;

CREATE POLICY "broadcast_members_insert_policy" ON public.broadcast_channel_members FOR INSERT
WITH
    CHECK (
        user_id = (
            SELECT
                auth.uid ()
        )
    );

DROP POLICY IF EXISTS "broadcast_members_select_policy" ON public.broadcast_channel_members;

CREATE POLICY "broadcast_members_select_policy" ON public.broadcast_channel_members FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.broadcast_channels bc
            WHERE
                bc.id = broadcast_channel_members.channel_id
                AND bc.creator_id = (
                    SELECT
                        auth.uid ()
                )
        )
        OR user_id = (
            SELECT
                auth.uid ()
        )
    );

DROP POLICY IF EXISTS "admin_broadcast_channel_members_select_policy" ON public.broadcast_channel_members;

CREATE POLICY "admin_broadcast_channel_members_select_policy" ON public.broadcast_channel_members FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

-- ============================================
-- CREATOR TABLOLARI
-- ============================================
DROP POLICY IF EXISTS "Creators can view own balance" ON public.creator_balances;

CREATE POLICY "Creators can view own balance" ON public.creator_balances FOR
SELECT
    USING (
        creator_id = (
            SELECT
                auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Admins can view all balances" ON public.creator_balances;

CREATE POLICY "Admins can view all balances" ON public.creator_balances FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Creators can view own transactions" ON public.creator_transactions;

CREATE POLICY "Creators can view own transactions" ON public.creator_transactions FOR
SELECT
    USING (
        creator_id = (
            SELECT
                auth.uid ()
        )
    );

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.creator_transactions;

CREATE POLICY "Admins can view all transactions" ON public.creator_transactions FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );

-- ============================================
-- CONVERSATION TABLOLARI
-- ============================================
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;

CREATE POLICY "participants_select_policy" ON public.conversation_participants FOR
SELECT
    USING (
        user_id = (
            SELECT
                auth.uid ()
        )
        OR is_conversation_participant (conversation_id)
    );

DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;

CREATE POLICY "participants_update_policy" ON public.conversation_participants FOR
UPDATE USING (
    user_id = (
        SELECT
            auth.uid ()
    )
);

DROP POLICY IF EXISTS "participants_insert_policy" ON public.conversation_participants;

CREATE POLICY "participants_insert_policy" ON public.conversation_participants FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) IS NOT NULL
    );

DROP POLICY IF EXISTS "admin_conversation_participants_select_policy" ON public.conversation_participants;

CREATE POLICY "admin_conversation_participants_select_policy" ON public.conversation_participants FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.admin_profiles
            WHERE
                id = (
                    SELECT
                        auth.uid ()
                )
                AND is_active = true
        )
    );