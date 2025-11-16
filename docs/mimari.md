# İPELYA MONOREPO PROJE DOKÜMANTASYONU

Bu doküman, **Windsurf / AI coding assistant** için hazırlanmış, İpelya projesinin tam teknik kurulum ve klasör yapısı rehberidir.

Amaç:  
- Tek monorepo içinde: **Mobil (Expo React Native)** + **Web (Next.js)** + **Backend (Supabase Edge Functions)**  
- Ortak paketler: `types`, `api`, `hooks`, `utils`, `config`  
- Kolay geliştirme, test ve deploy süreci

---

## 1. TEKNOLOJİ STACKİ

### 1.1 Genel

- Monorepo: **Turborepo** veya **pnpm workspaces**
- Dil: **TypeScript** (hem web, hem mobil, hem backend)
- Versiyon kontrol: **git**

### 1.2 Mobil

- **Expo + React Native**
- **expo-router** (file-based navigation)
- **React Query (@tanstack/react-query)** → server state
- **Zustand** → client state
- **Expo Secure Store** → token, PIN, shadow mode bilgisi
- **Expo Notifications** → push
- **LiveKit client** → birebir görüntülü görüşme
- **Supabase JS client** → auth, db, realtime, storage

### 1.3 Web

- **Next.js (latest, `npx create-next-app@latest`)**
- App Router kullanımı (`app/` dizini)
- **TypeScript**
- **TailwindCSS** +  shadcn/ui latest 
- **React Query** veya Next’in **Server Actions** yaklaşımı
- **Supabase JS client** (server & client side)

### 1.4 Backend / Infra

- **Supabase**
  - PostgreSQL + RLS
  - Auth
  - Storage
  - Realtime
  - Edge Functions
  - pgvector
- **Edge Functions** ile:
  - Shadow Mode
  - PPV satın alma
  - Jeton ekonomisi
  - AI Fantasy Engine
  - Screenshot logging
  - Social firewall
  - LiveKit token
  - DMCA scan
- Media:
  - **Mux** (video upload & playback)
  - **LiveKit** (video chat)
- AI:
  - OpenAI (text, image)
  - Diğer video/voice servisleri (Pika, Runway vb.) entegrasyona uygun yapı

---

## 2. MONOREPO DİZİN YAPISI

Proje kök dizini: `ipelya/`

```bash
ipelya/
├─ apps/
│  ├─ mobile/           # Expo React Native uygulaması (iOS + Android)
│  └─ web/              # Next.js web uygulaması (creator panel + admin)
│
├─ packages/
│  ├─ api/              # Shared API client & servisler (mobile + web)
│  ├─ types/            # Ortak TypeScript tipleri (DB, DTO, enum vs.)
│  ├─ hooks/            # Ortak React hooks (auth, coins, shadow mode)
│  ├─ utils/            # Genel yardımcı fonksiyonlar
│  ├─ config/           # Ortak config, constants, zod şemaları
│  └─ ui/               # Ortak UI bileşenleri (ikon, theme, primitive'ler)
│
├─ supabase/
│  ├─ migrations/       # SQL migration dosyaları
│  ├─ functions/        # Edge Functions (TS / Deno)
│  └─ seed.sql          # Örnek başlangıç verileri (env'e göre opsiyonel)
│
├─ scripts/
│  ├─ generate-types.sh # Supabase → TS type generator scripti
│  ├─ migrate.sh        # Migration çalıştırma scripti
│  ├─ deploy-fns.sh     # Edge Functions deploy scripti
│  └─ reset-local.sh    # Local env reset scripti
│
├─ turbo.json           # Turborepo config (veya pnpm workspace configleri)
├─ package.json
├─ pnpm-workspace.yaml  # pnpm kullanılacaksa
└─ README.md / PROJECT_SETUP.md




## 10. WEB (Next.js) TARAFINDA SHADCN/UI KULLANIMI

Web uygulamasında modern bir dashboard ve creator panel geliştirmek için 
**shadcn/ui** kullanılacaktır.

### 10.1 Shadcn Kurulumu

`apps/web` klasörüne girildikten sonra:

```bash
cd apps/web
npx shadcn-ui@latest init

Bu işlem:
	•	components/ui/ klasörünü oluşturur
	•	Tailwind yapılandırmasını tamamlar
	•	Global CSS ayarlarını yapar
	•	Theme (radius, fonts, colors) yapılandırır

10.2 Gerekli Temel Componentlerin Eklenmesi

Projede sık kullanılacak UI bileşenleri önceden eklenmelidir.

npx shadcn-ui add button
npx shadcn-ui add card
npx shadcn-ui add input
npx shadcn-ui add textarea
npx shadcn-ui add dropdown-menu
npx shadcn-ui add dialog
npx shadcn-ui add sheet
npx shadcn-ui add table
npx shadcn-ui add toast
npx shadcn-ui add form
npx shadcn-ui add badge
npx shadcn-ui add calendar

10.3 Web Project UI Dizini (Shadcn)

apps/web/src/components/
│
├─ ui/                     # shadcn tarafından üretilen atomic componentler
│   ├─ button.tsx
│   ├─ card.tsx
│   ├─ table.tsx
│   ├─ dialog.tsx
│   ├─ form.tsx
│   └─ ... diğer atomic UI
│
├─ layout/                 # layout componentleri
│   ├─ dashboard-layout.tsx
│   ├─ creator-sidebar.tsx
│   └─ admin-sidebar.tsx
│
├─ charts/                 # gelir grafikleri, içerik grafikleri (recharts veya chart.js)
├─ tables/                 # Creator earnings table, PPV table
└─ forms/                  # Zod + React Hook Form kullanılan form yapıları

10.4 Shadcn ile Geliştirilecek Ana Modüller
	•	Creator Dashboard
	•	Revenue Card
	•	Insights Chart
	•	Scheduled Content Table
	•	Subscription Stats Badge
	•	Content Upload Flow
	•	Upload Dialog
	•	Progress indicator
	•	Success toast
	•	ASMR Paneli
	•	Audio upload form
	•	Category dropdown
	•	Pricing inputs
	•	PPV Yönetimi
	•	Table + dropdown actions (edit/delete)
	•	Admin Panel
	•	User table
	•	Content moderation panel
	•	DMCA reports table

10.5 Tasarım Standartları
	•	Tüm web UI, shadcn + Tailwind ile geliştirilecektir.
	•	Renk paleti, tailwind.config.ts içinde global olarak tanımlanacaktır.
	•	Spacing, typography, border-radius gibi tüm primitive tasarımlar shadcn theme yapısı üzerinden yönetilecektir.
	•	UI componentleri atomic → reusable → extendable olmalıdır.

