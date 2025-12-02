# Creator Gelir Sistemi - Dokümantasyon

Bu klasör, creator gelir yönetimi sisteminin tüm dokümantasyonunu içerir.

---

## 📁 Döküman Yapısı

| Dosya                                                                    | İçerik                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [01-GELIR-RAPORU.md](./01-GELIR-RAPORU.md)                               | Mobile gelir raporu ekranı, UI tasarımı, hook'lar               |
| [02-ODEME-YONETIMI.md](./02-ODEME-YONETIMI.md)                           | Ödeme yöntemleri, ödeme talepleri, otomatik ödemeler            |
| [03-WEB-OPS-PANEL.md](./03-WEB-OPS-PANEL.md)                             | Admin paneli: kur yönetimi, onaylar, talep yönetimi             |
| [04-KYC-DOGRULAMA.md](./04-KYC-DOGRULAMA.md)                             | **Ana KYC dökümanı** - VisionCamera, OCR, Face Match, Ops panel |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md)                         | Tüm tablolar, RLS policies, triggers                            |
| [06-EDGE-FUNCTIONS.md](./06-EDGE-FUNCTIONS.md)                           | Tüm edge function kodları                                       |
| [creator-gelir-sistemi-on-fikir.md](./creator-gelir-sistemi-on-fikir.md) | Orijinal ön fikir notları                                       |
| [vision-camera-kyc-ek-detaylar.md](./vision-camera-kyc-ek-detaylar.md)   | KYC ek notlar (04'e entegre edildi)                             |

---

## 📋 TODO Dosyaları

| Dosya                              | Açıklama                           | Assignee   |
| ---------------------------------- | ---------------------------------- | ---------- |
| [MOBILE-TODO.md](./MOBILE-TODO.md) | Mobile geliştirme görevleri        | mobile-dev |
| [WEB-TODO.md](./WEB-TODO.md)       | Web Ops panel geliştirme görevleri | web-dev    |

> **Kullanım:** Her görev tamamlandığında `checked: false` → `checked: true` yapın ve gerekirse `comments` alanına not ekleyin.

---

## 🎯 Sistem Özeti

### 1. Gelir Raporu (Mobile)

Creator'ların kazançlarını görüntülemesi:

- **Toplam Kazanç** - Coin + TL karşılığı
- **Zaman Filtresi** - 7 gün → Tümü
- **Gelir Dağılımı** - Abonelik vs Hediye (tier breakdown)
- **Trend Grafiği** - Günlük kazanç grafiği
- **İşlem Geçmişi** - Filtrelenebilir liste

### 2. Ödeme Yönetimi (Mobile)

Creator'ların ödeme alması:

- **Ödeme Yöntemleri** - Banka/Kripto hesap ekleme
- **Ödeme Talebi** - Manuel veya otomatik talep
- **Ödeme Geçmişi** - Talep durumları ve detayları

### 3. Web Ops Panel

Admin yönetimi:

- **Kur Yönetimi** - Coin/TL oranı ayarlama
- **Creator Bakiyeleri** - Tüm bakiyeleri görme, düzeltme
- **Ödeme Yöntemi Onayları** - Banka/Kripto onay/red
- **Ödeme Talepleri** - İnceleme, onay, ödendi işaretleme
- **Otomatik Ödemeler** - Cron job yönetimi

### 4. KYC Doğrulama

Kimlik doğrulama:

- **Basic KYC** - Kimlik + Selfie (₺10,000/ay limit)
- **Full KYC** - + Adres belgesi (limitsiz)
- **Otomatik Doğrulama** - OCR + Face Match

---

## 🗄️ Veritabanı Tabloları

```
coin_rates                 # Coin/TL kur geçmişi
creator_balances           # Creator bakiye özeti
creator_transactions       # İşlem geçmişi
payment_methods            # Ödeme yöntemleri
payout_requests            # Ödeme talepleri
payout_status_history      # Talep durum geçmişi
auto_payout_settings       # Otomatik ödeme ayarları
kyc_applications           # KYC başvuruları
creator_kyc_profiles       # KYC profil özeti
```

---

## 🔌 Edge Functions

| Function                 | Açıklama                     |
| ------------------------ | ---------------------------- |
| `get-creator-earnings`   | Gelir raporu                 |
| `get-payment-methods`    | Ödeme yöntemlerini listele   |
| `add-payment-method`     | Yeni yöntem ekle             |
| `create-payout-request`  | Ödeme talebi oluştur         |
| `get-kyc-status`         | KYC durumu                   |
| `submit-kyc-application` | KYC başvurusu                |
| `verify-kyc-documents`   | Otomatik KYC doğrulama       |
| `process-auto-payouts`   | Haftalık otomatik ödeme cron |

---

## 📱 Mobile Screens

```
/apps/mobile/app/(creator)/
├── earnings.tsx              # Gelir raporu (güncelle)
├── payment-methods.tsx       # Ödeme yöntemleri (yeni)
└── kyc/
    ├── index.tsx             # KYC durumu
    ├── form.tsx              # Kişisel bilgi formu
    ├── id-front.tsx          # Kimlik ön yüz
    ├── id-back.tsx           # Kimlik arka yüz
    ├── selfie.tsx            # Selfie
    └── result.tsx            # Sonuç
```

---

## 🖥️ Web Ops Pages

```
/apps/web/app/ops/(private)/finance/
├── page.tsx                  # Dashboard
├── coin-rates/               # Kur yönetimi
├── creator-balances/         # Creator bakiyeleri
├── payment-methods/          # Ödeme yöntemi onayları
├── payout-requests/          # Ödeme talepleri
└── auto-payouts/             # Otomatik ödemeler
```

---

## 🔄 İş Akışları

### Ödeme Alma Akışı

```
1. Creator KYC doğrulaması yapar
2. Ödeme yöntemi ekler (Banka/Kripto)
3. Ops ödeme yöntemini onaylar
4. Creator ödeme talebi oluşturur
5. Kur kilitlenir
6. Ops talebi inceler ve onaylar
7. Ops ödemeyi yapar ve "Ödendi" işaretler
8. Creator bakiyesi güncellenir
```

### Otomatik Ödeme Akışı

```
1. Creator auto-payout'u açar
2. Minimum miktar ve yöntem seçer
3. Her Pazartesi cron job çalışır
4. Bakiye >= minimum ise talep oluşur
5. Talep "pending" olarak eklenir
6. Ops normal süreçle onaylar
```

---

## ✅ Implementation Checklist

### Phase 1: Database & Edge Functions
- [ ] Tüm tabloları oluştur
- [ ] RLS policies ekle
- [ ] Triggers ve functions ekle
- [ ] Edge functions deploy et

### Phase 2: Mobile - Gelir Raporu
- [ ] `useCreatorEarnings` hook güncelle
- [ ] Gelir raporu UI güncellemesi
- [ ] Trend grafiği ekle
- [ ] İşlem geçmişi ekle

### Phase 3: Mobile - Ödeme Yönetimi
- [ ] Payment methods ekranı
- [ ] Payout request şeeti
- [ ] Ödeme geçmişi

### Phase 4: Mobile - KYC
- [ ] VisionCamera entegrasyonu
- [ ] KYC akış ekranları
- [ ] OCR ve face detection

### Phase 5: Web Ops Panel
- [ ] Finance dashboard
- [ ] Kur yönetimi
- [ ] Ödeme yöntemi onayları
- [ ] Payout request yönetimi
- [ ] KYC onayları

### Phase 6: Automation
- [ ] Auto-payout cron job
- [ ] KYC auto-verification
- [ ] Bildirimler

---

## 📚 İlgili Dökümanlar

- [Tier Benefits System](../../abonelik-ve-odeme-yonetimi/tier-benefits-system.md)
- [Tier Özelliklerinin Kontrolü](../README.md)
