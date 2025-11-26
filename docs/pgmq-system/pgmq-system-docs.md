PGMQ’nin İpelya Projesinde Kullanım Alanları

Bu doküman, PGMQ (Postgres Message Queue) sisteminin İpelya uygulamasında hangi senaryolarda kullanılabileceğini detaylı olarak açıklar.

⸻

1. Arka Planda Çalışan Görevler (Background Jobs)

İpelya’da bazı işlemler anlık yapılmak yerine arka planda kuyruklu bir yapıya alınarak daha hızlı kullanıcı deneyimi sağlanabilir.

🟣 Örnek Kullanım Alanları
	•	Profil fotoğrafı yüklenince otomatik kırpma / optimize etme
	•	Kullanıcı raporları işleme (spam/abuse raporu değerlendirme)
	•	Match sistemi için ağır hesaplamaların arka planda yapılması
	•	Kullanıcı davranışı analizlerinin toplu işlenmesi (AI scoring vb.)

⸻

2. Bildirim Gönderimi (Push Notification Queue)

Bildirimlerin gerçek zamanlı gönderilmesi yerine kuyruğa alınması, ölçekleme açısından çok güçlü bir yöntemdir.

🟣 Kullanım Örnekleri
	•	Yeni eşleşme bildirimi
	•	Mesaj geldi bildirimi
	•	“Beğeni aldın” bildirimi
	•	Sistem duyuruları

Neden kuyruk kullanılır?
	•	Aynı anda binlerce kişiye bildirim gidebilir
	•	Bildirim servisleri (APNs/Firebase) rate limit uygular
	•	Retries ve error handling daha kontrollü olur

⸻

3. E-posta Gönderimleri

Özellikle yüksek trafikli operasyonlarda e-posta gönderimi kuyruk yapısına alınarak daha kararlı bir sistem elde edilir.

🟣 Örnekler:
	•	Hoş geldin e-postası
	•	Şifre sıfırlama kodu
	•	Güvenlik uyarıları
	•	Haftalık özet e-postaları

⸻

4. AI / ML İşlemleri (AI Worker Entegrasyonu)

İpelya’nın AI destekli modülleri için ağır işlemler PGMQ ile yönetilebilir.

🟣 Kullanılabilecek AI İşleri:
	•	Profil fotoğraf analizleri / güvenlik kontrolü
	•	Kullanıcıya uygun eş önerilerinin hesaplanması
	•	Sosyal graph model güncellemeleri
	•	Risk scoring (fake account detection)

Bu işlemler genellikle CPU/GPU tüketen işlerdir ve kuyruğa konarak ölçekleme kolaylaşır.

⸻

5. Matchmaking Sistemi

Eşleşme algoritmalarının çalışması genellikle yüksek yoğunlukta veriyi işler.

🟣 PGMQ burada nasıl işe yarar?
	•	Kullanıcı “swipe” yaptığında bu olay hemen işlenmez → kuyruğa düşer
	•	Worker işlem yapar:
	•	Match oluşmuş mu hesaplar
	•	Kullanıcının profil skorunu günceller
	•	Anlık bildirimleri tetikler

Bu, uygulamanın hızlı kalmasını sağlar.

⸻

6. Üyelik ve Ödeme İşlemleri

Stripe veya başka bir ödeme servisinden gelen event’ler kuyruğa alınıp sırasıyla işlenebilir.

🟣 Örnekler:
	•	Kullanıcı premium üyelik aldı → kuyruğa düşer → premium hakları tanımlanır
	•	Abonelik yenilendi event’i
	•	Ödeme iptali veya hata durumları

Bu, ödeme operasyonlarında veri tutarlılığını artırır.

⸻

7. Anti-Spam / Anti-Fraud Görevleri

Gerçek zamanlı analiz yerine küçük gecikmeyle çalışan arka plan görevleri vardır.

🟣 Kullanım senaryoları:
	•	Şüpheli hesap aktivitelerini işleme
	•	IP risk analizi
	•	Çok hızlı swipe yapan kullanıcıları tespit
	•	Profil değişikliklerinin güvenlik kontrolü

⸻

PGMQ Neden İpelya İçin Uygun?
	•	Ekstra bir mesaj broker (Kafka, RabbitMQ vb.) kurma gerektirmez
	•	Tamamen Postgres içinde çalışır
	•	Basit kurulum → CREATE EXTENSION pgmq;
	•	Visibility timeout, retry, delay gibi gelişmiş özelliklere sahiptir
	•	Orta ölçekli SaaS uygulamaları için yeterli performansı sağlar

⸻

Sonuç

PGMQ, İpelya’nın arka plan işlemleri, bildirim altyapısı, matchmaking, AI modülleri, ödeme entegrasyonu gibi birçok kritik alanında kullanılabilir.

⸻

📌 Ek Bölüm: İpelya İçin Örnek Mimari Diyagramı

Aşağıdaki mimari, PGMQ’nun İpelya altyapısına nasıl entegre edileceğini gösterir:




                 ┌───────────────────────┐
                 │      İpelya API       │
                 │ (Expo / NextJS API) │
                 └──────────┬────────────┘
                            │
                (PGMQ.send) │  İş Görevi Mesajları
                            ▼
                  ┌───────────────────┐
                  │      PGMQ         │
                  │  (Postgres MQ)    │
                  └───────┬───────────┘
                          │ (read)
          ┌───────────────┼────────────────┬───────────────┐
          ▼               ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ Notification   │ │ Matchmaking    │ │ AI / ML Worker     │
│ Worker         │ │ Worker         │ │ (profil analizi)   │
└────────────────┘ └────────────────┘ └────────────────────┘
          │                 │                │
      (supabase)       (real-time)     (AI sonuçları)


📌 Ek Bölüm: Önerilen Queue (Kuyruk) İsimleri

1. Bildirim Kuyrukları
	•	notification_push_queue
	•	notification_email_queue
	•	notification_inapp_queue

2. Matchmaking Kuyrukları
	•	swipe_event_queue
	•	match_calculation_queue
	•	match_recommendation_queue

3. AI / ML Kuyrukları
	•	profile_image_analysis_queue
	•	user_risk_scoring_queue
	•	fake_detection_queue
	•	recommendation_model_update_queue

4. Güvenlik / Moderasyon Kuyrukları
	•	report_processing_queue
	•	content_moderation_queue
	•	suspicious_activity_queue

5. Ödeme / Abonelik Kuyrukları
	•	payment_event_queue
	•	subscription_renewal_queue
	•	refund_processing_queue

⸻

📌 Ek Bölüm: Örnek Worker İş Akışları

🎯 1. Bildirim Worker Akışı
	1.	notification_push_queue → mesaj gelir
	2.	Worker mesajı alır: { user_id, type: 'match', payload… }
	3.	Firebase/APNs’e gönderir
	4.	Başarılı → mesaj silinir
	5.	Hatalı → visibility timeout sonrası retry

⸻

🎯 2. Matchmaking Worker Akışı
	1.	Kullanıcı swipe → API kuyruk mesajı oluşturur
	2.	Worker swipe_event_queue mesajını alır
	3.	Eşleşme ihtimali hesaplar
	4.	Eşleşme varsa → notification_push_queue’ya mesaj gönderir
	5.	Kullanıcı skorları güncellenir (AI)
	6.	Mesaj silinir

⸻

🎯 3. AI Profil Analizi Worker Akışı
	1.	Kullanıcı yeni fotoğraf yükler
	2.	API → profile_image_analysis_queue
	3.	Worker fotoğrafı AI modeline yollar
	4.	Sonuç DB’ye kaydedilir
	5.	Gerekirse content_moderation_queue tetiklenir

⸻

📌 Ek Bölüm: Performans ve Ölçekleme Önerileri

✔ Worker Sayısını Yük Bazlı Arttırma
	•	Matchmaking yoğun → 5–10 worker
	•	AI işlemleri ağır → 2–3 GPU worker
	•	Bildirim trafiği yüksek → 10+ worker

✔ Mesaj Boyutu Küçük Tutulmalı
Yanlış:
{ "image_binary": "..." }
Doğru:
{ "image_id": 882129 }

✔ Retry & Dead Letter Queue (DLQ)
	•	notification_push_dlq
	•	match_calculation_dlq

✔ Queue Temizleme & Arşivleme

PGMQ arşiv desteği içerir.

⸻

📌 Ek Bölüm: PGMQ’nin İpelya’ya Sağladığı Somut Değerler
	•	Uygulama hızlı kalır
	•	Ekstra Kafka/RabbitMQ gerektirmez
	•	Ödeme & bildirim süreçleri daha güvenlidir
	•	AI süreçleri yönetilebilir hale gelir
	•	Worker ekleyerek kolayca ölçeklenebilir

⸻

📌 Ek Güncelleme: İpelya Tech Stack İçin Optimize Edilmiş Mimari

(React Native Expo + Next.js + Supabase)

🏛️ Yeni Mimari (Stack’e Uygun)

         📱 React Native (Expo) Mobil Uygulama
                         │
                         │ (HTTPS API İstekleri)
                         ▼
              🌐 Next.js (App Router / API Route)
              │  - İş Mantığı
              │  - Kuyruğa Mesaj Gönderme (PGMQ.send)
              ▼
        🗄️ Supabase Postgres + PGMQ Extension
              │
              │ (PGMQ.read ile mesaj tüketimi)
     ┌────────┼─────────────────────────────┐
     ▼        ▼                             ▼
 🔧 Worker 1  🔧 Worker 2               🔧 Worker 3
 Notification   Matchmaking               AI / ML
 (Node.js)      (Node.js)                 (Python/Node)

 📌 React Native Expo İçin Kullanım Senaryoları

Mobil → Next.js → PGMQ Akışı
	1.	Kullanıcı fotoğraf yükler
	2.	Expo → Next.js /api/profile/upload
	3.	Next.js → Supabase Storage
	4.	Next.js → profile_image_analysis_queue
	5.	AI worker sonucu işler

Mobil uygulama hızlı kalır.

⸻

📌 Next.js (Ops Backend) İçin PGMQ Kullanım Alanları

✔ API Route → Kuyruğa Mesaj Gönderme (Örnek)

import { pgmq } from '@/lib/pgmq';

export async function POST(req) {
  const body = await req.json();

  await pgmq.send('notification_push_queue', {
    type: 'match',
    userId: body.userId,
  });

  return Response.json({ ok: true });
}
✔ Rate-Limited İşlemler

Yüksek swipe frekansı → tümü kuyruğa alınır.

⸻

📌 Supabase Entegrasyonu İçin PGMQ Yapılandırması

Kurulum:

create extension if not exists pgmq;

Önerilen Kuyruklar:
	•	swipe_event_queue
	•	match_calculation_queue
	•	profile_image_analysis_queue
	•	notification_push_queue
	•	payment_event_queue


    📌 Worker’ların Ekosisteme Uygulanışı

Worker’lar bağımsız Node.js servisleridir (Docker, PM2, Supabase Edge Runtime).

Node.js Worker Örneği

import { pgmq } from './client';

async function run() {
  while (true) {
    const messages = await pgmq.read('notification_push_queue', 5, 10);
    
    for (const msg of messages) {
      await sendPush(msg.payload);
      await pgmq.delete('notification_push_queue', msg.msg_id);
    }
  }
}

run();



⸻

📌 React Native + Next.js + Supabase Mimarisi İçin Ek Öneriler

✔ Worker’ları Edge Function ile birleştirebilirsin
✔ AI işleri için ayrı Python worker önerilir
✔ Supabase Storage + PGMQ mükemmel uyumlu
✔ Push bildirimleri için backend-driven mimari idealdir

⸻

📌 Sonuç: Bu Yeni Mimari İpelya İçin Neden İdeal?
	•	React Native app hızlı kalır
	•	Next.js sadece “işi kuyruğa atar”
	•	Supabase + PGMQ entegre çalışır
	•	Worker sistemi kolayca ölçeklenir

