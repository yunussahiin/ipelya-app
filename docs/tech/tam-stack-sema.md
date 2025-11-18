📱 İpelya – React Native / Expo Stack & Servisler (MVP Odaklı)
0. Genel Notlar

Mobil: Expo + React Native (iOS + Android)

Backend: Supabase (Postgres + Auth + Storage + Realtime) + ek AI/medya backend’leri

Sıkı gizlilik + media ağırlıklı + AI ağırlıklı bir app olduğu için:

UI/UX tarafında performans / UX paketleri

Media tarafında video/stream servisleri

Güvenlik tarafında anti-SS, secure storage

Subscription / ödeme tarafında Stripe / RevenueCat (policy’lere uyum notlarıyla)

1. React Native / Expo – Önerilen Paketler
1.1. Navigation

Amaç: Çok ekranlı, auth’lu, tab’li, modallı yapı + Shadow Profile mantığı.

expo-router

Expo’nun resmi önerdiği, dosya tabanlı routing çözümü. Modern Expo projelerinde React Navigation üstüne bir abstraction olarak öneriliyor. 
Expo Documentation
+1

Özellik: file-based routing, nested stack/tab, deep-linking, web uyumu.

Alternatif:

@react-navigation/native + @react-navigation/native-stack (Expo Router kullanmazsan klasik çözüm). 
viewlytics.ai

Öneri: Yeni projede Expo Router ile başlaman çok daha hızlı ve geleceğe dönük.

1.2. State Management & Data Fetching

Amaç: Feed’ler, shadow feed, profil state’i, gerçek zamanlı veriler.

@tanstack/react-query

Server state yönetimi, cache, refetch, optimistic updates için. Feed, haber akışı, creator listeleri için ideal.

zustand

Hafif global state (ör. aktif profil: real/shadow, UI modları, modal state, onboarding step).

Artı Opsiyonlar:

jotai veya redux-toolkit (daha büyük ekip / daha karmaşık state isterse).

Tümü open-source, lisans maliyeti yok.

1.3. Form & Validation

Amaç: Kayıt, profil düzenleme, ödeme formu, creator setup wizard.

react-hook-form

Performanslı ve esnek form yönetimi.

zod

Type-safe schema validation. Form + API response için tek kaynak.

Maliyet: 0$ (OSS).

1.4. UI / Animation / Gesture

Expo ile çoğu zaten built-in geliyor, ama kritik paketler:

react-native-reanimated – gesture, modallar, bottom sheet animasyonları (Expo içinde). 
DEV Community

react-native-gesture-handler – swipe, pan, custom gestures (Expo içinde).

react-native-safe-area-context, react-native-screens – modern RN’de klasik.

Maliyet: 0$ (OSS).

1.5. Auth & Güvenli Depolama

Amaç:

Real / Shadow profil ayrımı

Token / session / PIN saklama

Paketler:

@supabase/supabase-js

Auth, database, storage için resmi JS client. React Native’de de kullanılıyor. 
Supabase
+1

expo-secure-store

Access token, refresh token, shadow PIN gibi hassas verilerin güvenli saklanması.

expo-local-authentication

FaceID / TouchID entegrasyonu (Shadow Profile’i açmak için).

Maliyet:

Paketler ücretsiz, Supabase kullanımına göre ücret (aşağıda).

1.6. Media & Upload (Fotoğraf / Video / Ses)

Amaç:
Creator içerik yüklemesi, ASMR sesleri, kısa video.

expo-image-picker

Gallery / camera’dan media seçimi.

expo-camera

Uygulama içi kayıt.

expo-av

Ses ve video oynatma (ASMR player, kısa video preview).

react-native-video (gerektiğinde)

Daha gelişmiş video player kontrolleri için alternatif.

Media’nın asıl ağır tarafı backend & CDN & streaming servisi (Mux/LiveKit), onları aşağıda anlatıyorum.

1.7. Realtime / Chat / Presence

Amaç: No-trace messaging, canlı yayın etkinlikleri, online/aktif durumları.

Supabase Realtime (Postgres + Realtime)

@supabase/supabase-js ile birlikte gerçek zamanlı feed, chat status vs. 
Supabase
+1

Paket tarafında:

@supabase/supabase-js içinde Realtime desteği var, ekstra paket gerekmiyor.

Alternatif (ileride ileri chat fonksiyonları için):

stream-chat-expo (GetStream)

pusher-js, ably

1.8. Push Notifications

İki opsiyon:

A) Expo Push Notification Sistemi

expo-notifications

Expo Push service üzerinden token alıp server’dan push yollarsın.

Fiyat: Asıl maliyet, EAS Update / infra tarafında; push servisin kendisi ayrı bir ücretlendirme sayfasına sahip değil, Expo EAS planına göre dolaylı maliyet çıkıyor. 
Expo
+1

B) OneSignal

Paketler: react-native-onesignal

Özellikler: segmentler, A/B test, daha gelişmiş panel.

Fiyat:

Ücretsiz plan: unlimited mobile push, 10k web push & 10k email gibi generous free tier. 
OneSignal
+1

Ücretli planlar: ~19$/ay civarında başlayan Growth plan. 
OneSignal

Öneri: MVP’de Expo push ile başlayıp, growth döneminde OneSignal’a geçmek mantıklı.

1.9. Error Tracking & Logging

Sentry React Native SDK

Crash, JS error, performance tracing.

Fiyat (Sentry):

Free plan: 1 kullanıcı, 5k error event vb. 
Sentry
+1

Team plan: 26$/ay civarında başlıyor. 
Sentry

1.10. Analytics & Product Analytics

Firebase Analytics (temel event bazlı, ücretsiz).

Daha ürün odaklı analiz için:

PostHog – self-host veya Cloud.

Generous free tier, ücretler event sayısına göre usage-based. 
posthog.com
+1

Alternatif: Amplitude, Mixpanel.

Öneri: MVP’de Firebase + basit event tracking, sonra PostHog’a geçiş.

2. Üçüncü Parti Servisler (MVP İçin Şart + Tahmini Maliyetler)

Burada fiyatlar USD ve 2025 itibarıyla yaklaşık, bölge & kullanım senaryosuna göre değişebilir. Amacımız ölçek için kabaca band görmek.

2.1. Supabase (DB + Auth + Storage + Realtime)

Planlar:

Free: Geliştirme & küçük MVP için yeterli limitler. 
Supabase
+1

Pro: ~25$/ay başlangıç, üstüne usage-based (storage, bandwidth, auth, db boyutu). 
MetaCTO

İpelya için tahmin:

MVP aşamasında: Free → Pro’ya geçiş

İlk ciddi kullanıcı artışında: 25–100$/ay aralığını görmen çok olası.

2.2. Expo Application Services (Build, Update)

Free Plan:

~15 iOS + 15 Android build (toplam 30) / ay, low priority, 1k MAU için update vb. 
Expo
+1

Starter / Production Plan:

Starter: 19$/ay + usage (extra build, daha fazla MAU). 
Expo
+1

Production: 199$/ay + usage (daha yüksek limitler). 
Expo
+1

İpelya için tahmin:

MVP’de Free ile başlanır.

App store yayını + sık deployda Starter (19$/ay) mantıklı.

2.3. Video On-Demand & Streaming (Creator İçerikleri)
Mux (VOD + stream altyapısı)

Free Plan:

10 video asset

100.000 dakika delivery / ay ücretsiz. 
mux.com
+1

Kullanım sonrası ücretler:

Storage: ~0.0024–0.003$/dakika/ay

Delivery: ~0.0008–0.001$/dakika civarı (çözünürlüğe göre). 
PriceTimeline
+1

Starter plan: 10$/ay, 100K delivery minute + 100$ usage credit gibi paketler sunuyor. 
PriceTimeline
+1

MVP için tahmin:

İlk aşamada Free plan ile deneme / erken beta.

Gerçek kullanıcıya açıldığında: 10–50$/ay bandı (kullanım artarsa yukarı çıkar).

2.4. Canlı Yayın + Bire Bir Görüşme

İpelya için kritik: birebir görüntülü sohbet ve ileride grup yayınlar.

LiveKit Cloud

Build Plan (Free):

100 concurrent participant

5.000–10.000 civarı katılımcı/dakika (dokümanlarda 5k–10k free minute, 50GB bandwidth). 
neuphonic.com
+2
voice-mode.readthedocs.io
+2

Ship Plan:

50$/ay, 1.000 concurrent participant, 150.000 dakika, 250GB bandwidth. 
neuphonic.com
+1

Üzerine usage-based ücretlendirme (dakika ve bandwidth bazlı). 
LiveKit docs
+1

MVP için tahmin:

İlk POC + küçük beta → Build (0$)

Gerçek kullanıcı trafiği → 50$/ay Ship plan fazlasıyla yeter.

İleride isteresen self-host LiveKit server opsiyonu da var (aylık 100$ civarı managed deploy hizmetleri). 
livekit.blog
+1

2.5. Ödeme – Jeton + Abonelik
Stripe

Tipik kart ödemesi:

Birçok pazarda ~2.9% + 0.30$ civarı transaction ücreti. 
Stripe
+1

Setup fee yok, aylık sabit ücret yok (sadece transaction başına).

Not: Yetişkin içerik / “adult” kategorisinde Stripe’in policy’leri çok kritik, kullanım öncesi şartlara uyum kontrolü şart; burada “nasıl bypass edilir” tavsiyesi veremem, ama hukuki & uyum tarafının ayrıca çalışılması gerekiyor.

Iyzico (TR pazarı)

Lokal kartlar & taksit için güzel, komisyon oranları ~%2–3 + sabit ücret bandında, planlara göre değişiyor (resmi sayfadan teklif almak gerekiyor).

Subscription Yönetimi – RevenueCat

App Store / Google Play / web subscription’ları tek yerden yönetme.

Fiyat modeli: Monthly Tracked Revenue (MTR) bazlı.

Free tier: Küçük MTR için ücretsiz.

Sonra MTR büyüdükçe plan ücreti artıyor. 
RevenueCat
+2
MetaCTO
+2

MVP için tahmin:

İlk dönemde: Stripe + native store billing ile manual yönetim.

Scale dönemi: RevenueCat ile bütün platformlarda subscription unify.

2.6. Push Notification Servisi (Opsiyonel)
OneSignal Tekrar

Ücretsiz plan: unlimited mobile push, 10k web push/email. 
OneSignal
+1

Ücretli plan: ~19$/ay Growth. 
OneSignal

MVP için Expo Push yeterli; growth aşamasında OneSignal’a geçmek push marketing için güçlü olur.

2.7. AI Servisleri (Hikaye, Görsel, Video, Ses)

Kategori ve sağlayıcı bazlı düşünelim:

1) Metin (AI Fantasy Story)

OpenAI API (GPT-4.1 vs 4.1-mini vs 5.x)

Fiyat: token bazlı; model ve bölgeye göre değişiyor, ama genelde mini modeller çok ucuz, büyük modeller daha pahalı. 
OpenAI
+1

MVP için: gpt-4.1-mini veya benzeri “küçük ama iyi” bir model maliyet açısından mantıklı.

2) Görsel Üretim (Fantazi görseller, avatar mod vb.)

Stable Diffusion tabanlı servisler (Stability AI)

Kredi bazlı pricing; Ağustos 2025’te fiyat artışı duyurdular, usage kredisi modeline göre çalışıyor. 
Stability AI

Alternatif: OpenAI Image API, Midjourney (user-facing, API’siz).

3) Video Üretim (Mini AI Video)

Runway, Pika, Luma AI türü servisler – hepsinin usage-based, dakika/fps bazlı fiyat modeli var (genelde saniye/dakika başına cent’ler düzeyinde).

4) Ses (TTS/ASMR işleme)

TTS için: ElevenLabs / OpenAI TTS

ASR için: OpenAI Whisper veya alternatifi. 
OpenAI

MVP için tahmini AI maliyeti:

Başlangıçta düşük hacimde:

20–50$/ay bandı (deneme & ilk kullanıcılar).

Scale olduğunda: usage bazlı olarak aylık yüzlerce dolara çıkabilir, ama bu zaten gelirle birlikte artacağı için COGS kalemi olarak planlanacak.

2.8. Analytics & Error Tracking Maliyeti

Sentry:

MVP için free plan yeterli (5k error event). 
Sentry
+1

Scale olduğunda Team plan: 26$/ay+ 
Sentry

PostHog:

Generous free tier; event sayısı arttıkça usage-based faturalar geliyor. 
posthog.com
+1

3. Özet – MVP Seviyesi Tahmini Aylık Maliyet Bandı

Bu tamamen kabaca bir tahmin; gerçek rakam, kullanıcı sayısı + media süresi + AI call sayısına göre değişir.

MVP (Beta, birkaç yüz kullanıcı, düşük video/AI trafiği):

Kalem	Tahmini Aylık
Supabase (Free / Pro)	0 – 25$
Expo EAS (Free / Starter)	0 – 19$
Mux (Free Plan)	0$
LiveKit (Build Plan)	0$
Stripe / Iyzico	Sadece komisyon (ciroya bağlı)
AI (OpenAI + imaging)	20–50$
Analytics (Firebase + Sentry Free)	0$
Push (Expo / OneSignal Free)	0$

Toplam MVP bandı:
👉 ~20–100$/ay (gelir + trafik arttıkça yukarı çıkacak)