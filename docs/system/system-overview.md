---
title: İpelya Sistem Mimari Özeti
description: Monorepo yapısı, ana bileşenler ve gelişmiş dating app vizyonu için teknik özet
---

# İpelya Sistem Mimarisi

## 1. Genel Bakış
- **Monorepo**: pnpm + Turborepo ile `apps`, `packages`, `supabase`, `scripts` klasörleri ortak kökten yönetiliyor.
- **Platformlar**: Expo tabanlı mobil istemci + Next.js tabanlı web paneli aynı kod tabanını paylaşıyor.
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime) + Edge Functions; medya için Mux, canlı görüşmeler için LiveKit planlı.
- **Vizyon**: Shadow mode, token ekonomisi, PPV satışları, AI fantasy içerikleri ve canlı odaklı gelişmiş dating deneyimi.

## 2. Uygulamalar
### 2.1 Mobil (apps/mobile)
- **Expo Router** dosya tabanlı navigasyon (`app/(chat)`, `app/(feed)`, `app/(fantasy)` vs.).
- **UI**: Özelleştirilmiş layout bileşenleri (`PageScreen`), tematik `ThemeProvider`, vibe/ASMR/AI kartları içeren ana ekran taslakları.
- **State**: `src/store` altında Zustand store'ları (`auth`, `profile`, ileride `shadow`, `coins`, `live` için yer var). Secure Store ile token saklama (`services/secure-store.service.ts`).
- **Data Layer**: Supabase JS client (`src/lib/supabaseClient`) + React Query (henüz wiring yapılmamış) ile server state planı.
- **Özellik Haritası**:
  - `home.tsx`: Shadow & real profil toggle, token gösterimi, vibe bazlı keşif, ASMR market, AI Fantasy teaser.
  - `(chat)`: DM listesi + konuşma ekranları placeholder.
  - `(live)`: LiveKit oda hazırlıkları.
  - `(creator)`, `(fantasy)`, `(asmr)`: Creator dashboard, AI üretim ve ses pazarına yönelik yollar.
  - `(settings)`: Shadow privacy ve anti-screenshot ayarları için temel sayfalar.

### 2.2 Web (apps/web)
- **Next.js App Router** yapısı (`app/(public)`, `(auth)`, `(creator)`, `(admin)` planlanmış).
- **UI Stack**: Tailwind + shadcn/ui (ayar dosyaları hazır, `components.json` mevcut). Dashboard örnek verisi `app/dashboard/data.json`.
- **Kapsam**: Creator/Admin panelleri, içerik planlama, gelir tabloları, DMCA yönetimi.

## 3. Ortak Paketler (packages/*)
| Paket    | Amaç                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| `types`  | DB/DTO tipleri (profil, içerik, ekonomi, AI, messaging, live) tek yerden ihracı.                           |
| `api`    | Edge function ve Supabase servis çağrıları için servis modülleri (asmr, fantasy, ppv, live, firewall vs.). |
| `hooks`  | Platformdan bağımsız React hooks (auth, coins, shadow mode, fantasy).                                      |
| `config` | Ortak konfigürasyon ve şemalar (örn. nav, feature flag).                                                   |
| `utils`  | Yardımcı fonksiyonlar, adaptörler, tarih/para formatlayıcıları.                                            |

## 4. Backend (supabase/)
- **Migrations**: Kimlik doğrulama, ekonomi (token/coin), içerik tablosu, AI kayıtları, firewall logları için temel şema placeholderları.
- **Edge Functions**: `buy-coins`, `buy-ppv`, `generate-fantasy`, `enable-shadow-mode`, `log-screenshot`, `firewall`, `stripe-webhook`, `upload-contacts`, `get-livekit-token` gibi domain özellikleri.
- **RLS & Güvenlik**: Shadow mode, screenshot logging, anti-ss politikaları belgelerde tanımlanmış durumda.

## 5. Scripts
- `scripts/generate-types.sh`: Supabase tiplerini packages/types içine aktarma.
- Diğer scriptler (migrate/deploy/reset) placeholder olarak mevcut; CI/CD sürecinde Turborepo pipeline'ına bağlanacak.

## 6. Dating App Özellik Haritası
1. **Shadow Mode**: Çift profil, PIN koruması, anti-screenshot, sosyal firewall.
2. **Token Ekonomisi**: Sap Coin + Top points; PPV, içerik satın alma, live room erişimi.
3. **AI Fantasy Engine**: Edge function + OpenAI; metin, ses ve görsel paket üretimi.
4. **ASMR Market**: Kürasyonlu ses paketleri, roleplay temaları, nightly bundles.
5. **Live & DM**: LiveKit odaları, video chat token'ı, DM listesi ve konuşma ekranları.
6. **Safety Stack**: Screenshot loglama, device fingerprint, DMCA taraması, upload-contacts firewall.

## 7. Gelecek Adımlar
- React Query integration + Supabase auth flow'unu tamamla.
- Shadow mode ve coin store'larını Zustand'da genişlet.
- Mobilde LiveKit entegrasyonu ve AI fantasy üretim akışlarını uçtan uca bağla.
- Web tarafında shadcn tabanlı dashboard ekranlarını hayata geçir.
- Supabase edge fonksiyonlarını gerçek endpoint'lerle doldur, Stripe/Apple IAP köprüleri ekle.

## 8. Sistem Dokümantasyon Haritası
| Doküman                                   | Kapsam                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `docs/system/application-architecture.md` | UI/use-case/service katmanları, monorepo paylaşımları ve clean architecture akışı. |
| `docs/system/domain-flows.md`             | Boot, shadow, feed, ekonomi, AI, live, DMCA gibi uçtan uca kullanıcı akışları.     |
| `docs/system/data-platform.md`            | Supabase şeması, pgvector, storage bucket'ları ve RLS stratejisi.                  |
| `docs/system/ai-engine.md`                | AI prompt blueprint'leri, servis entegrasyonları ve güvenlik kuralları.            |

Bu dosyalar birlikte okunarak geliştirici ekibin dating app özellik setini hızla uygulamaya alması hedeflendi.

---
Bu doküman, gelişmiş dating app vizyonu için tüm bileşenleri tek yerde özetleyip ileride detaylandırılacak alt dokümanlara referans sağlar.
