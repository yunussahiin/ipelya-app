-- ============================================
-- USER TABLOLARI - RLS AKTİF ET
-- Tarih: 2024-12-03
-- Açıklama: User tablolar için RLS aktif et ve policy ekle
-- Risk: Orta - Kullanıcı erişimini etkiler
-- ============================================
-- user_intents
ALTER TABLE public.user_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_intents_own" ON public.user_intents FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "user_intents_service_role" ON public.user_intents FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- post_shares
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_shares_select" ON public.post_shares FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = sharer_id
        OR (
            SELECT
                auth.uid ()
        ) = recipient_id
    );

CREATE POLICY "post_shares_insert" ON public.post_shares FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = sharer_id
    );

CREATE POLICY "post_shares_delete" ON public.post_shares FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = sharer_id
);

CREATE POLICY "post_shares_service_role" ON public.post_shares FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- post_mentions
ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_mentions_select" ON public.post_mentions FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = mentioned_user_id
        OR (
            SELECT
                auth.uid ()
        ) = mentioner_user_id
    );

CREATE POLICY "post_mentions_insert" ON public.post_mentions FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = mentioner_user_id
    );

CREATE POLICY "post_mentions_service_role" ON public.post_mentions FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- poll_options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_options_select" ON public.poll_options FOR
SELECT
    USING (true);

CREATE POLICY "poll_options_manage" ON public.poll_options FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            public.polls
        WHERE
            polls.id = poll_options.poll_id
            AND polls.user_id = (
                SELECT
                    auth.uid ()
            )
    )
);

CREATE POLICY "poll_options_service_role" ON public.poll_options FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes_own" ON public.poll_votes FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "poll_votes_owner_view" ON public.poll_votes FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.polls
            WHERE
                polls.id = poll_votes.poll_id
                AND polls.user_id = (
                    SELECT
                        auth.uid ()
                )
        )
    );

CREATE POLICY "poll_votes_service_role" ON public.poll_votes FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- user_vibes
ALTER TABLE public.user_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_vibes_select" ON public.user_vibes FOR
SELECT
    USING (true);

CREATE POLICY "user_vibes_own" ON public.user_vibes FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "user_vibes_service_role" ON public.user_vibes FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- user_interests
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_interests_select" ON public.user_interests FOR
SELECT
    USING (true);

CREATE POLICY "user_interests_own" ON public.user_interests FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "user_interests_service_role" ON public.user_interests FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_connections_own" ON public.user_connections FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "user_connections_service_role" ON public.user_connections FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- crystal_gifts
ALTER TABLE public.crystal_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crystal_gifts_select" ON public.crystal_gifts FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = sender_id
        OR (
            SELECT
                auth.uid ()
        ) = recipient_id
    );

CREATE POLICY "crystal_gifts_insert" ON public.crystal_gifts FOR INSERT
WITH
    CHECK (
        (
            SELECT
                auth.uid ()
        ) = sender_id
    );

CREATE POLICY "crystal_gifts_service_role" ON public.crystal_gifts FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- micro_groups
ALTER TABLE public.micro_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "micro_groups_owner" ON public.micro_groups FOR ALL USING (
    (
        SELECT
            auth.uid ()
    ) = owner_id
);

CREATE POLICY "micro_groups_member_view" ON public.micro_groups FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.group_members
            WHERE
                group_members.group_id = micro_groups.id
                AND group_members.user_id = (
                    SELECT
                        auth.uid ()
                )
        )
    );

CREATE POLICY "micro_groups_service_role" ON public.micro_groups FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_view" ON public.group_members FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public.group_members gm
            WHERE
                gm.group_id = group_members.group_id
                AND gm.user_id = (
                    SELECT
                        auth.uid ()
                )
        )
    );

CREATE POLICY "group_members_owner_manage" ON public.group_members FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            public.micro_groups
        WHERE
            micro_groups.id = group_members.group_id
            AND micro_groups.owner_id = (
                SELECT
                    auth.uid ()
            )
    )
);

CREATE POLICY "group_members_self_leave" ON public.group_members FOR DELETE USING (
    (
        SELECT
            auth.uid ()
    ) = user_id
);

CREATE POLICY "group_members_service_role" ON public.group_members FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);

-- feed_items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_items_own" ON public.feed_items FOR
SELECT
    USING (
        (
            SELECT
                auth.uid ()
        ) = user_id
    );

CREATE POLICY "feed_items_service_role" ON public.feed_items FOR ALL USING (
    (
        SELECT
            auth.role ()
    ) = 'service_role'
);