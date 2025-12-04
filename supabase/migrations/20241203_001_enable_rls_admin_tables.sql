-- ============================================
-- ADMIN TABLOLARI - RLS AKTİF ET
-- Tarih: 2024-12-03
-- Açıklama: Admin-only tablolar için RLS aktif et ve policy ekle
-- Risk: Düşük - Sadece admin tabloları
-- ============================================
-- ops_conversations
ALTER TABLE public.ops_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_conversations_admin_select" ON public.ops_conversations FOR
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

CREATE POLICY "ops_conversations_admin_insert" ON public.ops_conversations FOR INSERT
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

CREATE POLICY "ops_conversations_admin_update" ON public.ops_conversations FOR
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

CREATE POLICY "ops_conversations_admin_delete" ON public.ops_conversations FOR DELETE USING (
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

-- ops_conversation_participants (zaten policy var, sadece RLS aktif et)
ALTER TABLE public.ops_conversation_participants ENABLE ROW LEVEL SECURITY;

-- algorithm_configs
ALTER TABLE public.algorithm_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "algorithm_configs_admin_all" ON public.algorithm_configs FOR ALL USING (
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

CREATE POLICY "algorithm_configs_service_role" ON public.algorithm_configs FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- moderation_queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_queue_admin_all" ON public.moderation_queue FOR ALL USING (
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

CREATE POLICY "moderation_queue_service_role" ON public.moderation_queue FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- feed_analytics
ALTER TABLE public.feed_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_analytics_admin_select" ON public.feed_analytics FOR
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

CREATE POLICY "feed_analytics_service_role" ON public.feed_analytics FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);