apps/mobile/
├─ app/
│  ├─ _layout.tsx              # Root layout (tab/bottom nav vs.)
│  ├─ index.tsx                # Ana ekran (home / feed)
│  │
│  ├─ (auth)/
│  │  ├─ login.tsx
│  │  ├─ register.tsx
│  │  └─ onboarding.tsx
│  │
│  ├─ (profile)/
│  │  ├─ index.tsx             # Profil ana ekranı
│  │  ├─ edit.tsx
│  │  └─ shadow-pin.tsx        # Shadow profil açılış (PIN)
│  │
│  ├─ (feed)/
│  │  ├─ index.tsx             # Real feed
│  │  └─ shadow.tsx            # Shadow feed
│  │
│  ├─ (creator)/
│  │  ├─ dashboard.tsx
│  │  ├─ upload.tsx
│  │  ├─ schedule.tsx
│  │  └─ revenue.tsx
│  │
│  ├─ (fantasy)/
│  │  ├─ index.tsx             # AI Fantasy generator ekranı
│  │  └─ [id].tsx              # Üretilmiş fantazi detay
│  │
│  ├─ (asmr)/
│  │  ├─ index.tsx
│  │  └─ [id].tsx
│  │
│  ├─ (chat)/
│  │  ├─ index.tsx             # DM listesi
│  │  └─ [id].tsx              # DM konuşma ekranı
│  │
│  ├─ (live)/
│  │  ├─ index.tsx             # Canlı yayın / birebir liste
│  │  └─ room/[id].tsx         # LiveKit room ekranı
│  │
│  └─ (settings)/
│     ├─ index.tsx
│     └─ privacy.tsx           # Shadow, anti-ss, no-trace ayarları
│
├─ src/
│  ├─ components/
│  │  ├─ ui/                   # RN UI bileşenleri (Button, Card, Sheet…)
│  │  ├─ cards/
│  │  ├─ layout/
│  │  └─ forms/
│  │
│  ├─ store/                   # Zustand store'lar
│  │  ├─ auth.store.ts
│  │  ├─ profile.store.ts
│  │  ├─ shadow.store.ts
│  │  ├─ coins.store.ts
│  │  └─ live.store.ts
│  │
│  ├─ hooks/                   # Mobile spesifik hooks (keyboard, device vs.)
│  ├─ services/                # Notifications, device, anti-screenshot
│  ├─ lib/                     # Supabase client wrapper vs.
│  ├─ theme/                   # renkler, spacing, typography
│  └─ types/                   # Mobil spesifik tipler (gerekirse)
│
├─ assets/                     # ikonlar, fontlar, görseller
├─ app.config.ts
└─ eas.json


Mobil Tarafında Kullanılacak Temel Paketler
	•	expo, react-native, expo-router
	•	@tanstack/react-query
	•	zustand
	•	@supabase/supabase-js
	•	expo-secure-store
	•	expo-notifications
	•	react-native-reanimated
	•	react-native-gesture-handler
	•	livekit-react-native (veya uygun client)
	•	UI için: react-native-svg, react-native-safe-area-context vb.