# Creator Modülü (Mobile) Teknik Analiz Raporu

Bu rapor, `apps/mobile/app/(creator)` dizini ve ilgili hook/servislerin detaylı incelemesi sonucunda hazırlanmıştır.

## 1. Genel Mimari ve Yapı

Creator modülü, **Edge Function First** yaklaşımıyla tasarlanmış, ancak **Realtime** yetenekleriyle güçlendirilmiş hibrit bir yapıdadır.

*   **Veri Akışı:**
    *   **Okuma (Read):** Kritik veriler (Kazançlar, Tier'lar, KYC durumu) ağırlıklı olarak Supabase Edge Functions (`get-creator-earnings`, `manage-creator-tiers`, `get-kyc-status`) üzerinden çekilmektedir.
    *   **Yazma (Write):** İşlemler (Tier oluşturma, KYC başvurusu) yine Edge Functions üzerinden yürütülür.
    *   **Realtime:** `useCreatorRealtime` hook'u ile merkezi bir dinleme yapısı kurulmuş. `creator_transactions`, `payout_requests`, `creator_kyc_profiles` tabloları dinlenerek UI güncel tutuluyor.

*   **State Management:**
    *   Lokal state (`useState`) ve `AsyncStorage` (KYC wizard için) ağırlıklı kullanılmış. Global store (Zustand) kullanımı bu modülde daha az.

---

## 2. Bileşen ve Hook Analizi

### A. Dashboard (`dashboard.tsx`)
*   **İşlev:** Creator ana ekranı. Özet verileri gösterir.
*   **Durum:** Temiz ve modüler. `useCreatorEarnings` ve `useCreatorTiers` hook'larını tüketir.
*   **İyileştirme:** `refreshEarnings` ve `tiers` verileri her açılışta yeniden çekiliyor olabilir. Cache stratejisi (React Query vb.) kontrol edilmeli.

### B. Earnings (`earnings.tsx` & `useCreatorEarnings.ts`)
*   **İşlev:** Detaylı gelir raporu.
*   **Güçlü Yönler:**
    *   Realtime entegrasyonu başarılı (`creator_transactions` dinleniyor).
    *   Pagination desteği var (`loadMoreTransactions`).
    *   Filtreleme (Period, Transaction Type) Edge Function tarafında yapılıyor, bu da büyük verilerde performans sağlar.
*   **Riskler:**
    *   `coinsToTL` dönüşümü için `coinRate` verisi kullanılıyor. Kur değişimlerinde anlık yansıma olmayabilir (sayfa yenilenene kadar).

### C. KYC (`kyc/index.tsx` & `useKYCVerification.ts`)
*   **İşlev:** Kimlik doğrulama süreci.
*   **Güçlü Yönler:**
    *   **State Persistence:** `AsyncStorage` kullanılarak kullanıcının formu yarıda bırakıp geri dönmesi durumunda veri kaybı önlenmiş. Bu çok iyi bir UX pratiği.
    *   **Direct Storage Upload:** Dosyalar Edge Function üzerinden değil, doğrudan Client -> Storage şeklinde yükleniyor. Bu, Edge Function timeout/size limitlerine takılmamak için doğru bir tercih.
*   **Eksiklikler:**
    *   **OCR/Face Detection:** Kodda `ocrData` ve `faceDetectionPassed` state'leri var ancak bunların nasıl dolduğu (client-side library mi, başka bir API mi) bu dosyalarda görünmüyor. Eğer client-side ise, cihaz performansını etkileyebilir.
    *   **Büyük Dosya Yönetimi:** Yüksek çözünürlüklü fotoğraflar doğrudan yükleniyor. Client tarafında resize/compress işlemi (örn: `expo-image-manipulator`) yapılması upload süresini ve kotayı iyileştirir.

### D. Tiers (`tiers.tsx` & `useCreatorTiers.ts`)
*   **İşlev:** Abonelik paketleri yönetimi.
*   **Riskler:**
    *   **Chatty Realtime:** `useCreatorTiers` içinde her realtime olayında (`INSERT`, `UPDATE` vb.) `loadMyTiers` fonksiyonu çağrılıp tüm liste yeniden çekiliyor. Bu gereksiz ağ trafiği yaratabilir.
    *   **Optimistic Updates:** Tier güncelleme/silme işlemlerinde UI, sunucu yanıtını bekliyor (`isLoading` dönüyor). Optimistic update ile anında tepki verilebilir.

---

## 3. Tespit Edilen Sorunlar ve Riskler

### 1. Edge Function Bağımlılığı ve "Cold Start"
Neredeyse tüm okuma işlemleri Edge Function üzerinden yapılıyor (`get-creator-earnings`, `manage-creator-tiers`).
*   **Sorun:** Kullanıcı sayfayı açtığında Edge Function "uyuyorsa" (cold start), ilk yükleme 1-2 saniye sürebilir.
*   **Öneri:** `get-creator-earnings` gibi karmaşık hesaplama gerektirenler hariç, basit listelemeler (örn: `manage-creator-tiers`'ın listeleme kısmı) RLS (Row Level Security) ile doğrudan Supabase Client üzerinden yapılabilir. Bu, süreyi milisaniyeler seviyesine indirir.

> **✅ Not (2024-12-04):** Tüm Edge Function'lar Supabase MCP ile yönetiliyor ve aktif. Yerel repo'da tutulmuyor, bu normal bir durum.

### 2. Offline Destek Eksikliği
KYC modülü hariç (wizard state save var), diğer modüllerde offline destek zayıf.
*   **Sorun:** İnternet yokken Dashboard veya Earnings sayfası muhtemelen boş veya hata verecek.
*   **Öneri:** React Query veya benzeri bir cache mekanizması ile son başarılı veriler gösterilmeli.

### 3. Realtime "Over-fetching"
`useCreatorTiers.ts` ve `useCreatorEarnings.ts` içinde realtime event geldiğinde tüm veriyi yeniden çekme (`refetch`) stratejisi izlenmiş.
*   **Sorun:** Sadece bir satır değiştiğinde tüm listeyi çekmek verimsiz.
*   **Öneri:** Gelen `payload.new` verisini mevcut state'e merge etmek (update/insert) daha performanslı olur.

### 4. Hata Yönetimi
Hata yönetimi genelde `console.error` ve basit `Alert` (veya state içi error mesajı) ile sınırlı.
*   **Öneri:** Global bir hata raporlama (Sentry vb.) ve kullanıcıya daha dostane "Toast" mesajları kullanılmalı.

---

## 4. Aksiyon Planı (Önerilen)

1.  **[PERFORMANS] Tier Listeleme Refactor:** `manage-creator-tiers` yerine doğrudan `supabase.from('creator_subscription_tiers').select('*')` kullanımına geçişi değerlendirin.
2.  **[UX] KYC Resim Optimizasyonu:** Fotoğraflar yüklenmeden önce client-side sıkıştırma (resize/compress) ekleyin.
3.  **[UX] Optimistic Updates:** Tier ekleme/silme işlemlerinde sunucu yanıtı beklenmeden UI güncellensin.
4.  **[ALTYAPI] Realtime Merge:** `loadEarnings` veya `loadMyTiers` çağırmak yerine, realtime'dan gelen veriyi mevcut listeye ekleyen/güncelleyen mantığı kurun.

---

## 5. Doğrulama Raporu (2024-12-04)

### ✅ Doğrulanan Durumlar

| İddia                      | Gerçek Durum                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| Edge Functions repo'da yok | **YANLIŞ** - Tüm EF'ler Supabase MCP ile yönetiliyor ve aktif         |
| Database tabloları eksik   | **YANLIŞ** - Tüm tablolar mevcut ve RLS aktif                         |
| Duplicate Realtime         | **DOĞRU** - `useCreatorRealtime` + hook-spesifik subscription'lar var |
| Chatty Refetch             | **DOĞRU** - Her event'te tüm liste yeniden çekiliyor                  |

### 🔴 Yeni Tespit Edilen Sorunlar

1. **`creator_kyc_profiles` Realtime Publication'da YOK**
   - `useCreatorRealtime` bu tabloyu dinliyor ama tablo publication'da değil
   - KYC onay/red bildirimleri mobile'a gelmeyecek
   - **Çözüm:** `ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_kyc_profiles;`

2. **`creator_subscriptions` Tablosunda Duplicate RLS Policy**
   - "Creators can view own subscribers" ve "Creators can view their subscribers" aynı işi yapıyor
   - Biri silinmeli

### 📊 Tablo Durumu

| Tablo                        | Mevcut | RLS | Realtime    |
| ---------------------------- | ------ | --- | ----------- |
| `creator_transactions`       | ✅      | ✅   | ✅           |
| `creator_subscription_tiers` | ✅      | ✅   | ✅           |
| `creator_kyc_profiles`       | ✅      | ✅   | ❌ **EKSİK** |
| `payout_requests`            | ✅      | ✅   | ✅           |
| `payment_methods`            | ✅      | ✅   | ✅           |
| `kyc_applications`           | ✅      | ✅   | ✅           |
| `creator_subscriptions`      | ✅      | ✅   | -           |
| `creator_balances`           | ✅      | ✅   | ✅           |
| `coin_rates`                 | ✅      | ✅   | -           |

### 📝 Edge Functions Durumu

| Function                      | Durum    | Version |
| ----------------------------- | -------- | ------- |
| `get-creator-earnings`        | ✅ ACTIVE | v4      |
| `manage-creator-tiers`        | ✅ ACTIVE | v1      |
| `get-kyc-status`              | ✅ ACTIVE | v3      |
| `submit-kyc-application`      | ✅ ACTIVE | v5      |
| `get-payment-methods`         | ✅ ACTIVE | v1      |
| `add-payment-method`          | ✅ ACTIVE | v1      |
| `update-payment-method`       | ✅ ACTIVE | v1      |
| `delete-payment-method`       | ✅ ACTIVE | v1      |
| `get-payout-requests`         | ✅ ACTIVE | v2      |
| `create-payout-request`       | ✅ ACTIVE | v2      |
| `cancel-payout-request`       | ✅ ACTIVE | v1      |
| `get-auto-payout-settings`    | ✅ ACTIVE | v2      |
| `update-auto-payout-settings` | ✅ ACTIVE | v1      |
| `verify-kyc-documents`        | ✅ ACTIVE | v7      |
| `process-auto-payouts`        | ✅ ACTIVE | v1      |
| `get-creator-details`         | ✅ ACTIVE | v2      |
