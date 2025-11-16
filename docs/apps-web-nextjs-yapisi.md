apps/web (NEXT.JS @LATEST) YAPISI

Proje, npx create-next-app@latest web ile oluşturulacak. Ayarlar:
	•	TypeScript: YES
	•	ESLint: YES
	•	TailwindCSS: YES
	•	src/ directory: YES
	•	App Router: YES
	•	Import alias: @/*

    apps/web/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx            # Landing / marketing sayfası
│  │  │  ├─ pricing/page.tsx
│  │  │  └─ legal/
│  │  │     ├─ privacy/page.tsx
│  │  │     └─ terms/page.tsx
│  │  │
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ register/page.tsx
│  │  │  └─ reset-password/page.tsx
│  │  │
│  │  ├─ (creator)/
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ content/page.tsx
│  │  │  ├─ schedule/page.tsx
│  │  │  ├─ earnings/page.tsx
│  │  │  └─ settings/page.tsx
│  │  │
│  │  ├─ (admin)/
│  │  │  ├─ overview/page.tsx
│  │  │  ├─ users/page.tsx
│  │  │  ├─ content/page.tsx
│  │  │  └─ reports/page.tsx
│  │  │
│  │  ├─ api/                   # İhtiyaç olursa route handlers
│  │  │  ├─ stripe/webhook/route.ts
│  │  │  └─ dmca/notify/route.ts
│  │  │
│  │  └─ layout.tsx
│  │
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ ui/
│  │  ├─ charts/
│  │  └─ tables/
│  │
│  ├─ lib/
│  │  ├─ supabaseClient.ts      # Web için supabase client
│  │  ├─ auth.ts                # server-side auth helper
│  │  ├─ rls.ts                 # shadow_mode & profile id context
│  │  └─ api.ts                 # web tarafı için extra servisler
│  │
│  ├─ hooks/
│  ├─ styles/
│  │  ├─ globals.css
│  │  └─ tailwind.css
│  └─ config/
│     └─ nav.ts
│
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
└─ package.json