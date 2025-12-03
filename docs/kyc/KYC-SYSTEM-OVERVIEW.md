# KYC Sistemi - Genel Bakış

Bu döküman, KYC (Know Your Customer) sisteminin tüm bileşenlerini, mevcut durumunu ve yapılacakları özetler.

---

## 📊 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOBILE (React Native + VisionCamera)                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  KYC Wizard: form → kimlik ön → kimlik arka → selfie (+ liveness)      │ │
│  │  OCR: useIDCardOCR hook ile on-device kimlik okuma                     │ │
│  │  Face Detection: Selfie'de yüz algılama                                │ │
│  │  Liveness: 4 adımlı canlılık kontrolü (göz kırp, gülümse, sağ, sol)   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EDGE FUNCTIONS                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  get-kyc-status         → Mobile'a mevcut durumu verir                 │ │
│  │  submit-kyc-application → Yeni KYC başvurusu oluşturur                 │ │
│  │  verify-kyc-documents   → Otomatik skor hesaplar (OCR + Face + Liveness)│ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE DATABASE                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  kyc_applications      → Tekil başvurular (form + doküman + skor)      │ │
│  │  creator_kyc_profiles  → Son onaylı durum + limitler                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB OPS PANEL (Next.js)                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  /ops/kyc              → Data Table (kullanıcı gruplu, filtrelenebilir)│ │
│  │  /ops/kyc/[id]         → Detay sayfası (form + belgeler + skor)        │ │
│  │  /ops/kyc/settings     → KYC ayarları (TODO)                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Edge Functions

### 1. `get-kyc-status`
**Amaç:** Mobile'da kullanıcının KYC durumunu göstermek

**Dönen Veriler:**
- `status`: `none` | `pending` | `approved` | `rejected`
- `level`: `basic` | `full` | `null`
- `verifiedName`: Onaylanan isim
- `monthlyPayoutLimit`: Aylık ödeme limiti
- `pendingApplication`: Bekleyen başvuru bilgisi
- `lastRejection`: Son red sebebi

### 2. `submit-kyc-application`
**Amaç:** Yeni KYC başvurusu oluşturmak

**Gelen Veriler:**
- Form: `firstName`, `lastName`, `birthDate`, `idNumber`
- Belgeler: `idFrontPath`, `idBackPath`, `selfiePath`
- OCR: `ocrData` (mobile'dan gelen OCR sonuçları)
- Face: `faceDetectionPassed`
- Liveness: `livenessFrames`

**İşlemler:**
1. Mevcut pending başvuru kontrolü
2. OCR-Form eşleşme kontrolü (Türkçe karakter normalize)
3. Başvuru kaydı oluşturma
4. `verify-kyc-documents` fonksiyonunu async tetikleme

### 3. `verify-kyc-documents` ✅ TAMAMLANDI
**Amaç:** Otomatik skor hesaplama ve öneri üretme

**Skor Hesaplama (100 puan üzerinden):**

| Kategori     | Puan | Açıklama                        |
| ------------ | ---- | ------------------------------- |
| OCR Eşleşme  | 25   | İsim (8) + Soyisim (8) + TC (9) |
| Yüz Algılama | 25   | Selfie'de yüz algılandı mı      |
| Canlılık     | 25   | 4 adım × 6 puan + bonus         |
| OCR Güven    | 25   | Confidence score × 25           |

**Öneri Hesaplama:**
- `>= 85%` → `auto_approve`
- `>= 60%` → `manual_review`
- `< 60%` → `likely_reject`

---

## 📱 Mobile Akışı

### KYC Wizard Adımları

```
1. Form (/kyc/form)
   └─ Ad, Soyad, Doğum Tarihi, TC Kimlik No
   
2. Kimlik Ön Yüz (/kyc/id-front)
   └─ Kamera + OCR (useIDCardOCR)
   └─ Otomatik çekim (confidence >= 85%)
   └─ Yanlış yüz kontrolü (MRZ varsa arka yüz)
   
3. Kimlik Arka Yüz (/kyc/id-back)
   └─ Kamera + MRZ okuma
   └─ Otomatik çekim (MRZ algılandığında)
   └─ Yanlış yüz kontrolü (MRZ yoksa ön yüz)
   
4. Selfie (/kyc/selfie)
   └─ Ön kamera + Yüz algılama
   └─ Liveness Check (4 adım)
   └─ Otomatik çekim
   
5. Özet (/kyc/summary)
   └─ Tüm bilgilerin özeti
   └─ Gönder butonu
```

### Kullanılan Hook'lar

| Hook                   | Dosya                                    | Amaç                   |
| ---------------------- | ---------------------------------------- | ---------------------- |
| `useKYCVerification`   | `/hooks/creator/useKYCVerification.ts`   | Ana KYC state yönetimi |
| `useIDCardOCR`         | `/hooks/creator/useIDCardOCR.ts`         | Kimlik kartı OCR       |
| `useLivenessDetection` | `/hooks/creator/useLivenessDetection.ts` | Canlılık kontrolü      |

---

## 🖥️ Web Ops Panel

### Mevcut Sayfalar

#### `/ops/kyc` - Liste Sayfası ✅
- Kullanıcı gruplu data table
- Filtreleme: Durum, Öneri
- Sıralama: Tarih, Skor
- Expand: Tüm başvurular (sayfalandırmalı)

#### `/ops/kyc/[id]` - Detay Sayfası ✅
- Kullanıcı bilgileri
- Form verileri
- Belgeler (kimlik ön/arka, selfie)
- OCR karşılaştırma
- Otomatik doğrulama sonuçları
- Önceki başvurular
- Onay/Red işlemleri

### Yeni Eklenen Sayfalar

#### `/ops/kyc/settings` - Ayarlar Sayfası ✅
- **Otomatik Onay Eşikleri**: auto_approve, manual_review, likely_reject eşikleri
- **Skor Ağırlıkları**: OCR, Face Detection, Liveness, OCR Confidence ağırlıkları
- **Otomatik İşlemler**: Auto approve/reject toggle, ilk başvuru manuel inceleme
- **Limitler**: Basic/Full seviye ödeme limitleri, cooldown süresi
- **Bildirimler**: Ops ve kullanıcı bildirimleri

---

## 📊 Database Şeması

### `kyc_applications`

| Kolon                   | Tip       | Açıklama                                           |
| ----------------------- | --------- | -------------------------------------------------- |
| `id`                    | uuid      | Primary key                                        |
| `creator_id`            | uuid      | Başvuru sahibi                                     |
| `level`                 | text      | `basic` / `full`                                   |
| `status`                | text      | `pending` / `approved` / `rejected`                |
| `first_name`            | text      | Form: Ad                                           |
| `last_name`             | text      | Form: Soyad                                        |
| `birth_date`            | date      | Form: Doğum tarihi                                 |
| `id_number`             | text      | Form: TC Kimlik No                                 |
| `id_front_path`         | text      | Storage path                                       |
| `id_back_path`          | text      | Storage path                                       |
| `selfie_path`           | text      | Storage path                                       |
| `liveness_frames`       | jsonb     | Canlılık frame'leri                                |
| `ocr_data`              | jsonb     | OCR sonuçları                                      |
| `ocr_form_match`        | boolean   | OCR-Form eşleşmesi                                 |
| `face_detection_passed` | boolean   | Yüz algılama                                       |
| `verification_result`   | jsonb     | Detaylı doğrulama sonuçları                        |
| `auto_score`            | numeric   | Otomatik skor (0-1)                                |
| `auto_recommendation`   | text      | `auto_approve` / `manual_review` / `likely_reject` |
| `reviewed_by`           | uuid      | İnceleyen admin                                    |
| `reviewed_at`           | timestamp | İnceleme tarihi                                    |
| `rejection_reason`      | jsonb     | Red sebepleri                                      |
| `internal_notes`        | text      | İç notlar                                          |
| `created_at`            | timestamp | Oluşturma tarihi                                   |
| `updated_at`            | timestamp | Güncelleme tarihi                                  |

### `creator_kyc_profiles`

| Kolon                  | Tip       | Açıklama           |
| ---------------------- | --------- | ------------------ |
| `creator_id`           | uuid      | Primary key        |
| `level`                | text      | `basic` / `full`   |
| `status`               | text      | `approved`         |
| `verified_name`        | text      | Doğrulanmış isim   |
| `monthly_payout_limit` | numeric   | Aylık ödeme limiti |
| `verified_at`          | timestamp | Doğrulama tarihi   |

### `kyc_settings`

| Kolon                                     | Tip     | Varsayılan | Açıklama                      |
| ----------------------------------------- | ------- | ---------- | ----------------------------- |
| `id`                                      | uuid    | -          | Primary key (tek satır)       |
| `auto_approve_threshold`                  | integer | 90         | Otomatik onay eşiği (%)       |
| `manual_review_threshold`                 | integer | 65         | Manuel inceleme eşiği (%)     |
| `auto_reject_threshold`                   | integer | 40         | Otomatik red eşiği (%)        |
| `weight_ocr_match`                        | integer | 30         | OCR eşleşme ağırlığı          |
| `weight_face_detection`                   | integer | 25         | Yüz algılama ağırlığı         |
| `weight_liveness`                         | integer | 25         | Canlılık kontrolü ağırlığı    |
| `weight_ocr_confidence`                   | integer | 20         | OCR güven skoru ağırlığı      |
| `enable_auto_approve`                     | boolean | false      | Otomatik onay aktif mi        |
| `enable_auto_reject`                      | boolean | false      | Otomatik red aktif mi         |
| `require_manual_review_first_application` | boolean | true       | İlk başvuru manuel mi         |
| `basic_level_payout_limit`                | numeric | 5000       | Basic seviye aylık limit (TL) |
| `full_level_payout_limit`                 | numeric | 50000      | Full seviye aylık limit (TL)  |
| `max_pending_applications_per_user`       | integer | 1          | Kullanıcı başına max bekleyen |
| `cooldown_after_rejection_days`           | integer | 3          | Red sonrası bekleme (gün)     |
| `notify_on_new_application`               | boolean | true       | Yeni başvuru bildirimi        |
| `notify_on_auto_approve`                  | boolean | true       | Otomatik onay bildirimi       |
| `notify_on_auto_reject`                   | boolean | true       | Otomatik red bildirimi        |
| `notify_user_on_approval`                 | boolean | true       | Kullanıcıya onay bildirimi    |
| `notify_user_on_rejection`                | boolean | true       | Kullanıcıya red bildirimi     |

**Constraints:**
- `weights_sum_100`: Ağırlıklar toplamı 100 olmalı
- `thresholds_order`: reject < manual < approve

---

## 🎯 Otomatik Onay Sistemi

### Mevcut Durum ✅

`verify-kyc-documents` edge function'ı şu anda:
1. OCR eşleşme kontrolü yapıyor
2. Yüz algılama kontrolü yapıyor
3. Canlılık skoru hesaplıyor
4. OCR güven skoru hesaplıyor
5. Toplam skor ve öneri üretiyor

### Eşikler (Varsayılan)

| Öneri           | Skor Aralığı |
| --------------- | ------------ |
| `auto_approve`  | >= 85%       |
| `manual_review` | 60% - 84%    |
| `likely_reject` | < 60%        |

### Tamamlanan Özellikler ✅

1. **Ayarlanabilir Eşikler**
   - `kyc_settings` tablosu oluşturuldu
   - Admin panelinden eşik değerleri değiştirilebilir
   - Kategori ağırlıkları ayarlanabilir

2. **Gerçek Otomatik Onay/Red**
   - `enable_auto_approve` ve `enable_auto_reject` toggle'ları
   - Otomatik onayda `creator_kyc_profiles` oluşturulur
   - İlk başvuru manuel inceleme zorunluluğu

3. **Başvuru Kuralları**
   - `max_pending_applications_per_user`: Aynı anda bekleyen başvuru limiti
   - `cooldown_after_rejection_days`: Red sonrası bekleme süresi

### Yapılacaklar 🔴

1. **Face Match**
   - Kimlik fotoğrafı ile selfie karşılaştırması
   - Harici API entegrasyonu gerekli (AWS Rekognition, Azure Face, vb.)

---

## 🔔 Bildirimler

### Mevcut Durumlar

| Olay               | Bildirim |
| ------------------ | -------- |
| Başvuru alındı     | ❌ Yok    |
| Başvuru onaylandı  | ❌ Yok    |
| Başvuru reddedildi | ❌ Yok    |

### Yapılacaklar 🔴

1. Push notification entegrasyonu
2. Email bildirimleri
3. In-app bildirimler

---

## 📋 TODO Listesi

### Yüksek Öncelik

- [ ] KYC Settings sayfası oluştur
- [ ] Otomatik onay eşiklerini ayarlanabilir yap
- [ ] Bildirim sistemi entegrasyonu

### Orta Öncelik

- [ ] Face Match API entegrasyonu
- [ ] Batch işlem desteği (toplu onay/red)
- [ ] Export özelliği (CSV/Excel)

### Düşük Öncelik

- [ ] Gelişmiş raporlama
- [ ] Fraud detection
- [ ] A/B test desteği

---

## 📁 İlgili Dosyalar

### Mobile
- `/apps/mobile/app/(creator)/kyc/*` - KYC ekranları
- `/apps/mobile/src/hooks/creator/useKYCVerification.ts`
- `/apps/mobile/src/hooks/creator/useIDCardOCR.ts`
- `/apps/mobile/src/hooks/creator/useLivenessDetection.ts`

### Web
- `/apps/web/app/ops/(private)/kyc/*` - Ops sayfaları
- `/apps/web/components/ops/finance/kyc/*` - KYC bileşenleri
- `/apps/web/app/api/ops/kyc/*` - API routes

### Edge Functions
- `get-kyc-status`
- `submit-kyc-application`
- `verify-kyc-documents`

### Docs
- `/docs/kyc/KYC-SYSTEM-OVERVIEW.md` (bu dosya)
- `/docs/kyc/LIVENESS-CHECK.md`
- `/docs/mobile/.../04-KYC-DOGRULAMA.md`
