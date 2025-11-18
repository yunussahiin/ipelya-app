┌──────────────────────────────┐
│         CLIENT/APPS          │
├──────────────────────────────┤
│ ① Expo React Native App      │→ iOS / Android
│   - Shadow Profile UI        │
│   - Creator Panel            │
│   - Vibe Match               │
│   - ASMR Player              │
│   - No-Trace Messaging       │
│   - Jeton Satın Alma         │
│   - Anti-Screenshot Layer    │
│                              │
│ ② Next.js Web (SSR/ISR)      │→ Creator Dashboard + Landing
│   - Admin Panel              │
│   - Creator Web Panel        │
│   - DMCA/Legal Pages         │
│   - Content Planning Panel   │
│                              │
└──────────────────────────────┘
React Native Paket Katmanı

expo-router

tanstack-query

zustand

expo-camera

expo-av

expo-secure-store

react-native-reanimated

expo-notifications

🧾 2) API GATEWAY KATMANI
┌──────────────────────────────┐
│     API / NETWORK LAYER      │
├──────────────────────────────┤
│ Axios / Fetch API            │
│ JWT Auth (Supabase)          │
│ Secure Storage Token Flow    │
└──────────────────────────────┘


Bu katman tüm talepleri Supabase, Edge Functions, AI Server, Media Server gibi hedeflere gönderir.

🗄️ 3) SUPABASE CORE (ANA BACKEND)

İpelya’nın beynidir.

┌──────────────────────────────────────────┐
│                SUPABASE                  │
├──────────────────────────────────────────┤
│ 🔐 AUTH                                  │
│ - Email / Phone OTP                      │
│ - Device Check                           │
│ - JWT Custom Claims (Shadow Mode)        │
│                                          │
│ 🗄️ DATABASE (PostgreSQL + JSONB)          │
│ - users / profiles (real + shadow)       │
│ - creator_content                        │
│ - messages (no-trace)                    │
│ - ppv / subscriptions                    │
│ - coins / transactions                   │
│ - reports / ai_logs                      │
│                                          │
│ 📦 STORAGE                                │
│ - creator-media/                         │
│ - asmr/                                  │
│ - ai-content/                            │
│ - shadow-content/                        │
│                                          │
│ ⚡ REALTIME                               │
│ - Chat                                   │
│ - Creator notifications                  │
│ - Anti-screenshot logs                   │
│                                          │
│ 🧠 PGVECTOR                               │
│ - Vibe embeddings                         │
│ - Behavior scoring vectors               │
│ - Fantasy model pref embeddings          │
│                                          │
│ 🔒 RLS + Policies                         │
│ - Owner-only rows                        │
│ - Shadow isolation                       │
│ - PPV signed-url policies                │
└──────────────────────────────────────────┘

🔧 4) EDGE FUNCTIONS (SERVERLESS BACKEND LOGIC)

Supabase’in “micro-backend” motoru.

┌──────────────────────────────────────────┐
│          SUPABASE EDGE FUNCTIONS         │
├──────────────────────────────────────────┤
│ payment_webhook (Stripe/Iyzico)          │
│ coin_purchase → jeton ekleme             │
│ creator_payout_scheduler                 │
│ DMCA bot                                 │
│ AI trigger (story / image / video)       │
│ Fraud detection                           │
│ No-trace messaging auto-delete (cron)    │
│ Shadow-cache cleaner                      │
└──────────────────────────────────────────┘

🧠 5) AI STACK (FANTASY ENGINE + CONTENT AI)
┌──────────────────────────────────────────┐
│                 AI SERVER                │
├──────────────────────────────────────────┤
│ Text (Story Engine)                      │
│ → OpenAI GPT-4.1-mini / GPT-5-tier       │
│                                          │
│ Image Generator                           │
│ → OpenAI Image models                     │
│ → Stable Diffusion / ComfyUI server       │
│                                          │
│ Video Generator                           │
│ → Pika Labs / Runway / Luma Cloud         │
│                                          │
│ Voice AI                                  │
│ → ASMR noise clean                       │
│ → Voice morphing                         │
│ → TTS (OpenAI / ElevenLabs)              │
│                                          │
│ Deepfake Detection                        │
│ Behavior Scoring                          │
└──────────────────────────────────────────┘


AI Server → Supabase Edge Function → Storage → Mobil App akışı.

🎥 6) MEDIA INFRA (VIDEO + ASMR + LIVESTREAM)
┌──────────────────────────────────────────┐
│             MEDIA SERVICES               │
├──────────────────────────────────────────┤
│ MUX → Video upload + playback            │
│ LiveKit → Canlı yayın + birebir görüşme  │
│ Cloudflare Images → CDN                  │
│ Supabase Storage → ASMR ve küçük medya   │
└──────────────────────────────────────────┘


Video yükleme akışı:

Mobile App → upload → MUX

MUX encode → Supabase DB'ye metadata yaz

App → signed playback URL al

Player → anti-recording layer (FLAG_SECURE)

💳 7) ÖDEME & EKONOMİ ALT YAPISI
┌──────────────────────────────────────────┐
│               PAYMENTS                   │
├──────────────────────────────────────────┤
│ Stripe (global)                          │
│ Iyzico (TR için)                          │
│ Apple IAP + Google Billing               │
│ RevenueCat (growth döneminde)            │
│                                          │
│ Jeton Ekonomisi                          │
│ - coin_packages                          │
│ - purchase log                           │
│ - creator_revenue                        │
│ - payout_schedule                         │
└──────────────────────────────────────────┘

🔐 8) SECURITY & PRIVACY LAYER (İPELYA’NIN DNA’SI)
┌──────────────────────────────────────────┐
│        PRIVACY & PROTECTION LAYER        │
├──────────────────────────────────────────┤
│ Anti-Screenshot (iOS/Android FLAG)       │
│ Anti-Recording (UI layer + hooks)        │
│ No-trace Messaging (self-destruct)       │
│ Shadow Profile Isolation (RLS)           │
│ Social Firewall                           │
│   - rehber matching block                │
│   - IP-based isolation                   │
│   - mutual connections hidden            │
│ DMCA Engine (Edge Function + crawlers)   │
│ AI Content Protection (reverse search)   │
└──────────────────────────────────────────┘


Bu katman legal olarak OnlyFans + Snapchat + Bumble seviyesinde.

🧭 9) TAM MİMARİ – TEK BAKIŞTA

Aşağıdaki diyagram yüksek seviye akışı gösterir:

   CLIENTS (Expo RN, Next.js)
               │
               ▼
      API Gateway (fetch/axios)
               │
               ▼
       ┌─────────────────┐
       │   SUPABASE      │
       │ Auth            │
       │ DB (pg + RLS)   │
       │ Storage         │
       │ Realtime        │
       │ VectorDB        │
       └─────────────────┘
               │
   ┌───────────┼─────────────┐
   ▼           ▼             ▼
Edge Fn    AI Server     Media Server
(payment)  (story/img)   (Mux/LiveKit)
   │           │             │
   └──────┬────┴───────┬─────┘
          ▼            ▼
     Supabase Storage + DB
          │
          ▼
     Mobile App & Web App