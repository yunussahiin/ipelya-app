#️⃣ İPELYA — SUPABASE RLS / SECURITY POLICY BLUEPRINT (2025)

Her tablo için:

Kimin okuyabileceği?

Kimin yazabileceği?

Shadow profile izolasyonu

PPV / abonelik kontrolleri

Anti-spam / anti-fraud guardları

hepsi ayrı ayrı tasarlanmıştır.

🔐 RLS Temel Mantığı

Supabase RLS tüm satırları varsayılan olarak engeller.
Biz yalnızca izin verilen durumlar için “ALLOW” ekleriz.

Temel değişkenler:

auth.uid() → user_id

current_setting('request.jwt.claims', true) → JWT claim’lerden shadow mode bilgisi

jwt_scope = claims->>'shadow_mode'

JWT Claim örneği:

{
  "sub": "{user_id}",
  "shadow_mode": "true"
}

🧱 1) RLS – profiles Tablosu

Tek kullanıcı = 2 satır: real + shadow

Politika 1 — Profil sahibi kendi profillerini görebilir
policy "owner can view own profile"
  for select
  using (user_id = auth.uid());

Politika 2 — Profil sahibi kendi profilini güncelleyebilir
policy "owner can update own profile"
  for update
  using (user_id = auth.uid());

Politika 3 — Shadow Profile izolasyonu

Real mod → shadow profili göremez.
Shadow mod → real profili göremez.

policy "shadow isolation"
  for select
  using (
    (type = 'shadow' AND current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode' = 'true')
    OR
    (type = 'real' AND current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode' = 'false')
  );

🧱 2) RLS – creator_content Tablosu

Burada kritik 3 konu var:

İçerik sahibi görür

PPV satın alan görür

Abonesi olan görür

Shadow/real feed ayrımı

Politika 1 — Creator kendi içeriklerini görebilir
policy "creator can view own content"
 for select
 using (creator_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

Politika 2 — Public içerik herkes tarafından görülebilir
policy "public content visible"
 for select
 using (visibility = 'public');

Politika 3 — Subscriber-only içerik
policy "subscriber-only"
 for select
 using (
   visibility = 'subscribers' AND
   EXISTS (
     SELECT 1 FROM creator_subscriptions
     WHERE creator_profile_id = creator_content.creator_profile_id
       AND user_profile_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
   )
);

Politika 4 — PPV içerik
policy "ppv purchased content"
 for select
 using (
   is_ppv = true AND
   EXISTS (
     SELECT 1 FROM ppv_purchases
     WHERE content_id = creator_content.id
       AND buyer_profile_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
   )
);

Politika 5 — Shadow feed ayrımı

Shadow mod'dayken public ama shadow-only işaretli içerikler gelir.

policy "shadow feed filter"
 for select
 using (
   CASE
     WHEN current_setting('request.jwt.claims', true)::jsonb->>'shadow_mode' = 'true'
        THEN is_shadow_allowed = true
     ELSE true
   END
);

Politika 6 — Creator kendi içeriğini güncelleyebilir
policy "creator update"
 for update
 using (
   creator_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
);

🧱 3) RLS – messages (No-Trace Messaging)

Mesajlar:

Sadece gönderen ve alan okuyabilir

Admin bile göremez

24s sonra silinir

Politika 1 — Sender reading
policy "sender read"
 for select
 using (sender_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

Politika 2 — Receiver reading
policy "receiver read"
 for select
 using (receiver_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

Politika 3 — Insert (mesaj gönderme)
policy "send message"
 for insert
 with check (
   sender_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
 );

Politika 4 — Kimse güncelleyemez

(Silme Cron tarafından yapılır.)

policy "no update"
 for update
 using (false);

🧱 4) RLS – coin_transactions
Jeton satın alma = herkes kendi işlem geçmişini görebilir
policy "view own transactions"
 for select
 using (user_profile_id IN (
   SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

Sadece kendisi harcayabilir
policy "spend own coins"
 for insert
 with check (
   user_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
);

🧱 5) RLS – ppv_purchases
Sadece satın alan görebilir
policy "owner read"
 for select
 using (buyer_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

🧱 6) RLS – creator_revenue / payouts
Creator kendi gelirini görebilir
policy "creator view own revenue"
 for select
 using (
    creator_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);


Admin için gerekirse ayrı role tanımlanır.

🧱 7) RLS – asmr_audio & asmr_purchases
ASMR içerik satın alan veya içeriğin sahibi okuyabilir
policy "asmr access"
 for select
 using (
   creator_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
   OR
   EXISTS (
     SELECT 1 FROM asmr_purchases
     WHERE asmr_purchases.asmr_id = asmr_audio.id
       AND buyer_profile_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
   )
);

🧱 8) RLS – ai_fantasy_requests & outputs
Kullanıcı sadece kendi AI isteklerini görebilir
policy "ai request owner"
 for select
 using (user_profile_id IN (
   SELECT id FROM profiles WHERE user_id = auth.uid()
 ));

🧱 9) RLS – dmca_reports

Creator sadece kendi içerik ihlallerini görebilir.

policy "dmca creator view"
 for select
 using (
   creator_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
);


Admin → ayrı role.

🧱 10) RLS – social_firewall_rules

Kullanıcı sadece kendi firewall kurallarını görebilir.

policy "owner firewall"
 for select
 using (
   user_profile_id IN (
     SELECT id FROM profiles WHERE user_id = auth.uid()
   )
);

🧱 11) RLS – live_sessions & live_payments

Viewer sadece katıldığı oturuma dair ödeme kayıtlarını görebilir.

Creator → kendi canlı yayınlarını görebilir.

🛡️ GLOBAL RLS PRESETS (Önerilen)

Supabase üzerinde:

1) public hiç bir tabloya erişemez
2) anon role sadece login/signup olabilir
3) authenticated role tüm RLS kontrollerine tabidir
4) admin role için özel bypass policy

Admin için:

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;


Bu role sadece backend erişir.