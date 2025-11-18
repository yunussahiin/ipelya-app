#️⃣ İPELYA — Naming Convention & Kod Standartları (Supabase + Edge Functions + Next.js + Expo)

Bu bölüm; database, tablo, kolon, endpoint, edge function, dosya isimleri, değişken adları, React Native/Next.js klasörleri, TypeScript interface’leri gibi tüm kod standartlarını netleştirir.

Bu standarta sahip olmak:
✔ Ekibin ölçeklendikçe kodu korumasını kolaylaştırır
✔ Veri tabanı ile API’nin otomatik uyumlu olmasını sağlar
✔ Junior → Senior tüm ekibin aynı dili konuşmasını sağlar
✔ Edge Functions, Supabase, Frontend arasında naming tutarsızlığı olmaz

1.2. Case / Format
Format	Nerede Kullanılır	Örnek
snake_case	PostgreSQL tablo + kolon	creator_content, ppv_purchases
kebab-case	Dosya adları (React/Next.js)	content-card.tsx
camelCase	JS/TS değişken & fonksiyon	getCreatorContent()
PascalCase	Component, class, enum	CreatorCard, AIRequestType
1.3. RLS Politikaları

İsimler açıklayıcı ve kısa olmalı
Ör:

policy "owner_select"
policy "creator_update"
policy "subscriber_access"
policy "shadow_isolation"
policy "ppv_access"

🗄️ 2) DATABASE NAMING CONVENTION (Supabase PostgreSQL)
✔ Tüm tablolar snake_case
✔ Tüm kolonlar snake_case
✔ Primary keys → id
✔ Foreign keys → {table_name}_id
✔ Enumlar → type, status, visibility, role gibi alanlarda
2.1 Tablo İsimleri
Modül	Tablo	Not
User	profiles	Tek tablo, real+shadow barındırıyor
Creator	creator_content	Media içerikleri
Monetization	creator_revenue	Tüm gelirler
PPV	ppv_purchases	Tekil satış
ASMR	asmr_audio, asmr_purchases	
AI	ai_fantasy_requests, ai_fantasy_outputs	
Messaging	messages	No-trace
Security	anti_screenshot_logs	
Firewall	social_firewall_rules	
Live	live_sessions, live_payments	
DMCA	dmca_reports, dmca_actions	

Bu tablo isimleri uluslararası pazar için kusursuz.

2.2 Kolon İsimleri

Her tablo aynı şablonu takip eder:

id (uuid)
creator_profile_id
user_profile_id
content_id
created_at
updated_at
deleted_at (opsiyonel)
status
type
visibility
price
media_url
thumbnail_url

2.3 Enum İsimleri

Enum isimleri İngilizce ve küçük harfli snake_case:

content_type: image, video, audio, ai
profile_type: real, shadow
visibility: public, subscribers, ppv
event_type: screenshot, screen_record
gender: male, female, lgbt
vibe: cute, mysterious, dominant, romantic ...

⚙️ 3) EDGE FUNCTION NAMING STANDARDS

Edge fonksiyonlar her zaman eylemi anlatmalı.

3.1 Fonksiyon çalışma formatı
/functions/{action}-{object}

Örnekler:
Amaç	Doğru	Yanlış
Jeton satın alma	buy-coins	coins
PPV satın alma	buy-ppv	getPPV
Fantazi üretimi	generate-fantasy	fantasy1
Shadow mod açma	enable-shadow-mode	shadowpin
Log screenshot	log-screenshot	logss
LiveKit token	get-livekit-token	lktoken
DMCA tarama	dmca-scan	scancontent
3.2 Edge Function dosya yapısı

Bir Edge Function:

functions/generate-fantasy/
   index.ts
   schema.ts         # Zod doğrulama
   openai.ts         # (opsiyonel) AI helper
   supabase.ts       # (opsiyonel) DB helper

💻 4) FRONTEND (Expo + Next.js) NAMING CONVENTIONS
4.1 Dosya isimleri

React componentler:

UserCard.tsx
CreatorStatsChart.tsx
ShadowModeScreen.tsx


Routes:

feed/
   index.tsx
   shadow.tsx
creator/
   upload.tsx
   dashboard.tsx

4.2 Değişken & Fonksiyon isimleri (camelCase)
const [shadowMode, setShadowMode] = useState(false);

function fetchCreatorContent(id: string) { ... }
async function buyCoins(packageId: string) { ... }
const handlePPVPurchase = () => {};

4.3 Zustand State Stores Naming

Her store’ın adı xxx.store.ts olur.

auth.store.ts
profile.store.ts
shadow.store.ts
coins.store.ts
live.store.ts


Store içi state:

shadowMode: boolean;
enableShadowMode(): Promise<void>;
disableShadowMode(): Promise<void>;

4.4 API Service Naming

packages/api içinde fonksiyonlar:

getCreatorContent()
generateFantasy()
buyPPV()
buyCoins()
logScreenshot()
requestLivekitToken()

4.5 Hooks Naming

Custom hooks her zaman use ile başlar:

useAuth()
useShadowProfile()
useCreatorContent()
useFantasyGenerator()
useCoins()
useASMRMarket()

📦 5) TYPE & INTERFACE NAMING
5.1 Types → PascalCase
type CreatorContent = {
  id: string;
  mediaUrl: string;
  ...
}

5.2 API DTO'ları
interface BuyPPVRequest {
  contentId: string;
}

interface FantasyRequestDTO {
  type: "story" | "image" | "video";
  prompt: string;
}

5.3 Supabase tipleri

Supabase CLI ile otomatik generate:

Database["public"]["Tables"]["creator_content"]

🔐 6) SECURITY NAMING STANDARDS
6.1 RLS Policy İsimleri

kısa

eylemi anlatmalı

tabloyu belirtmeye gerek yok

Örn:

"creator_view"
"creator_update"
"owner_select"
"owner_update"
"shadow_isolation"
"subscriber_access"
"ppv_access"

6.2 Edge Function Event Logs

audit_logs:

action: 'login' | 'shadow_mode_enable' | 'ppv_purchase' | 'dmca_request'
metadata: JSON

🌐 7) URL & ENDPOINT Naming Convention
7.1 API Endpoints (REST Format)
POST /shadow/enable
POST /shadow/disable

POST /coins/buy
POST /ppv/buy

POST /asmr/upload
POST /asmr/buy

POST /ai/fantasy
GET  /ai/fantasy/:id

POST /messages/send
GET  /messages/:id

POST /security/screenshot
POST /firewall/upload-contacts

POST /live/request-token
POST /live/pay

🧠 8) AI İsimlendirme Standartları
Fantazi türleri:
story
image
video
fantasy_scenario
vibe_style
avatar_mode

AI sonuç kayıtları:
ai_fantasy_requests
ai_fantasy_outputs
embedding_vector

🧩 9) MEDIA NAMING STANDARDS (MUX + Supabase Storage)
Storage klasörleri
creator-media/
shadow-content/
asmr/
ai-content/
avatars/
thumbnails/


Dosya isimleri:

{uuid}.jpg
{uuid}.mp4
{uuid}-thumb.jpg
{uuid}-asmr.mp3

🎯 10) CONVENTION ÖZETİ – “Golden Rules”


DB → snake_case, Code → camelCase, Components → PascalCase

Edge functions → action-object adı kullanılır

React ekranları → tekil, anlamlı isim

hooks useXxx ile başlar

Zod ile schema validation tüm Edge Functions’ta zorunlu

AI modülleri için ayrı klasör & namespace

Media dosyaları UUID ile saklanır

Supabase RLS policy isimleri kısa ve net

Her modülün servis katmanı ayrı olmalı (payments, ai, media, etc.)