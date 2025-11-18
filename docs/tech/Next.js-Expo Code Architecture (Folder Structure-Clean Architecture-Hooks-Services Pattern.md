🏗️ İPELYA – Kod Mimarisi & Klasör Yapısı (Next.js + Expo + Supabase)
0. Genel Yaklaşım

Monorepo (Turborepo veya pnpm workspace) kullanıyoruz.

Tek repo içinde:

apps/mobile → Expo (React Native)

apps/web → Next.js

packages/ → ortak kodlar (UI, hooks, types, services)

Dil: TypeScript

Stil:

Mobil: Native components + design system

Web: TailwindCSS + shadcn/ui

Amaç:
Bir kez yaz → hem web hem mobile tarafında mantığı paylaş.

1. Monorepo Yapısı
ipelya/
├─ apps/
│  ├─ mobile/        # Expo React Native App
│  └─ web/           # Next.js App (creator panel, admin, landing)
│
├─ packages/
│  ├─ ui/            # Ortak UI bileşenleri (buton, modal, card vs.)
│  ├─ api/           # API clientlar, request layer, typed endpoints
│  ├─ supabase/      # Supabase client ve helpers
│  ├─ config/        # Ortak config (env, constants)
│  ├─ types/         # Ortak TypeScript tipleri (DB, DTO, enums)
│  ├─ hooks/         # Ortak React hooks (auth, profile, coins)
│  └─ utils/         # Yardımcı fonksiyonlar (date, format, validator)
│
├─ .github/
│  └─ workflows/     # CI/CD (lint, test, build)
│
├─ turbo.json / nx.json
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md


İleride istersen apps/admin diye ayrı bir sadece admin paneli de açabiliriz.

2. apps/mobile – Expo React Native Mimarisi

Expo tarafında expo-router kullanarak file-based routing ile modern bir yapı kuruyoruz.

2.1. Klasör Yapısı
apps/mobile/
├─ app/
│  ├─ _layout.tsx           # Root layout (navigation shell)
│  ├─ index.tsx             # Ana ekran (Home)
│  ├─ auth/
│  │  ├─ login.tsx
│  │  ├─ register.tsx
│  │  └─ onboarding.tsx
│  ├─ profile/
│  │  ├─ index.tsx          # Profil ana sayfa
│  │  ├─ shadow.tsx         # Shadow profile giriş ekranı (PIN / FaceID)
│  │  └─ edit.tsx
│  ├─ creator/
│  │  ├─ dashboard.tsx
│  │  ├─ upload.tsx
│  │  ├─ schedule.tsx
│  │  └─ revenue.tsx
│  ├─ feed/
│  │  ├─ index.tsx          # Real feed
│  │  └─ shadow.tsx         # Shadow feed
│  ├─ fantasy/
│  │  ├─ index.tsx          # AI Fantasy Generator UI
│  │  └─ detail/[id].tsx
│  ├─ chat/
│  │  ├─ index.tsx          # DM list
│  │  └─ [id].tsx           # DM detay
│  ├─ live/
│  │  ├─ index.tsx          # canlı yayın keşfi
│  │  └─ room/[id].tsx      # birebir görüntülü sohbet
│  └─ settings/
│     ├─ index.tsx
│     └─ security.tsx       # anti-ss bilgiler, privacy ayarları
│
├─ src/
│  ├─ components/           # app'e özel RN componentleri
│  ├─ hooks/                # mobile'a spesifik hooks (keyboard, device)
│  ├─ screens/              # eğer “screen component” patterni istersek
│  ├─ store/                # Zustand store'lar
│  │  ├─ auth.store.ts
│  │  ├─ profile.store.ts
│  │  ├─ shadow.store.ts
│  │  ├─ coins.store.ts
│  │  └─ live.store.ts
│  ├─ services/             # mobile-specific servisler
│  │  ├─ notifications.ts
│  │  ├─ device.ts
│  │  └─ antiScreenshot.ts
│  └─ theme/
│     ├─ colors.ts
│     ├─ spacing.ts
│     └─ typography.ts
│
└─ app.config.ts / expo-env

2.2. Veri Yönetimi

Server state: @tanstack/react-query

feed listeleri

creator içerikleri

AI sonuçları

jeton & ekonomi

Client state: zustand

auth session

shadow mode

aktif canlı yayın bilgisi

UI modları (dark mode, bottom sheet vs.)

3. apps/web – Next.js (App Router) Mimarisi

Web tarafı, hem creator dashboard, hem admin panel, hem de landing site için kullanılır.

3.1. Klasör Yapısı
apps/web/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx           # Landing
│  │  ├─ pricing/
│  │  │  └─ page.tsx
│  │  └─ legal/
│  │     ├─ privacy/page.tsx
│  │     └─ terms/page.tsx
│  │
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx
│  │  └─ reset-password/page.tsx
│  │
│  ├─ (creator)/
│  │  ├─ dashboard/page.tsx
│  │  ├─ content/page.tsx
│  │  ├─ schedule/page.tsx
│  │  ├─ earnings/page.tsx
│  │  └─ settings/page.tsx
│  │
│  ├─ (admin)/
│  │  ├─ overview/page.tsx
│  │  ├─ users/page.tsx
│  │  ├─ content/page.tsx
│  │  └─ reports/page.tsx
│  │
│  ├─ api/                  # (isteğe bağlı, server actions / route handlers)
│  │  ├─ stripe/webhook/route.ts
│  │  └─ dmca/notify/route.ts
│  │
│  └─ layout.tsx
│
├─ src/
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ dashboard/
│  │  ├─ forms/
│  │  └─ charts/
│  ├─ lib/
│  │  ├─ supabaseClient.ts  # (web için)
│  │  ├─ auth.ts            # server side auth helpers
│  │  └─ rls-helpers.ts
│  ├─ hooks/
│  │  ├─ useCreatorStats.ts
│  │  └─ useDMCAReports.ts
│  ├─ styles/
│  │  ├─ globals.css
│  │  └─ tailwind.config.ts
│  └─ config/
│     └─ nav.ts
│
└─ next.config.mjs

3.2. UI Teknolojisi

TailwindCSS + shadcn/ui

Charts için: recharts veya nivo

Creator gelir paneli, DMCA paneli, içerik istatistikleri vs. web’de çok daha rahat gösterilir.

4. packages/supabase – Ortak Supabase Katmanı

Burada mobil + web tarafından ortak kullanılan Supabase client’ı ve helper fonksiyonlar bulunur.

packages/supabase/
├─ src/
│  ├─ client.ts           # createSupabaseClient(env) 
│  ├─ auth.ts             # ortak login/logout helpers
│  ├─ queries/
│  │  ├─ profiles.ts
│  │  ├─ creator.ts
│  │  ├─ content.ts
│  │  ├─ coins.ts
│  │  └─ messages.ts
│  ├─ mutations/
│  │  ├─ buyPPV.ts
│  │  ├─ buyCoins.ts
│  │  ├─ sendMessage.ts
│  │  └─ toggleShadowMode.ts
│  └─ index.ts
├─ package.json
└─ tsconfig.json


Amaç: API endpoint mantığını burada toplamak, hem Next.js hem Expo tarafında tekrar kullanmak.

5. packages/types – Ortak Tipler
packages/types/
├─ src/
│  ├─ db.ts         # Supabase auto-generated types (table, view)
│  ├─ api.ts        # DTO’lar
│  ├─ enums.ts      # gender, vibe, content_type vs.
│  └─ index.ts
└─ package.json


Supabase CLI ile DB şemasından otomatik tip çekip buraya koymak mantıklı.

6. packages/api – Servis Katmanı (Service Layer)

Bu paket “thin API client” gibi düşünülmeli. Örneğin:

packages/api/
├─ src/
│  ├─ fantasy/
│  │  ├─ generateFantasy.ts
│  ├─ payments/
│  │  ├─ createCheckoutSession.ts
│  │  └─ handleWebhook.ts
│  ├─ live/
│  │  ├─ requestLivekitToken.ts
│  ├─ security/
│  │  ├─ logScreenshot.ts
│  └─ index.ts
└─ package.json


Mobil’den ve web’den:

import { generateFantasy } from "@ipelya/api/fantasy";


gibi kullanılır.

7. packages/hooks – Ortak Hooks

Burada hem mobile hem web için kullanılabilecek mantık bazlı hooks olacak:

packages/hooks/
├─ src/
│  ├─ useAuth.ts             # supabase auth + profile
│  ├─ useShadowProfile.ts    # shadow mod açık mı, geçiş gibi
│  ├─ useCoins.ts            # bakiye, satın alma, state
│  ├─ useCreatorContent.ts
│  ├─ useFantasyGenerator.ts
│  ├─ useASMRMarket.ts
│  └─ index.ts
└─ package.json


Mobile veya web’de:

const { user, profile, shadowMode, toggleShadow } = useShadowProfile();

8. packages/ui – Ortak UI Kit

Tamamen opsiyonel ama tavsiyem:

Bazı “primitive” UI parçaları hem RN hem web tarafında kullanılabilir (ikon set, renkler, tipografi).

Ama React Native ile web UI komponentleri tam olarak paylaşılmayacağı için bu paket daha çok:

icon config

renk paleti

spacing değişkenleri

svg ikon seti
şeklinde kullanılabilir.

9. Servis Katmanları: AI / Media / Payment

Bunlar da genelde packages/api altında organize edilir ama istersen:

packages/services/
├─ src/
│  ├─ ai/
│  │  ├─ openai.ts
│  │  ├─ image.ts
│  │  └─ video.ts
│  ├─ media/
│  │  ├─ mux.ts
│  │  └─ livekit.ts
│  ├─ payments/
│  │  ├─ stripe.ts
│  │  ├─ iyzico.ts
│  │  └─ revenuecat.ts
│  └─ index.ts
└─ package.json


Bu sayede Edge Function’larda bile aynı helper’ları kullanırsın.

10. Clean Architecture Katmanları (Mantık)

Mantığı şu şekilde düşünebilirsin:

UI Layer (apps/mobile & apps/web)

Ekranlar, layoutlar, componentler

Hooks Layer (packages/hooks)

Use-case bazlı business mantığı

Service Layer (packages/api, packages/services, packages/supabase)

API çağrıları, DB query’leri, Supabase işlemleri

Domain Layer (packages/types)

Tipler, domain modelleri, enumlar

Bu şekilde ayrıştırınca:

Yeni bir “modül” eklediğinde:

Tiplerini → packages/types’a

DB query’lerini → packages/supabase/queries’e

business mantığını → packages/hooks’a

UI ekranını → apps/mobile ve/veya apps/web içine koyuyorsun.

11. Örnek: Shadow Mode Akışı (Kod Perspektifi)

Hook:

// packages/hooks/src/useShadowProfile.ts
import { useState, useEffect } from "react";
import { supabaseClient } from "@ipelya/supabase";

export function useShadowProfile() {
  const [shadowMode, setShadowMode] = useState(false);

  const enableShadowMode = async (pin: string) => {
    // Edge Function'a istek: pin doğrula + JWT claim update
    const { data, error } = await supabaseClient.functions.invoke("enable-shadow-mode", {
      body: { pin },
    });
    if (!error) setShadowMode(true);
  };

  const disableShadowMode = async () => {
    await supabaseClient.functions.invoke("disable-shadow-mode", {});
    setShadowMode(false);
  };

  return { shadowMode, enableShadowMode, disableShadowMode };
}


Mobile Ekran:

// apps/mobile/app/profile/shadow.tsx
import { useShadowProfile } from "@ipelya/hooks";

export default function ShadowScreen() {
  const { shadowMode, enableShadowMode } = useShadowProfile();
  // UI: PIN input + FaceID option vs.
}

12. CI/CD Kısa Not

Lint & Test:

Root’ta turbo lint / turbo test

Build Pipelines:

apps/web → Next.js (Vercel/GCP)

apps/mobile → EAS Build

Edge Functions:

Supabase CLI ile deploy scriptleri