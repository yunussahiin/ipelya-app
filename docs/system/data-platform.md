---
title: Supabase Data & Storage Platform
description: İpelya veritabanı, storage ve RLS stratejisini anlatan sistem dokümanı
---

# Supabase Data Platform

## 1. Mimari Genel Bakış
- **PostgreSQL + Supabase** tüm transactional veriyi taşır; JSONB ve pgvector desteği sayesinde AI ve analitik veriler aynı yerde tutulur.
- **Storage Bucket'ları**: `creator-media/`, `asmr/`, `ai-content/`, `shadow-content/`, `avatars/`, `thumbnails/`.
- **Realtime & Cron**: Mesajlar, anti-screenshot logları ve DMCA aksiyonları için kanal bazlı bildirimler + periyodik temizleyiciler.

## 2. Domain Bazlı Şema
| Domain               | Tablolar                                                                                                             | Açıklama                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Auth & Profil        | `users`, `profiles`                                                                                                  | Tek kullanıcı = real + shadow satırı, PIN hash ve shadow flag burada. |
| İçerik & Theme       | `creator_content`, `content_themes`, `profile_vibes`, `vibes`                                                        | PPV, abonelik, vibe metadata'sı.                                      |
| Ekonomi              | `coin_packages`, `coin_transactions`, `creator_revenue`, `creator_payouts`, `ppv_purchases`, `creator_subscriptions` | Jeton ekonomisi ve gelir paylaşımı.                                   |
| ASMR                 | `asmr_audio`, `asmr_purchases`                                                                                       | Ses ürünleri ve satın alma logları.                                   |
| AI & Davranış        | `ai_fantasy_requests`, `ai_fantasy_outputs`, `ai_behavior_logs`, `embeddings_profiles`, `discovery_feed`             | AI üretimleri ve embedding kayıtları (pgvector).                      |
| Messaging & Güvenlik | `messages`, `anti_screenshot_logs`, `social_firewall_rules`, `dmca_reports`, `dmca_actions`, `audit_logs`            | No-trace mesajlar, anti-SS, firewall ve DMCA motoru.                  |
| Live & Streaming     | `live_sessions`, `live_payments`                                                                                     | LiveKit oturumları ve dakika bazlı coin harcaması.                    |

## 3. pgvector ve Öneri Motoru
- `embeddings_profiles` içinde görünüş, vibe ve davranış vektörleri tutulur.
- `ai_behavior_logs` aksiyonları embeddings'e dönüştürür; triggers aracılığıyla güncellenir.
- Feed sorguları `embedding_vector <-> $user_vector` sıralaması ile shadow/real mod için farklı pipeline çalıştırır.

## 4. Storage Politikaları
- `shadow-content/` sadece shadow claim içeren JWT ile erişilebilir.
- PPV/ASMR dosyaları signed URL (60 sn) üzerinden servis edilir.
- AI çıktıları `ai-content/` bucket'ında versiyonlanır; DMCA takibi için metadata tutulur.

## 5. RLS & Güvenlik Katmanı
- **Profiles**: owner + shadow izolasyon politikaları.
- **creator_content**: public/subscriber/PPV + shadow flag kombinasyonları.
- **messages**: sadece gönderici/alıcı okur; cron siler.
- **Economy**: `coin_transactions`, `ppv_purchases`, `creator_revenue` satırları sadece ilgili profile tarafından görülür.
- **Security**: `anti_screenshot_logs` sadece creator'a açılır; `social_firewall_rules` owner'a özeldir.

## 6. Edge Functions & DB Etkileşimi
- `buy-coins`, `buy-ppv`, `buy-asmr`: coin bakiyesi RPC'leri (`get_coin_balance`, `deduct_coins`).
- `enable-shadow-mode`: `profiles` shadow PIN hash doğrular, `auth.admin.updateUser` ile claim ayarlar.
- `generate-fantasy`: `ai_fantasy_requests`/`outputs` kayıt döngüsü.
- `log-screenshot`, `upload-contacts`, `dmca-scan`, `get-livekit-token`, `schedule-content` DB'de domain tablosuna yazar.

## 7. Operasyonel Pratikler
- **Migrations**: Supabase MCP SERVER veya SQL dosyaları `supabase/migrations` altında tutulmalı.
- **Types Sync**: `scripts/generate-types.sh` ile DB → `packages/types` senkronu.
- **Monitoring**: Query performance, storage kullanım, Edge Function logları Supabase dashboard üzerinden takip edilir.

Bu belge, tüm veri ve storage tasarımını tek noktada özetleyerek yeni modül geliştirmelerinde referans sağlar.
