🧱 1) Uygulama Açılış (Boot Process)
Expo RN App Açılır →
    SecureStore kontrol edilir →
       - accessToken?
       - refreshToken?
       - shadowMode flag?
    Eğer token yoksa → Auth Screens
    Eğer token varsa → Supabase Auth → session verify

Eğer Shadow Mode açıksa:

JWT içinde shadow_mode=true claim set edilir

Feed & kullanıcı verileri direkt gölgeli modda hazırlanır

Bu claim Supabase tarafından tüm RLS politikalarında kullanılır.

#️⃣ 2) Login / Signup Akışı
User → Email/Phone OTP →
   Supabase Auth → magic link / OTP doğrulama →
     Server JWT üretir →
         App token saklar (SecureStore)
             → profiles tablosundan real + shadow satırları çekilir
             → onboarding flow başlar

Signup sonrası:

2 profil oluşturulur:

type='real'

type='shadow'

Shadow profili açmak için PIN ister → SecureStore’da hash tutulur

#️⃣ 3) Shadow Profile Aktivasyonu
User →
   PIN gir →
      Edge Function → PIN hash doğrulama →
         JWT claim update →
             supabase.auth.updateUser({ shadow_mode: true })
                 → App global state = shadow

Yeni feed istekleri:
GET /feed → JWT shadow_mode=true →
   Supabase RLS:
      - real profiller görünmez
      - shadow-only content görünür

#️⃣ 4) Ana Sayfa (Home Flow) – Erkek Kullanıcı

Erkek kullanıcı uygulamayı açtığında:

A. Haber Akışı (Sports/Tech/Crypto API)

→ External API’lerden çekilir
→ Memory cache (1–3 dk)

B. Creator Keşif (Vibe Match + pgvector)

App → /api/feed/creator → supabase-edge:

1) user_behavior embedding al 
2) creator_embeddings ile similarity search
3) firewall kontrollü filtrasyon
4) discovery_feed tablosuna log yaz
5) 30 sonuç döndür

C. AI Fantezi önerisi

Son 5 isteğe göre

Latest user vector’a göre mini prompt önerisi

#️⃣ 5) Creator Content Gösterimi (PPV / Subs / Shadow)

Mobil uygulama bir içeriği açmak istediğinde:

GET /content/:id →
   Supabase SELECT creator_content WHERE id=:id
       |
       ├→ visibility='public'          → OK
       ├→ visibility='subscribers'     → check creator_subscriptions
       ├→ is_ppv=true                  → check ppv_purchases
       ├→ shadow-only content          → check shadow_mode claim

Eğer PPV ise:
Generate signed URL (60 sec)
Return playable media URL


Supabase signed URLs burada devreye girer.

#️⃣ 6) Jeton Satın Alma Akışı
App → Choose Package →
    Stripe/Iyzico Billing →
       Webhook → supabase-edge: coin_purchase_success()
           → coin_transactions.insert (type=purchase)
           → increase user coin balance
           → return “success”


Mobil uygulama sonrasında yeni bakiye ile state’i günceller.

#️⃣ 7) PPV İçerik Satın Alma
App →
   Call /buy-ppv →
      Edge Function:
         1) Check coin balance
         2) Deduct coins
         3) Insert ppv_purchases
         4) Add creator_revenue
         5) Generate signed URL (60sec)
         6) Return media

#️⃣ 8) ASMR Market Akışı
ASMR audio list →
   SELECT asmr_audio
      - Eğer purchased → oynatılabilir
      - Değilse → preview mode (5sn)


ASMR satın alma:

Jeton harcama sistemi

Aynı PPV akışını kullanır

#️⃣ 9) AI Fantasy Generator Flow

(Hikâye + Görsel + Mini Video)

App → “Generate Fantasy”
     →
       INSERT ai_fantasy_requests (pending)
           → Edge Function: process_fantasy_request()
                 - text: OpenAI → story
                 - image: OpenAI/SD → prompt
                 - video: Pika/Runway
             → Upload results to supabase storage
             → INSERT ai_fantasy_outputs
             → update ai_fantasy_requests (status=done)
     →
        App realtime subscription:
           - request.status === 'done' olunca sonuç çekilir

#️⃣ 10) No-Trace Messaging Akışı
Mesaj Gönderimi
App → send message →
   INSERT messages (encrypted)
   Realtime push → karşı tarafa

Mesaj Silme

Edge Cron → DELETE WHERE expires_at < NOW()

#️⃣ 11) Anti Screenshot Flow

Mobil uygulama:

Screenshot alındı → event listener çalışır

Backend’e log atar:

POST /anti-ss → edge: log_screenshot() →
     INSERT anti_screenshot_logs
     Realtime push → Creator Panel

#️⃣ 12) LiveKit – Birebir Görüşme Akışı
App → Start Call Request →
   Edge Function: request_livekit_token()
      - LiveKit Server API → session token
   App → join room


Ödeme akışı:

Dakika bazlı jeton harcama

Edge Function per X seconds:

viewer → coins_spent
creator → creator_revenue

#️⃣ 13) Creator İçerik Yükleme (Foto/Video/AI)
App →
   Upload → Supabase Storage (creator-media/)
       → Get public/storage path
           → INSERT creator_content
               - type = image/video/ai
               - theme_id
               - ppv flag
               - price

Video yükleme Mux ile:

App → Mux upload → Mux webhook:

Mux → supabase-edge: mux_asset_ready()
    → update creator_content (playback_url)

#️⃣ 14) Creator Planlama Paneli (Next.js)
Creator Web App →
    Create scheduled content →
        INSERT creator_schedule (future date)


Edge Cron:

IF scheduled_date <= NOW():
    publish content
    update creator_content.status='posted'

#️⃣ 15) DMCA Engine Akışı

Edge Cron:

for each creator_content:
    reverse search →
       IF found:
          INSERT dmca_reports
          Edge Fn: send takedown
          INSERT dmca_actions


Creator panel → realtime report preview.

#️⃣ 16) Social Firewall (Rehber/IP)

Mobil uygulama:

App → rehber hash list →
Edge Fn:
    IF match with creator/user:
         INSERT social_firewall_rules


RLS feed kontrolü:

WHERE profile_id NOT IN (
    SELECT blocked_profile_id
    FROM social_firewall_rules
    WHERE user_profile_id = $me
)

#️⃣ 17) Dual Feed System – Workflow
Real Feed:

Creator keşfi

Haberler

PPV önerileri

Shadow Feed:

Fantazi odaklı içerikler

Shadow-only creator içerikleri

AI görsel/video önerileri

En gizli mod

Akış:

GET /feed →
   if shadow_mode=false → real feed query
   if shadow_mode=true → shadow feed query


RLS feed ayrımını otomatik yapar.