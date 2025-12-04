# Creator Modülü Kapsamlı Teknik Dokümantasyonu

Bu dokümantasyon, `apps/mobile/app/(creator)` modülünün tüm bileşenlerini, hook'larını, Edge Function bağımlılıklarını ve veritabanı ilişkilerini detaylı şekilde analiz etmektedir.

---

## 1. Modül Genel Bakış

### 1.1 Dosya Yapısı

```
apps/mobile/app/(creator)/
├── _layout.tsx              # Stack navigation layout
├── index.tsx                # Creator olmak için yönlendirme
├── dashboard.tsx            # Ana dashboard (12.5 KB)
├── earnings.tsx             # Gelir raporu (9.5 KB)
├── revenue.tsx              # Ödeme yönetimi (18.4 KB)
├── subscribers.tsx          # Abone listesi (4.8 KB)
├── tiers.tsx                # Tier yönetimi (8.2 KB)
├── schedule.tsx             # İçerik zamanlama (placeholder)
├── upload.tsx               # İçerik yükleme (placeholder)
└── kyc/
    ├── _layout.tsx          # KYC wizard layout
    ├── index.tsx            # KYC durumu
    ├── form.tsx             # Kişisel bilgi formu (16.3 KB)
    ├── id-front.tsx         # Kimlik ön yüz OCR (23.4 KB)
    ├── id-back.tsx          # Kimlik arka yüz OCR (22.9 KB)
    ├── selfie.tsx           # Selfie + liveness (22.3 KB)
    └── result.tsx           # Sonuç ekranı (7.3 KB)
```

### 1.2 Hook'lar

```
apps/mobile/src/hooks/creator/
├── index.ts                      # Export hub
├── useCreatorEarnings.ts         # Kazanç verileri (5.9 KB)
├── useCreatorRealtime.ts         # Merkezi realtime (4.8 KB)
├── useCreatorNotifications.ts    # Push bildirimleri (5.5 KB)
├── useCreatorTiers.ts            # Tier CRUD (root: 6.7 KB)
├── useKYCVerification.ts         # KYC wizard state (15.6 KB)
├── useIDCardOCR.ts               # Kimlik OCR (21.6 KB)
├── useKYCSelfieDetection.ts      # Yüz tanıma (6.8 KB)
├── useLivenessDetection.ts       # Canlılık kontrolü (13.8 KB)
├── useDocumentNormalizer.ts      # Belge düzeltme (6 KB)
├── usePaymentMethods.ts          # Ödeme yöntemleri (3.9 KB)
├── usePayoutRequests.ts          # Çekim talepleri (3.7 KB)
└── useAutoPayoutSettings.ts      # Otomatik çekim (2.2 KB)
```

---

## 2. Edge Function Bağımlılık Haritası

Creator modülü toplam **11 benzersiz Edge Function** kullanmaktadır:

| Edge Function                 | Kullanıldığı Hook       | İşlev                                 |
| ----------------------------- | ----------------------- | ------------------------------------- |
| `get-creator-earnings`        | `useCreatorEarnings`    | Kazanç verileri, trend, işlem geçmişi |
| `manage-creator-tiers`        | `useCreatorTiers`       | Tier CRUD (list/create/update/delete) |
| `get-kyc-status`              | `useKYCVerification`    | KYC durumu, limitler, cooldown        |
| `submit-kyc-application`      | `useKYCVerification`    | KYC başvurusu gönderme                |
| `get-payment-methods`         | `usePaymentMethods`     | Ödeme yöntemleri listesi              |
| `add-payment-method`          | `usePaymentMethods`     | Banka/kripto ekleme                   |
| `update-payment-method`       | `usePaymentMethods`     | Varsayılan ayarlama                   |
| `delete-payment-method`       | `usePaymentMethods`     | Yöntem silme                          |
| `get-payout-requests`         | `usePayoutRequests`     | Çekim talepleri, bakiye               |
| `create-payout-request`       | `usePayoutRequests`     | Yeni çekim talebi                     |
| `cancel-payout-request`       | `usePayoutRequests`     | Talep iptali                          |
| `get-auto-payout-settings`    | `useAutoPayoutSettings` | Otomatik çekim ayarları               |
| `update-auto-payout-settings` | `useAutoPayoutSettings` | Ayar güncelleme                       |

> **✅ Doğrulandı (2024-12-04):** Tüm Edge Function'lar Supabase'e deploy edilmiş ve aktif durumda. MCP ile yönetiliyorlar, yerel dosya sistemi yerine `mcp5_list_edge_functions` ve `mcp5_get_edge_function` ile erişilmeli.

---

## 3. Veritabanı Tabloları

Supabase'de creator modülüyle ilişkili tablolar:

| Tablo                        | RLS | İlişki                                      |
| ---------------------------- | --- | ------------------------------------------- |
| `creator_transactions`       | ✅   | Kazanç işlemleri                            |
| `creator_subscription_tiers` | ✅   | Abonelik paketleri                          |
| `creator_subscriptions`      | ✅   | Creator'a yapılan abonelikler (tier_id ile) |
| `creator_kyc_profiles`       | ✅   | KYC durumu ve verileri                      |
| `creator_balances`           | ✅   | Creator bakiye özeti                        |
| `payout_requests`            | ✅   | Para çekim talepleri                        |
| `payment_methods`            | ✅   | Banka/kripto hesapları                      |
| `auto_payout_settings`       | ✅   | Otomatik çekim ayarları                     |
| `kyc_settings`               | ✅   | Sistem geneli KYC ayarları                  |
| `kyc_applications`           | ✅   | KYC başvuruları                             |
| `coin_rates`                 | ✅   | Coin/TL kur bilgisi                         |

> **📝 Not:** `subscriptions` tablosu ayrı bir tablodur ve platform geneli abonelikleri (premium üyelik vb.) saklar. `creator_subscriptions` ise creator'lara yapılan tier bazlı abonelikleri saklar. İkisi farklı amaçlara hizmet eder.

---

## 4. Realtime Subscriptions

### 4.1 Merkezi Realtime (`useCreatorRealtime`)

Tek bir kanal üzerinden 4 tablo dinleniyor:

```typescript
channel(`creator:${userId}`)
  .on('postgres_changes', { table: 'creator_transactions', event: 'INSERT' })    // new_earning
  .on('postgres_changes', { table: 'payout_requests', event: 'UPDATE' })          // payout_status_changed
  .on('postgres_changes', { table: 'payment_methods', event: 'UPDATE' })          // payment_method_verified
  .on('postgres_changes', { table: 'creator_kyc_profiles', event: '*' })          // kyc_status_changed
```

### 4.2 Hook-Spesifik Realtime

| Hook                 | Dinlenen Tablo               | Event  |
| -------------------- | ---------------------------- | ------ |
| `useCreatorEarnings` | `creator_transactions`       | INSERT |
| `useCreatorTiers`    | `creator_subscription_tiers` | *      |
| `usePayoutRequests`  | `payout_requests`            | *      |

> **⚠️ Problem:** Hem merkezi hem hook-spesifik realtime var. Bu **duplicate subscription** yaratıyor. Ya merkezi yapıyı kullanın ya da hook-spesifik olanları kaldırın.

---

## 5. KYC Sistemi Detaylı Analizi

### 5.1 Wizard Akışı

```
[Form] → [ID Front OCR] → [ID Back OCR] → [Selfie + Liveness] → [Submit] → [Result]
```

### 5.2 State Persistence

`AsyncStorage` ile wizard state kaydediliyor:
- 24 saat geçerlilik
- `formData`, `documentPaths`, `ocrData` saklanıyor
- Kullanıcı uygulamadan çıksa bile kaldığı yerden devam edebiliyor

### 5.3 OCR Yetenekleri (`useIDCardOCR`)

**Desteklenen alanlar:**
- TC Kimlik No (11 hane, algoritma doğrulaması)
- Ad/Soyad
- Doğum tarihi
- Geçerlilik tarihi
- Cinsiyet
- Belge seri no

**MRZ Desteği:**
- Arka yüzdeki MRZ satırları parse ediliyor
- Güven skoru: Birden fazla frame'in sonuçları birleştirilerek hesaplanıyor

**Kütüphane:** `react-native-vision-camera-ocr-plus`

### 5.4 Liveness Detection

- Yüz tanıma + canlılık kontrolü
- Birden fazla frame analizi
- Edge Function'a gönderilmeden önce client-side kontrol

---

## 6. Tespit Edilen Sorunlar ve Riskler

### 6.1 🔴 Kritik

| #   | Sorun                               | Dosya                        | Açıklama                                                                                         |
| --- | ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | ~~Edge Functions kayıp~~            | ~~`supabase/functions/`~~    | ✅ **ÇÖZÜLDÜ:** Tüm fonksiyonlar Supabase MCP ile yönetiliyor ve aktif.                           |
| 2   | Duplicate Realtime                  | `useCreatorRealtime` + hooks | Aynı tablolar hem merkezi hem hook'larda dinleniyor. Gereksiz bağlantı.                          |
| 3   | `creator_kyc_profiles` Realtime YOK | Realtime Publication         | Bu tablo `supabase_realtime` publication'da değil! KYC durum değişiklikleri mobile'a gelmeyecek. |

### 6.2 🟡 Önemli

| #   | Sorun                    | Dosya                | Açıklama                                                                       |
| --- | ------------------------ | -------------------- | ------------------------------------------------------------------------------ |
| 3   | Edge Function Cold Start | Tüm hooklar          | Basit read işlemleri bile EF üzerinden. Cold start 1-2 sn ekliyor.             |
| 4   | Offline Destek Yok       | `usePaymentMethods`  | İnternet yokken tamamen işlevsiz. Cache veya fallback yok.                     |
| 5   | Chatty Refetch           | `useCreatorTiers`    | Her realtime event'te `loadMyTiers()` çağrılıyor, tüm liste yeniden çekiliyor. |
| 6   | Resim Sıkıştırma Yok     | `useKYCVerification` | Yüksek çözünürlüklü fotoğraflar sıkıştırılmadan yükleniyor.                    |

### 6.3 🟢 İyileştirme

| #   | Öneri                    | Kapsam                                                      |
| --- | ------------------------ | ----------------------------------------------------------- |
| 7   | Optimistic Updates       | `useCreatorTiers`, `usePaymentMethods`                      |
| 8   | Realtime Merge           | Event'ten gelen veriyi state'e merge etmek (refetch yerine) |
| 9   | React Query Entegrasyonu | Tüm Edge Function çağrıları için cache/stale yönetimi       |

---

## 7. Ekran Bazlı Analiz

### 7.1 Dashboard (`dashboard.tsx`)

**Veri Kaynakları:**
- `useCreatorEarnings` → Toplam kazanç
- `useCreatorTiers` → Tier sayısı, abone sayısı

**UI Elementleri:**
- Balance card (gradient)
- Quick stats (3 kart)
- Management menu
- Content menu
- Recent activity (şu an **hardcoded**)

> **⚠️ TODO:** "Son Aktivite" bölümü statik veri gösteriyor. Gerçek veriye bağlanmalı.

### 7.2 Revenue (`revenue.tsx`)

**Karmaşıklık:** Yüksek (568 satır)

**Veri Kaynakları:**
- `usePaymentMethods`
- `usePayoutRequests`
- `useAutoPayoutSettings`
- `useKYCVerification`
- `useCreatorEarnings` (coin kuru için)

**İş Mantığı:**
- KYC onaylı değilse ödeme yöntemleri kilitli
- Pending/rejected KYC durumu için farklı UI
- Banka + Kripto ekleme sheet'leri
- Otomatik çekim ayarları

**Performans Riski:** 5 ayrı hook aynı anda çalışıyor. `useFocusEffect` ile her focus'ta KYC refresh ediliyor.

### 7.3 KYC Form (`kyc/form.tsx`)

**Validasyon:**
- Ad/Soyad: Zorunlu
- Doğum tarihi: 18 yaş kontrolü
- TC Kimlik No: 11 hane + algoritma doğrulaması

**UX Özellikleri:**
- BottomSheet date picker
- Keyboard avoiding view
- Progress bar (Adım 1/4)

### 7.4 KYC ID Front/Back (`kyc/id-front.tsx`, `kyc/id-back.tsx`)

**Teknoloji:**
- `expo-camera` → Kamera erişimi
- `react-native-vision-camera-ocr-plus` → Real-time OCR
- Frame processor ile sürekli OCR taraması

**Akış:**
1. Kamerayı aç
2. OCR ile kimlik bilgilerini oku
3. Güven skoru yeterli olduysa overlay göster
4. Kullanıcı onaylarsa fotoğrafı kaydet
5. Storage'a doğrudan upload (`kyc-documents` bucket)

### 7.5 KYC Selfie (`kyc/selfie.tsx`)

**Özellikler:**
- Yüz tanıma kontrolü
- Liveness detection (canlılık)
- Frame capture ve analizi

---

## 8. Performans Metrikleri (Tahmini)

| Metrik                | Mevcut                    | Hedef   |
| --------------------- | ------------------------- | ------- |
| Dashboard ilk yükleme | ~2-3 sn                   | <1 sn   |
| Revenue sayfa açılışı | ~3-4 sn (5 hook)          | <1.5 sn |
| KYC fotoğraf upload   | ~5-10 sn (sıkıştırma yok) | <3 sn   |
| Tier oluşturma        | ~1-2 sn                   | <500 ms |

---

## 9. Önerilen İyileştirmeler

### Kısa Vadeli (1-2 Hafta)

1. ~~**Edge Functions'ı repo'ya ekle**~~ - ✅ MCP ile yönetiliyor, sorun yok
2. **`creator_kyc_profiles` tablosunu realtime'a ekle** - `ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_kyc_profiles;`
3. **Duplicate realtime kaldır** - Ya merkezi ya hook-spesifik
4. **KYC resim sıkıştırma** - `expo-image-manipulator` ile upload öncesi resize

### Orta Vadeli (1-2 Ay)

4. **React Query migration** - Tüm Edge Function çağrılarını React Query ile wrap et
5. **Doğrudan Supabase read** - Basit `SELECT` işlemleri için RLS + SDK kullan
6. **Realtime merge mantığı** - Refetch yerine state merge

### Uzun Vadeli

7. **Offline-first mimari** - KYC wizard zaten yapıyor, diğerlerine de yay
8. **FlashList migration** - Uzun listeler için performans
9. **Dashboard aktivite gerçek veri** - Hardcoded içeriği kaldır

---

## 10. Sonuç

Creator modülü, **fonksiyonel olarak eksiksiz** bir yapıya sahip. KYC süreci özellikle iyi düşünülmüş (OCR, liveness, state persistence). Ancak:

- **Edge Function bağımlılığı** performans ve bakım riski yaratıyor
- **Realtime yapısı** optimize edilmeli
- **Offline senaryolar** düşünülmeli

Bu dokümantasyon, modülün mevcut durumunu ve iyileştirme yol haritasını sunmaktadır.
