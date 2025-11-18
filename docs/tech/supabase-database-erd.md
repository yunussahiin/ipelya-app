#️⃣ İpelya – Database ERD (2025)

Bu ERD Supabase için birebir uygulanabilir tasarımdır.

🧩 1) AUTH & USER BASE TABLES
### 1.1 users (Supabase Auth tarafı yönetir)
id (uuid) - PK
email (text)
phone (text)
created_at (timestamp)

### 1.2 profiles

Tek kullanıcı = 2 satır: real + shadow

id (uuid) - PK
user_id (uuid) - FK → users.id
type (enum: 'real', 'shadow')
username (text)
display_name (text)
avatar_url (text)
bio (text)
is_creator (bool)
shadow_pin_hash (text, nullable)
shadow_unlocked (bool)
gender (enum: male, female, lgbt)
created_at
updated_at

Özel Not:

Shadow profile için RLS tamamen farklı policy seti uygulanır.

🟪 2) CREATOR CONTENT & ECONOMY
### 2.1 creator_content

Creator’ın yüklediği tüm medya içerikleri (foto/video/AI).

id (uuid) - PK
creator_profile_id (uuid) - FK → profiles.id
type (enum: 'image', 'video', 'asmr', 'ai')
media_url (text)
thumbnail_url (text)
title (text)
description (text)
theme_id (uuid) - FK → content_themes.id
is_ppv (bool)
ppv_price (int)
visibility (enum: public, subscribers, ppv)
created_at

### 2.2 content_themes

(12 Temalı sistem)

id (uuid) - PK
name (text)
description (text)
cover_image (text)

### 2.3 creator_subscriptions

Creator abonelik sistemi.

id (uuid) - PK
creator_profile_id (uuid)
user_profile_id (uuid)
start_date
end_date
renewal_status (enum: active, canceled, failed)
price_per_month (int)
created_at

### 2.4 ppv_purchases

Tekil içerik satın alma.

id (uuid) - PK
buyer_profile_id (uuid)
content_id (uuid)
price (int)
created_at

### 2.5 coin_packages

Sabit paketler: 100, 300, 500, 1000, 5000

id (uuid)
coin_amount (int)
price_usd (numeric)
price_try (numeric)
is_active (bool)

### 2.6 coin_transactions

Kredi kartı → jeton aktarımı → creator’a jeton harcama.

id (uuid)
user_profile_id (uuid)
type (enum: purchase, spent, refund)
amount (int)
note (text)
created_at

### 2.7 creator_revenue

Creator’ın kazanç tablosu.

id (uuid)
creator_profile_id (uuid)
source (enum: subscription, ppv, message, live, coins)
amount (numeric)
transaction_id (uuid)
created_at

### 2.8 creator_payouts

Haftalık / aylık ödeme şeması.

id (uuid)
creator_profile_id (uuid)
amount (numeric)
payout_date
status (enum: pending, completed, failed)
created_at

🎧 3) ASMR & AUDIO MARKET
### 3.1 asmr_audio
id (uuid)
creator_profile_id (uuid)
audio_url (text)
duration_seconds (int)
category (enum: asmr, night, roleplay)
price (int)
created_at

### 3.2 asmr_purchases
id (uuid)
buyer_profile_id (uuid)
asmr_id (uuid)
price (int)
created_at

🎭 4) AI FANTASY ENGINE
### 4.1 ai_fantasy_requests

Kullanıcı AI’dan hikâye/görsel/video ister.

id (uuid)
user_profile_id (uuid)
prompt (text)
fantasy_type (enum: story, image, video)
status (enum: pending, generating, done, failed)
created_at

### 4.2 ai_fantasy_outputs

AI tarafından oluşturulmuş içerikler.

id (uuid)
request_id (uuid)
output_text (text)
output_image_url (text)
output_video_url (text)
embedding_vector (vector)  -- pgvector
created_at

### 4.3 ai_behavior_logs

Erkek kullanıcının davranış geçmişi (öneri motoru için).

id (uuid)
user_profile_id (uuid)
action (enum: view_creator, open_category, ai_request, vibe_pick, etc)
metadata (jsonb)
embedding_vector (vector)
created_at

💬 5) NO-TRACE MESSAGING
### 5.1 messages

(Supabase Realtime için optimize)

id (uuid)
sender_profile_id (uuid)
receiver_profile_id (uuid)
content (text)
media_url (text, nullable)
is_encrypted (bool)
expires_at (timestamp)
created_at


Cron job: 24 saat sonra otomatik silinir.

🔥 6) ANTI-SCREENSHOT / SECURITY
### 6.1 anti_screenshot_logs
id (uuid)
profile_id (uuid)
platform (enum: ios, android)
event_type (enum: screenshot, screenrecord)
created_at


Creator panel → bu logları Supabase Realtime ile canlı görür.

### 6.2 social_firewall_rules

Rehber, IP ve network bazlı engelleme.

id (uuid)
user_profile_id (uuid)
blocked_profile_id (uuid)      -- sakın gösterme
reason (enum: contact_match, ip_match, social_link, manual)
created_at

🛡️ 7) DMCA & CONTENT PROTECTION
### 7.1 dmca_reports
id (uuid)
creator_profile_id (uuid)
content_id (uuid)
detected_url (text)
status (enum: pending, removed, failed)
ai_similarity_score (numeric)
created_at

### 7.2 dmca_actions
id (uuid)
report_id (uuid)
action_type (enum: notify_site, takedown_request)
response (jsonb)
created_at

👥 8) MATCHING & DISCOVERY
### 8.1 vibes

(Vibe sistemi: masum, gizemli, vs.)

id (uuid)
name (text)
description (text)

### 8.2 profile_vibes

Creator vibe seçimi.

profile_id (uuid)
vibe_id (uuid)
intensity (int)

### 8.3 discovery_feed

Kullanıcıya gösterilen içeriklerin log’u.

id (uuid)
user_profile_id (uuid)
content_id (uuid)
score (numeric)
created_at

### 8.4 embeddings_profiles

Profil embedding vektörlerini tutar.

profile_id (uuid)
appearance_vector (vector)
vibe_vector (vector)
behavior_vector (vector)
last_updated

🎥 9) LIVEKIT / STREAMING
### 9.1 live_sessions
id (uuid)
creator_profile_id (uuid)
session_id (text)         -- LiveKit session
is_private (bool)
price_per_min (int)
started_at
ended_at

### 9.2 live_payments
id (uuid)
live_session_id (uuid)
viewer_profile_id (uuid)
coins_spent (int)
created_at

🎛️ 10) SYSTEM LOGS
### 10.1 audit_logs
id (uuid)
profile_id (uuid)
action (text)
metadata (jsonb)
created_at

🧷 11) APP SETTINGS
### 11.1 settings
key (text)
value (jsonb)
updated_at

🧩 12) SUPPORT & REPORTS
### 12.1 user_reports
id (uuid)
reporter_profile_id (uuid)
reported_profile_id (uuid)
reason (enum)
details (text)
status (enum: open, reviewed, resolved)
created_at

🧠 13) RELATIONSHIP ÖZETİ

(Bu ilişki haritası teknik ekip için kritik)

users → profiles = 1 → N

profiles → creator_content = 1 → N

profiles → messages (sender) = 1 → N

profiles → messages (receiver) = 1 → N

creator_content → ppv_purchases = 1 → N

asmr_audio → asmr_purchases = 1 → N

profiles → creator_revenue = 1 → N

ai_fantasy_requests → ai_fantasy_outputs = 1 → 1

profiles → social_firewall_rules = 1 → N

profiles → live_sessions = 1 → N

live_sessions → live_payments = 1 → N

profiles → anti_screenshot_logs = 1 → N

creator_content → dmca_reports = 1 → N

dmca_reports → dmca_actions = 1 → N

profiles → embeddings = 1 → 1 (veya 1 → N opsiyonel)

vibes → profile_vibes = 1 → N