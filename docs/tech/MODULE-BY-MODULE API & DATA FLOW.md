#️⃣ 1) SHADOW PROFILE (Dual Identity System)

Amaç: Bir kullanıcının tek hesapta 2 kişiliği olsun → real + shadow.

🧱 Tablolar

profiles

users

embeddings_profiles

audit_logs

🔐 Flow — Shadow Açılış (PIN / FaceID)
Mobile App 
   → PIN gir → SecureStore’daki hash karşılaştırılır
   → Supabase Auth JWT içine "shadow_mode = true" claim set edilir
   → profiles tablosunda type='shadow' satırları görünür


Kritik:
Shadow moduna geçiş = Supabase JWT custom claim update → RLS bunun üzerinden çalışır.

🔐 Flow — Feed Ayrımı (Real vs Shadow)
Feed Request →
   JWT (shadow_mode: true/false) →
      RLS Policy:
        IF shadow_mode = false → type='real' profil verileri
        IF shadow_mode = true → type='shadow' verileri

Kullanılan Supabase Yetkinlikleri:

RLS Policies

JWT Custom Claims

Realtime

Row-level data segregation

#️⃣ 2) ANTI-SCREENSHOT & ANTI-RECORDING SHIELD
🧱 Tablo

anti_screenshot_logs

📱 Flow — Mobil Uygulama Tarafı

iOS → UISecureScreen

Android → FLAG_SECURE

Ayrıca custom listener (JS) → screenshot/capture yakalanır.

🔥 Flow — Loglama
App → /api/anti-ss-event →
   Edge Function: log_screenshot()
      INSERT INTO anti_screenshot_logs
      Trigger → Realtime push → Creator panel

Kullanılan Supabase Yetkinlikleri:

Storage (blurred fallback images)

Realtime publish

Edge Function insert

Policies for creator-only visibility

#️⃣ 3) CREATOR MONETIZATION (8 gelir kanalı)
🧱 Tablolar

creator_content

creator_revenue

coin_transactions

ppv_purchases

creator_subscriptions

creator_payouts

💰 Flow — Abonelik
App → Stripe/Iyzico/StoreKit purchase →
   → webhook → supabase-edge: subscription_success()
         INSERT creator_subscriptions
         INSERT creator_revenue (source='subscription')

🎁 Flow — Jeton İle Hediye
buyer_profile_id - coin_transactions (spent)
creator_profile_id - creator_revenue (coins)

💲 Flow — PPV Purchase
App → purchase
   → Edge Function: validate balance
   → if OK: INSERT ppv_purchases
   → INSERT creator_revenue (source='ppv')
   → UPDATE coin_transactions
   → return signed URL

Kullanılan Supabase Yetkinlikleri:

Signed URL

RLS (sadece satın alan görebilir)

Edge Functions + Webhooks

DB Triggers → Creator’a gelir yazma

#️⃣ 4) CREATOR CONTENT THEMES (12 Temalı Sistem)
🧱 Tablo

content_themes

creator_content

📈 Flow — AI Önerisi
User behavior → ai_behavior_logs
   → update embedding
      → pgvector similarity search
         → önerilen theme

Kullanılan Servisler:

pgvector

Postgres functions

JSONB metadata

#️⃣ 5) VIBE MATCH ENGINE

Erkek kullanıcı için öneri motorunun kalbi.

🧱 Tablolar

vibes

profile_vibes

embeddings_profiles

ai_behavior_logs

🔮 Flow — Öneri Hesaplama

Creator vibe seçer → profile_vibes

Sistem vibe + görünüş + davranış embedding vector üretir → embeddings_profiles

Erkek davranışları → ai_behavior_logs → kendi embedding’ine dönüşür

pgvector similarity search:

SELECT *
FROM embeddings_profiles
ORDER BY embedding_vector <-> $user_vector
LIMIT 30


Feed builder → discovery_feed tablosuna log yazar.

Kullanılan Supabase Yetkinlikleri:

pgvector

SQL stored functions

Triggers (embedding update)

Realtime (suggested content update)

#️⃣ 6) AI FANTASY GENERATOR (Hikâye + Görsel + Mini Video)
🧱 Tablolar

ai_fantasy_requests

ai_fantasy_outputs

🤖 Flow — AI Request
App → request_fantasy() →
   INSERT ai_fantasy_requests (pending)
   Edge Function:
      - AI text generation (OpenAI)
      - AI image (SD/OpenAI Image)
      - mini video (Pika/Runway)
   UPDATE ai_fantasy_outputs
   Mark request = done

Kullanılan Yetkinlikler:

Edge Functions

Storage (ai-content/)

Supabase Functions (callback handler)

Cron job for cleanup

#️⃣ 7) ASMR / AUDIO MARKET
🧱 Tablolar

asmr_audio

asmr_purchases

🔊 Flow — ASMR Upload
App → Upload → Supabase Storage (asmr/)
      INSERT asmr_audio

playback:

Eğer satın alınmışsa → signed URL

Satın alınmamışsa → 5 saniyelik preview stream

#️⃣ 8) AVATAR MODE (AI Digital Persona)
🧱 Tablolar

creator_content (type='ai')

ai_fantasy_outputs

🧬 Flow

Creator fotoğraf/video yükler

Edge Function → face-anonymization

AI persona üretir → AI server

İçerik storage’a kaydedilir (ai-content/)

creator_content içinde AI işaretli satır oluşur

#️⃣ 9) NO-TRACE MESSAGING
🧱 Tablo

messages

🔥 Flow — Mesaj Gönderimi
App → send message
   → INSERT messages
   → Realtime → receiver
   → expire_at = now + 24h

🕑 Flow — Silme

Supabase cron job → run hourly:

DELETE FROM messages WHERE expires_at < NOW()

#️⃣ 10) SOCIAL FIREWALL
🧱 Tablolar

social_firewall_rules

profiles

🔥 Flow — Rehber Tarama
App → rehber listesi hash gönderir
Edge Function → match checker
INSERT social_firewall_rules (contact_match)

Feed RLS:
WHERE profile_id NOT IN (
   SELECT blocked_profile_id
   FROM social_firewall_rules
   WHERE user_profile_id = $me
)

#️⃣ 11) AI CONSENT CONTROL (DMCA BOT)
🧱 Tablolar

dmca_reports

dmca_actions

⚙️ Flow — DMCA Engine

Edge Cron → her 30 dakikada bir

İçerikler reverse search yapılır

Eşleşme bulunursa:

INSERT dmca_reports
Edge Function → takedown gönder
INSERT dmca_actions


Creator paneli → realtime olarak rapor görür.

#️⃣ 12) DUAL FEED SYSTEM (Real Feed + Shadow Feed)
🧱 Tablolar

creator_content

discovery_feed

profiles

embeddings_profiles

social_firewall_rules

💡 Flow
Real feed:

Haber akışı + creator keşif + spor içerikleri + genel medya

Shadow feed:

Fantazi temelli içerikler

AI önerileri

Gizli creator içerikleri

Shadow profile bazlı embedding

Her feed:

SELECT *
FROM creator_content
WHERE visibility = 'public'
AND profile_id NOT IN firewall rules
AND profile_type = (shadow or real claims)

#️⃣ 13) HABER & İLGİ ALANI FEED’İ
Supabase → sadece metadata tutar

Haberler → External API (sports/crypto/tech).
Feed DB’de loglanır.

#️⃣ 14) CREATOR PLANLAMA PANELİ
🧱 Tablo

creator_schedule

id
creator_profile_id
content_id
scheduled_date
status (scheduled, posted)

🔄 Flow

Edge Cron job:

IF scheduled_date <= now()
   → publish content
   → update creator_content (posted)

#️⃣ 15) GİZLİ UYGULAMA İKONU

Database gerektirmez.
Local setting + SecureStore.