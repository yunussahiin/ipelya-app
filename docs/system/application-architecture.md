---
title: İpelya Uygulama Mimarisi
description: İstemci uygulamaları, ortak paketler ve backend katmanları arasındaki ilişkileri özetleyen teknik rehber
---

# İpelya Uygulama Mimarisi

## 1. Katmanlı Yaklaşım
- **UI Katmanı**: `apps/mobile` (Expo) ve `apps/web` (Next.js) ekranları, layout'ları ve rotaları barındırır.
- **Use-Case Katmanı**: `packages/hooks` içinde paylaşılan iş kuralları ile `packages/api` servis çağrıları bulunur.
- **Veri Katmanı**: Supabase client, edge function istemcileri ve medya/AI servisleri `packages/api`, `packages/utils`, `packages/config` altında ortaklaşa kullanılır.
- **Domain Katmanı**: `packages/types` ve Supabase şeması (bkz. `docs/system/data-platform.md`) tüm modülleri tip güvenli hale getirir.

## 2. İstemci Uygulamaları
### 2.1 Mobil (Expo React Native)
- **Navigasyon**: `expo-router` tabanlı file-system routing (`app/(auth)`, `(chat)`, `(fantasy)`, `(live)` vb.).
- **Durum Yönetimi**: `@tanstack/react-query` ile server state, Zustand store'ları (`auth`, `profile`, `shadow`, `coins`, `live`) ile client state.
- **Öne Çıkan Modüller**: Shadow Mode açılışı, dual feed, AI Fantasy UI, ASMR Market, LiveKit oda katılımı, anti-screenshot layer.
- **Altyapı Paketleri**: `expo-secure-store`, `expo-av`, `expo-camera`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-notifications`.

### 2.2 Web (Next.js App Router)
- **Layout Bölümleri**: `(public)` landing & pricing, `(auth)` giriş/üye ol, `(creator)` dashboard & takvim, `(admin)` moderation paneli.
- **UI Stack**: TailwindCSS + shadcn/ui komponentleri; layout, charts, tables klasörleri ile modüler yapı.
- **Kritik Modüller**: Creator schedule & revenue ekranları, DMCA raporları, içerik yönetimi, admin overview.

## 3. Ortak Paketler
| Paket             | Kapsam                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `packages/types`  | Supabase şemasından türeyen tüm tipler, DTO'lar ve enum'lar.                                       |
| `packages/api`    | Edge functions ve Supabase sorguları için servis katmanı (`fantasy`, `coins`, `live`, `security`). |
| `packages/hooks`  | Use-case bazlı React hooks (`useShadowProfile`, `useCreatorStats`, `useFantasy`).                  |
| `packages/utils`  | Tarih/format yardımcıları, guard fonksiyonları.                                                    |
| `packages/config` | Ortak konfigürasyonlar, feature flag'ler, navigasyon verileri.                                     |

Bu paketler sayesinde mobil ve web istemcileri aynı iş kurallarını tekrar kullanır.

## 4. Backend ve Servis Katmanı
- **Supabase**: Auth (OTP), Postgres + pgvector, Storage, Realtime, Edge Functions, Cron görevleri.
- **Edge Functions**: Shadow Mode (`enable-shadow-mode`), ekonomi (`buy-coins`, `buy-ppv`), AI (`generate-fantasy`), güvenlik (`log-screenshot`, `upload-contacts`), LiveKit token, DMCA tarayıcı.
- **Medya**: Mux (VOD), LiveKit (RTC), Supabase Storage bucket'ları (`creator-media`, `asmr`, `ai-content`, `shadow-content`).
- **AI & Güvenlik Servisleri**: OpenAI (story/image/video prompt'ları), Stable Diffusion / Pika / Runway, ElevenLabs & DSP tabanlı ses pipeline'ı, reverse search / DMCA botu.

## 5. Clean Architecture Haritası
1. **Modül Tasarımı**
   - Domain tipleri ve şemalar `packages/types` + `docs/system/data-platform.md`.
   - Use-case hook'u (`packages/hooks`) HTTP/edge çağrılarını `packages/api` üzerinden yapar.
   - UI bileşenleri `apps/mobile` / `apps/web` içinde domain odaklı dizinlere ayrılır.
2. **Akış**
   - Örn. Shadow Mode: UI → `useShadowProfile` → `packages/api/security.enableShadowMode` → Edge Function → Supabase JWT → RLS.
   - Aynı örüntü AI, ekonomi, live, DMCA modülleri için geçerlidir.

## 6. Referans Dokümanlar
- `docs/system/domain-flows.md`: Uçtan uca kullanıcı yolculukları.
- `docs/system/data-platform.md`: Supabase şeması, RLS ve storage politikaları.
- `docs/system/ai-engine.md`: AI prompt zinciri ve üretim altyapısı.

Bu mimari rehber, feature ekiplerinin hangi katmanda çalışacağına hızlıca karar verebilmesi için hazırlanmıştır.
