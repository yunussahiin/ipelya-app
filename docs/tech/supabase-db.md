#️⃣ İpelya – Supabase Full Utilization Blueprint (2025)

AŞIRI Detaylı, Ürün + Teknik + Güvenlik için optimize

Supabase’i burada sadece bir veritabanı değil, komple backend altyapının %70’ini kaldıran bir platform olarak kullanıyoruz:

Auth

RLS güvenliği

Realtime

Storage

Edge Functions (serverless logic)

pgvector (AI embedding / recommendation)

Triggers & Functions

Cron Jobs

Postgres DB

Admin panel

Monitoring

Logs + observability

Row-level encryption

Her biri İpelya’nın farklı modülünü karşılıyor.

Aşağıda tek tek hepsini “İpelya’da hangi modülü çözüyor?” şeklinde anlatıyorum.

🧱 1) AUTH — Çoklu Kimlik + Shadow Profile İçin Supabase Auth

Supabase Auth:

Email/Password

OTP (SMS / Email magic link)

OAuth (gerekirse IG/Twitter)

Device ID tracking

Refresh token rotation

Row-level access policies

İpelya’da kullanımı:

🔐 Dual Identity System (Real Profile + Shadow Profile)

En önemli özellik → Tek kullanıcı = 2 kişilik (2 profile row)
Ama auth tek.

Çözüm:

users tablosu: auth users

profiles tablosu: her user için 2 satır (real + shadow)

RLS:

/shadow_profile flag’i olan satırları default olarak tüm feedlerde exclude ederiz

PIN doğrulaması gelince RLS context ile shadow satırlarına erişim açılır

📲 FaceID / PIN Açılımı

PIN hash → Supabase’de saklanır

secure_profile_mode → session claim içinde tutulur

Session claim değişimi: Supabase Auth → JWT custom claims

🧠 2) DATABASE — PostgreSQL (Supabase) “İpelya DB Spine”

Supabase’in Postgres avantajları:

JSONB + relational hibrit yapı

pgvector (AI embedding)

Full-text search

Triggers + Functions

Generated columns

High concurrency

İpelya kullanım alanları:

🟣 Postgres + pgvector → Vibe Match + AI Recommendations

Her creator ve erkek kullanıcı için:

embedding_appearance (kadın tipi)

embedding_vibe

embedding_behavior

embedding_fantasy_preference

pgvector ile similarity search → öneriler + feed kişiselleştirme

🟢 Fantezi AI Generator Context DB

Kullanıcının geçmiş AI tercihleri

Son 20 fantezi senaryosu

Mood pattern’leri

Behavior scoring

🟠 Creator Ekonomi

Jeton transaction logları

PPV satın alma

Abonelikler

Ödeme bekleyenler

Revenue analytics tablosu

⚡ 3) REALTIME — No-Trace Messaging + Canlı Yayın Event’leri

Supabase Realtime aşağıdaki modülleri çözer:

💬 No-Trace Messaging

Mesajlar DB’de saklanır

RLS: sadece iki kullanıcı erişir

Timer job (cron): 24 saat sonra auto-delete

Realtime: mesajlar anlık akar

anti-screenshot tetiklenince log → creator paneline realtime düşer

📢 Creator Feed Realtime Updates

Yeni içerik yüklendi

Yeni canlı yayın açıldı

Jeton hediye geldi

PPV satın alındı

Hepsi “channel subscription” ile akar.

🗃️ 4) STORAGE — Fotoğraf, Video Thumbnail, ASMR, AI Output

Supabase Storage’ı tam gücüyle kullanıyoruz:

📁 4 Bucket Ayrımı:

creator-media/

Görsel, fotoğraf, basit videolar

asmr/

Ses dosyaları (15–30 sn)

ai-content/

AI foto, mini video output

shadow-content/

Shadow mod için özel içerikler

Ek RLS + kullanıcı izin kontrolü

⛔ Storage Policies (RLS for Files)

Supabase’in en güçlü yönlerinden biri:
storage objeleri bile RLS ile korunabilir.

Örneğin:

Shadow profile → sadece owner erişir

Creator PPV içerik → satın alan kullanıcıya signed URL üret

Canlı yayın kayıtları → sadece creator & admin

🔏 Signed URLs

PPV içerikler için olmazsa olmaz:

Süresi 60 saniye

Tek seferlik kullanım

Kaydı alamayan player

Erişim eski URL’ler otomatik expire

🌐 5) EDGE FUNCTIONS — Anti-Fraud, Payment Sync, AI Trigger

Edge Functions = Supabase’in serverless backend’i.
İpelya’da çok kritik rol oynar.

🔹 Kullanım Senaryoları
1) Ödeme sonrası jeton ekleme (Stripe webhook)

Kullanıcı jeton satın alıyor

Stripe event → Edge Function → DB update

Fraud kontrol

Activity log’a yaz

2) Creator’a ödeme dağıtımı

Haftalık cron

Edge Function çalışır

Creator’ın toplam geliri → ödeme dökümü

Iyzico/Stripe Connect entegrasyonu

3) Anti-fraud & Anti-spam engine

Device ID

IP reputation

Fake card attempt

Çok hızlı jeton harcama → limit koyma

4) AI trigger işlemleri

Kullanıcı AI fantezi istiyor

Edge Function → AI API’ye gidiyor

Sonuç → ai-content bucket’a kaydedilir

5) DMCA bot task scheduler

Edge cron job → saatlik tarama

İhlal loglarını creator paneline yazar

Edge Functions = backend mikro servislerin %60’ını çözer.

📡 6) CRON JOBS — Otomasyon & Silme Prosedürleri

İpelya’daki kritik cron’lar:

1) No-Trace Messaging Auto-Delete

24 saat sonra mesajı sil

Log DB’de tutulur ama kullanıcı görmez

Creator için abuse report’a saklanabilir

2) Subscription Renewal Check

Stripe / Apple / Google subscription senkronizasyonu

3) Creator Haftalık Gelir Dağıtımı
4) Shadow Profile Activity Cleanup

Shadow cache temizleme

Geçici dosyaları silme

5) Anti-Screenshot Log Flush

7 gün sonra blurlog silinir

🧠 7) SERVERSIDE SQL (Triggers + Functions)

Supabase + PostgreSQL triggers = İpelya’nın kara kutusu.

🚀 Önerilen Trigger’lar
1) Jeton Harcama → Creator Gelir Ekleme Trigger

Otomatik işlem:
PPV satın al →
creator_revenue tablosuna insert →
creator_total_balance güncelle

2) Realtime Log Trigger’ları

Mesaj gönderildiğinde:

realtime channels → anlık push

3) Behavior Tracking Trigger

Erkek kullanıcı şu davranışı yaptı:

filtre tıkladı

vibe seçti

creator profiline baktı

→ otomatik embedding güncelle

4) Anti-screenshot flagging trigger

native taraf screenshot algılıyor

API → logs tablosu insert

Supabase function → Creator paneline realtime publish

🔍 8) FULL-TEXT SEARCH — Creator Arama, Kategori, Vibe

Supabase/PG FTS ile:

Creator username

Bio

Vibe tags

İçerik başlıkları

Fantezi temaları

Arama motoru maliyetsiz, hızlı.

🧬 9) PGVECTOR — Vibe Match + Fantasy Match Engine

Bu kısım İpelya’nın en AI özellikli tarafı.

Nerede kullandık?

creator embedding

user behavior embedding

fantasy preference embedding

Amaç

benzersiz kişiselleştirilmiş feed

erkek kullanıcı davranışına göre öneri

vibe matching

fantezi AI input özelleştirmesi

🧷 10) ROW LEVEL SECURITY (RLS) — Gizlilik ve Güvenlik Belkemiği

İpelya’da gizlilik temel özellik olduğu için:

Her tablo → RLS ON

Her satır → user_id bazlı yetkilendirme

Shadow profile → farklı RLS context

PPV içerik → sadece satın alan yetkili

Creator özel içerik → sadece owner + satın alan + admin

Mesaj → sadece sender/receiver

Bu yüzden Supabase → dünyadaki en iyi RLS platformu → İpelya için mükemmel match.

🔎 11) LOGGING + MONITORING

Supabase dashboard’tan:

Query performance

Long-running queries

Realtime logs

Storage requests

Auth events

Edge Function invocation logs

Bunların her biri “anti-fraud” ve “privacy-first” mimari için kritik.

📦 12) Supabase Admin Panel Opsiyonları

Table editor

Storage browser

Policy editor

SQL editor

Logs

Metrics

Backup ve restore

Developer ekibi gerçek bir “custom admin panel” yapmadan hızlı yönetim yapabilir.

🧲 13) Backup, Restore & Migration

Supabase:

Otomatik yedekleme

Tek tıklama restore

Branch mantığı (Preview environments)

Migration script’leri

DevOps overhead → minimum.

🎯 SONUÇ:

Supabase İpelya’nın tüm temel katmanlarını karşılıyor:

Modül	Supabase ile Çözülen
Shadow Profile	Auth + RLS + session claims
Anti-screenshot logs	Realtime + Functions
No-trace messaging	Realtime + Cron delete
Creator ekonomi	Postgres + triggers
Jeton sistemi	DB + Edge Functions
AI integration	Edge Functions
Social firewall	Policies + DB filters
Dual feed	RLS + policies
ASMR market	Storage
Behavior scoring	pgvector
Fantezi öneri motoru	pgvector + functions
Güvenlik & Gizlilik	RLS + policies + signed URLs