#️⃣ İPELYA – FULL API SPEC (2025)

(Next.js + Expo + Supabase Edge Functions + Media + AI)
Tam üretim seviyesinde API dökümüdür.

🧩 API Mimarisi

İpelya'nın API yapısı 3 katmandan oluşur:

1) Client → directly Supabase (reads/writes with RLS)
2) Client → Supabase Edge Functions (security logic)
3) Server → External APIs (AI, Mux, LiveKit, Stripe...)


Kural:

Database read → Client → Supabase

Sensitive write / logic → Edge Function

Media/AI/Webhook → Edge Function

🏛️ KAPSAMLI API KATEGORİLERİ

Auth & Profiles

Shadow Profile

Feed & Discovery

Creator Content

PPV & Jeton & Economy

Subscriptions

ASMR Market

AI Fantasy Engine

Messaging

Screenshot/Recording Logs

Social Firewall

LiveKit / Live Streaming

DMCA Engine

Creator Panel (Schedule, Stats, Insights)

Tüm uç noktaları aşağıda kategorilere göre veriyorum.

———————————————————————
1) AUTH & PROFILES API
———————————————————————
POST /auth/signup

Edge Function: auth-signup

Request
{
  "email": "user@example.com",
  "phone": "+905..."
}

İşlem

Supabase Auth user oluşturur

2 profil yaratılır:

real

shadow (PIN sonrası aktif olur)

POST /auth/login

Supabase Auth email/OTP veya phone/OTP.

Response → JWT session.

GET /profiles/me

Direct Supabase query:

select * from profiles where user_id = auth.uid();

———————————————————————
2) SHADOW PROFILE API
———————————————————————
POST /shadow/enable

Edge Function: enable-shadow-mode

Request
{
  "pin": "1234"
}

İşlem

PIN hash doğrulama

JWT claim update (shadow_mode=true)

Response
{
  "shadow_mode": true
}

POST /shadow/disable

Edge Function: disable-shadow-mode

———————————————————————
3) FEED & DISCOVERY API
———————————————————————
GET /feed

Edge Function: get-feed

İşlem

Kullanıcının embedding’i hesaplanır

pgvector similarity search

Social firewall filtrelemesi

Shadow/real mod ayrımı

discovery_feed tablosuna log düşer

Response
{
  "results": [
    {
      "id": "uuid",
      "creator": { "username": "..." },
      "score": 0.87,
      "thumbnail": "url"
    }
  ]
}

———————————————————————
4) CREATOR CONTENT API
———————————————————————
POST /creator/upload

Kullanıcı → MUX → Webhook → Supabase.

Client süreci:

POST /creator/request-upload


Edge Function: creator-request-upload

Response
{
  "upload_url": "mux_url",
  "asset_id": "mux_asset_id"
}

POST /creator/content

Metadata kaydı:

Request:

{
  "type": "image",
  "media_url": "https://...",
  "thumbnail_url": "https://...",
  "theme_id": "uuid",
  "is_ppv": true,
  "ppv_price": 200
}

GET /creator/content/:id

Supabase RLS tarafından otomatik filtrelenir.

———————————————————————
5) JETON & ECONOMY API
———————————————————————
POST /coins/buy

Edge Function: buy-coins

Request
{
  "package_id": "500" 
}

Flow

Stripe/Iyzico checkout link üretir

coin_transactions içine pending kayıt açılır

Webhook: /payments/stripe

Edge Function: stripe-webhook
Type: server-only

İşlem

Eğer payment success →

coin_transactions update

bakiye artırılır

———————————————————————
6) PPV CONTENT API
———————————————————————
POST /ppv/buy

Edge Function: buy-ppv

Request
{
  "content_id": "uuid"
}

Flow

Coin balance check

coins → düş

ppv_purchases → insert

creator_revenue → insert

Generate signed URL

Response
{
  "play_url": "signed-url"
}

———————————————————————
7) SUBSCRIPTION API
———————————————————————
POST /subscription/start

Edge Function: start-subscription

Request
{
  "creator_id": "uuid",
  "price": 350
}


Web üzerinden veya mobilden Stripe ile başlatılır.

Webhook → sys:

creator_subscriptions insert

creator_revenue insert

———————————————————————
8) ASMR / AUDIO MARKET API
———————————————————————
POST /asmr/upload

Supabase Storage → asmr/

POST /asmr/buy

Edge Function: buy-asmr

Aynı PPV mantığı.

GET /asmr/list

Direct Supabase.

———————————————————————
9) AI FANTASY ENGINE API
———————————————————————
POST /ai/fantasy

Edge Function: fantasy-request

Request
{
  "type": "story|image|video",
  "prompt": "..."
}

Flow

ai_fantasy_requests insert

OpenAI → story/image

Pika/Runway → video (opsiyonel)

ai_fantasy_outputs insert

Response
{
  "request_id": "uuid"
}

GET /ai/fantasy/:id

ai_fantasy_outputs tablosundan çekilir.

———————————————————————
10) MESSAGING API
———————————————————————
POST /messages/send

Direct → Supabase insert
(Sadece sender & receiver view)

GET /messages/:user_id

Direct → Supabase select
RLS mesaj gizliliğini sağlar.

———————————————————————
11) SCREENSHOT / SECURITY API
———————————————————————
POST /security/screenshot

Edge Function: log-screenshot

Request
{
  "event_type": "screenshot|record",
  "platform": "ios|android"
}


Logs → anti_screenshot_logs

Realtime → creator panel.

———————————————————————
12) SOCIAL FIREWALL API
———————————————————————
POST /firewall/upload-contacts

Edge Function: upload-contacts

Request
{
  "hashed_contacts": ["abc123", "xyz0812"]
}

Flow

creator & kullanıcı rehberi karşılaştırır

eşleşme varsa social_firewall_rules insert

———————————————————————
13) LIVEKIT API
———————————————————————
POST /live/request-token

Edge Function: get-livekit-token

Response
{
  "token": "jwt"
}

POST /live/pay

Edge Function: live-spend-coins

Dakika başı ödeme:

viewer coins --
creator revenue++

———————————————————————
14) DMCA ENGINE API
———————————————————————
Cron: /dmca/scan

Edge Function: dmca-scan

reverse search API

DMCA gönderimi

rapor oluşturma

POST /dmca/remove

Edge Function: dmca-remove

———————————————————————
15) CREATOR PANEL API
———————————————————————
POST /creator/schedule

Edge Function: schedule-content

Cron: /creator/publish-scheduled

Otomatik içerik paylaşımı.

GET /creator/stats

Direct Supabase + views + materialized views.