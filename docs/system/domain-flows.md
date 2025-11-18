---
title: Kullanici Akislari ve Moduler Domain Haritalari
description: Mobil ve web deneyimi icin tum kritik akislari ve etkilenen backend servislerini anlatir
---

# İpelya Domain Akışları

## 1. Uygulama Açılışı & Oturum
1. App boot → SecureStore token kontrolü.
2. Token yoksa `(auth)` stack açılır; varsa Supabase oturum doğrulanır.
3. Shadow flag SecureStore'dan okunur; gerekirse `enable-shadow-mode` Edge Function'ı çağrılır.
4. Zustand `auth` + `profile` store'ları hydrate edilir.

**Etkilenen servisler**: Supabase Auth, SecureStore, `packages/hooks/useAuth`, `packages/api/auth`.

## 2. Shadow Profile Aktivasyonu
1. Kullanıcı PIN/FaceID ile shadow mod talep eder.
2. `packages/hooks/useShadowProfile` → `packages/api/security.enableShadowMode()`.
3. Edge Function PIN hash doğrular, Supabase JWT claim'ini `shadow_mode=true` yapar.
4. React Query cache + Zustand store shadow mod ile güncellenir; feed tekrar fetch edilir.
5. RLS politikaları shadow feed'i otomatik uygular.

**Tablolar**: `profiles`, `audit_logs` (PIN denemeleri).  
**Edge Functions**: `enable-shadow-mode`, `disable-shadow-mode`.

## 3. Dual Feed (Real vs Shadow)
1. Home ekranı `GET /feed` query'sini React Query ile çeker.
2. Query parametreleri: kullanıcı embedding'i + shadow flag.
3. Edge Function / SQL view:  
   - pgvector similarity search  
   - Social firewall filtreleri  
   - Shadow/real RLS ayrımı  
   - `discovery_feed` log insert

**Tablolar**: `creator_content`, `discovery_feed`, `embeddings_profiles`, `social_firewall_rules`.  
**Servisler**: Supabase RPC/view, `packages/api/feed.getFeed`.

## 4. Creator İçerik Keşfi ve PPV
1. Kullanıcı Creator kartına tıklar → içerik detay ekranı.
2. RLS, visibility ve satın alma durumuna göre Supabase'den veri verir.
3. PPV satın alma:  
   - `packages/api/economy.buyPPV` Edge Function'ı çağırır.  
   - Coin bakiyesi kontrol, `ppv_purchases` kaydı, `creator_revenue` insert.  
   - Signed URL + 60sn TTL döner.

**Tablolar**: `creator_content`, `ppv_purchases`, `coin_transactions`, `creator_revenue`.  
**Edge**: `buy-ppv`.

## 5. Jeton Satın Alma ve Ekonomi
1. Kullanıcı paket seçer → `buy-coins` Edge Function checkout başlatır.
2. Stripe/Iyzico/StoreKit ödeme webhook'u (`stripe-webhook`) coin bakiyesini günceller.
3. `coin_transactions` transaction log, `creator_revenue` share.
4. Mobilde yeni bakiye Zustand store'a yansır.

**Tablolar**: `coin_packages`, `coin_transactions`, `creator_revenue`, `creator_payouts`.  
**Edge**: `buy-coins`, `stripe-webhook`, `iyzico-webhook`.

## 6. ASMR Market
1. `GET /asmr/list`: Satın alınmış içerikler RLS ile signed URL, diğerleri preview.
2. Satın alma akışı `buy-asmr` (PPV ile aynı pattern).
3. Ses dosyaları `asmr/` bucket'ında, playback `expo-av` ile.

**Tablolar**: `asmr_audio`, `asmr_purchases`.  
**Storage**: `asmr/` bucket signed URL policy.

## 7. AI Fantasy Engine
1. Kullanıcı `Generate Fantasy` tetikler → `packages/api/ai.generateFantasy` Edge Function'ı çağırır.
2. `ai_fantasy_requests` satırı pending oluşturur; Edge Function OpenAI/SD/Pika çağırır.
3. Sonuç `ai_fantasy_outputs` + `ai-content/` bucket'a yazılır, Realtime event ile kullanıcı bilgilendirilir.
4. UI, request status realtime subscription ile takip eder.

**Tablolar**: `ai_fantasy_requests`, `ai_fantasy_outputs`, `ai_behavior_logs`.  
**Edge**: `generate-fantasy`, `fantasy-webhook` (opsiyonel).  
**Servisler**: OpenAI GPT, Image, Runway/Pika, ElevenLabs.

## 8. No-Trace Messaging
1. DM listesi ve konuşma ekranı Supabase Realtime kanalına abone olur.
2. Mesaj gönderiminde `messages` tablosuna insert; RLS sadece sender/receiver'a izin verir.
3. Cron job (Edge) `expires_at` geçmiş satırları temizler.

**Tablolar**: `messages`.  
**Edge/Cron**: `cleanup-messages`.  
**Realtime**: kanal `messages:profile_id`.

## 9. Anti-Screenshot & Güvenlik
1. Mobil native layer screenshot/screenrecord yakalar → `packages/api/security.logScreenshot()`.
2. Edge Function `anti_screenshot_logs` tablosuna yazar, creator paneline realtime bildirim gönderir.
3. Social firewall: `upload-contacts` Edge Function hashed rehberi tarar, `social_firewall_rules` oluşturur.

**Tablolar**: `anti_screenshot_logs`, `social_firewall_rules`.  
**Edge**: `log-screenshot`, `upload-contacts`.

## 10. LiveKit Görüşmeleri
1. Kullanıcı görüşme başlatır → `get-livekit-token` Edge Function token üretir.
2. Oda içinde dakika başı ekonomi: `live-spend-coins` cron/interval Edge Function.
3. `live_sessions` ve `live_payments` tablosu oturum + coin harcamasını kaydeder.

**Servisler**: LiveKit Cloud, Supabase Edge, `packages/api/live` helper'ları.

## 11. Creator Panel Akışları (Web)
1. Creator dashboard, Supabase view'ları ile real-time gelir, abonelik ve DMCA metriklerini çeker.
2. Planlama: `schedule-content` Edge Function future post oluşturur, cron `publish-scheduled` posta çevirir.
3. DMCA engine: `dmca-scan` cron reverse search, `dmca_reports` + `dmca_actions` güncellenir.

---
Bu doküman her modül için sorumlu tabloları, edge function'ları ve istemci katmanlarını hızlıca eşleştirerek yeni geliştirme süreçlerini hızlandırır.
