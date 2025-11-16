5.1 packages/types
packages/types/
├─ src/
│  ├─ db.ts              # Supabase’tan generate edilen DB tipleri
│  ├─ profile.ts         # Profile, Creator, Shadow tipleri
│  ├─ content.ts         # CreatorContent, Theme, PPV tipleri
│  ├─ economy.ts         # Coin, Transaction, Revenue, Payout tipleri
│  ├─ ai.ts              # FantasyRequest, FantasyOutput vb.
│  ├─ messaging.ts
│  ├─ live.ts
│  └─ index.ts
└─ package.json

5.2 packages/api

Mobil & web için ortak servis katmanı.
Supabase Edge Functions + REST benzeri endpointlerin hepsi burada çağrılır.

packages/api/
├─ src/
│  ├─ auth.ts            # login, logout, signup helpers
│  ├─ shadow.ts          # enable/disable shadow mode
│  ├─ fantasy.ts         # generate fantasy, get outputs
│  ├─ coins.ts           # buy coins, get balance
│  ├─ ppv.ts             # buy PPV, get purchases
│  ├─ asmr.ts            # asmr list + satın alma
│  ├─ live.ts            # LiveKit token, live payments
│  ├─ firewall.ts        # rehber upload, firewall rules
│  ├─ screenshot.ts      # screenshot log event gönderimi
│  ├─ dmca.ts            # DMCA rapor işlemleri
│  └─ index.ts
└─ package.json

5.3 packages/hooks

Hem web hem mobilde kullanabileceğimiz hook’lar:

packages/hooks/
├─ src/
│  ├─ useAuth.ts             # Supabase auth + profile bağlama
│  ├─ useShadowMode.ts       # Shadow mod state + toggle
│  ├─ useCoins.ts            # bakiye, satın alma
│  ├─ useFantasy.ts          # AI fantasy ile entegrasyon
│  ├─ useCreatorStats.ts     # creator gelir, istatistikler
│  └─ index.ts
└─ package.json

5.4 packages/utils
	•	tarih formatlama
	•	price/coin formatlama
	•	hata handling
	•	validation yardımcıları

   packages/utils/
├─ src/
│  ├─ format.ts
│  ├─ date.ts
│  ├─ error.ts
│  └─ index.ts
└─ package.json

5.5 packages/config

Sabitler, environment, zod şemaları:
packages/config/
├─ src/
│  ├─ env.ts              # public/private env map
│  ├─ constants.ts        # coin package, url, limits
│  ├─ routes.ts           # front-end route isimleri
│  └─ index.ts
└─ package.json


6. supabase/ YAPISI
supabase/
├─ functions/
│  ├─ enable-shadow-mode/
│  │  ├─ index.ts
│  │  └─ schema.ts
│  ├─ buy-coins/
│  ├─ buy-ppv/
│  ├─ generate-fantasy/
│  ├─ log-screenshot/
│  ├─ upload-contacts/
│  ├─ get-livekit-token/
│  ├─ dmca-scan/
│  └─ stripe-webhook/
│
├─ migrations/             # SQL migration dosyaları
├─ seed.sql
└─ supabase.toml

7. GLOBAL NPM / PNPM SCRIPTLERİ

Kök package.json içerisinde (örnek):

{
  "scripts": {
    "dev:mobile": "turbo dev --filter=mobile",
    "dev:web": "turbo dev --filter=web",
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "supabase:types": "bash ./scripts/generate-types.sh"
  }
}


8. KOD STANDARTLARI (ÖZET)
	•	DB tablo & kolon: snake_case
	•	TypeScript tip & interface: PascalCase
	•	Değişken ve fonksiyon: camelCase
	•	React component isimleri: PascalCase
	•	Edge function isimleri: kebab-case (örn: enable-shadow-mode)

⸻
