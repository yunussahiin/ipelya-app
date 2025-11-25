# IAP Kütüphaneleri Teknik Analiz

Bu doküman İpelya için en uygun In-App Purchase kütüphanesini seçmek amacıyla hazırlanmıştır.

---

## Karşılaştırma Özeti

| Özellik                | expo-iap               | react-native-purchases (RevenueCat) |
| ---------------------- | ---------------------- | ----------------------------------- |
| **Geliştirici**        | dooboolab (hyochan)    | RevenueCat                          |
| **GitHub Stars**       | ~2.4k                  | ~533                                |
| **Haftalık İndirme**   | ~25k                   | ~15k                                |
| **Expo Uyumluluğu**    | Native                 | Native (development build gerekli)  |
| **Receipt Validation** | Manuel (kendi backend) | Otomatik (RevenueCat backend)       |
| **Dashboard**          | Yok                    | Var (RevenueCat Dashboard)          |
| **Analytics**          | Yok                    | Var (built-in)                      |
| **Webhooks**           | Manuel                 | Var (built-in)                      |
| **Fiyatlandırma**      | Ücretsiz               | Freemium (gelire göre)              |
| **Vendor Lock-in**     | Yok                    | Var (RevenueCat bağımlılığı)        |

---

## 1. expo-iap (react-native-iap)

### Genel Bakış
- **Repo:** https://github.com/hyochan/expo-iap
- **Docs:** https://hyochan.github.io/expo-iap/
- Open IAP specification'a uyumlu
- StoreKit 2 (iOS) ve Google Play Billing 5+ (Android) desteği

### Avantajlar

1. **Tam Kontrol**
   - Kendi backend'inizi kullanırsınız
   - Veri tamamen sizde kalır
   - Supabase Edge Functions ile entegre edilebilir

2. **Maliyet**
   - Tamamen ücretsiz
   - Sadece Apple/Google komisyonları (%15-30)

3. **Esneklik**
   - Özel iş mantığı uygulayabilirsiniz
   - Kendi analytics sisteminizi kurabilirsiniz
   - Supabase Realtime ile entegrasyon

4. **Vendor Lock-in Yok**
   - Üçüncü parti servise bağımlılık yok
   - İstediğiniz zaman değiştirebilirsiniz

### Dezavantajlar

1. **Backend Geliştirme Gerekli**
   - Apple/Google receipt validation kendiniz yapmalısınız
   - Webhook'ları kendiniz implement etmelisiniz
   - Subscription lifecycle yönetimi sizde

2. **Daha Fazla Kod**
   - Subscription status tracking
   - Grace period handling
   - Refund handling

3. **Analytics Yok**
   - Kendi analytics sisteminizi kurmalısınız
   - Churn analizi, MRR takibi manuel

### Kurulum

```bash
npx expo install expo-iap
```

### Örnek Kullanım

```typescript
import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
} from 'expo-iap';

// Initialize
await initConnection();

// Get products
const products = await getProducts(['ipelya_coins_100', 'ipelya_coins_500']);

// Purchase
await requestPurchase({ sku: 'ipelya_coins_100' });

// Listen for updates
purchaseUpdatedListener(async (purchase) => {
  // Validate on your server
  const isValid = await supabase.functions.invoke('verify-purchase', {
    body: { receipt: purchase.transactionReceipt }
  });
  
  if (isValid) {
    await finishTransaction({ purchase, isConsumable: true });
  }
});
```

---

## 2. react-native-purchases (RevenueCat)

### Genel Bakış
- **Repo:** https://github.com/RevenueCat/react-native-purchases
- **Docs:** https://www.revenuecat.com/docs
- RevenueCat backend ile entegre
- Expo resmi dokümantasyonunda öneriliyor

### Avantajlar

1. **Hızlı Entegrasyon**
   - Receipt validation otomatik
   - Subscription lifecycle yönetimi otomatik
   - Webhook'lar hazır

2. **Dashboard**
   - Gerçek zamanlı analytics
   - MRR, churn, LTV metrikleri
   - Kullanıcı transaction geçmişi

3. **Özellikler**
   - Entitlement sistemi
   - A/B testing
   - Paywall UI components
   - Cross-platform sync

4. **Daha Az Kod**
   - Backend geliştirme minimal
   - Subscription status otomatik

### Dezavantajlar

1. **Maliyet (Kritik!)**
   ```
   Free Tier: $2,500/ay MTR'a kadar ücretsiz
   Starter: %1 gelir payı ($2,500+ MTR)
   Pro: %1.2 gelir payı + $99/ay
   Enterprise: Özel fiyatlandırma
   ```
   
   **Örnek Hesaplama (İpelya için):**
   - Aylık $10,000 gelir = $100 RevenueCat ücreti
   - Aylık $50,000 gelir = $500 RevenueCat ücreti
   - Aylık $100,000 gelir = $1,000 RevenueCat ücreti

2. **Vendor Lock-in**
   - RevenueCat'e bağımlılık
   - Veri RevenueCat'te
   - Migrasyon zor

3. **Özelleştirme Sınırlı**
   - Kendi iş mantığınızı eklemek zor
   - RevenueCat'in sunduğu özelliklerle sınırlı

### Kurulum

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

### Örnek Kullanım

```typescript
import Purchases from 'react-native-purchases';

// Configure
Purchases.configure({ apiKey: 'your_revenuecat_api_key' });

// Get offerings
const offerings = await Purchases.getOfferings();
const packages = offerings.current?.availablePackages;

// Purchase
const { customerInfo } = await Purchases.purchasePackage(pkg);

// Check entitlement
if (customerInfo.entitlements.active['premium']) {
  // User has premium access
}
```

---

## 3. Teknik Karşılaştırma

### Receipt Validation

| Kriter       | expo-iap         | react-native-purchases |
| ------------ | ---------------- | ---------------------- |
| Apple JWS    | Manuel implement | Otomatik               |
| Google API   | Manuel implement | Otomatik               |
| Sandbox test | Manuel           | Otomatik               |
| Production   | Manuel           | Otomatik               |

### Subscription Lifecycle

| Kriter       | expo-iap        | react-native-purchases |
| ------------ | --------------- | ---------------------- |
| Auto-renewal | Manuel track    | Otomatik               |
| Grace period | Manuel handle   | Otomatik               |
| Cancellation | Manuel detect   | Otomatik               |
| Refunds      | Webhook gerekli | Otomatik               |

### Backend Gereksinimleri

**expo-iap için gerekli Edge Functions:**
- `verify-purchase` - Receipt validation
- `webhook-apple` - Apple Server Notifications v2
- `webhook-google` - Google RTDN
- `subscription-status` - Status check
- `grant-tokens` - Token ekleme

**react-native-purchases için gerekli:**
- Sadece `grant-tokens` (opsiyonel, webhook ile)

---

## 4. İpelya İçin Öneri

### Senaryo Analizi

**Senaryo 1: Hızlı MVP (react-native-purchases)**
- Hızlı market'e çıkış öncelikli
- Backend geliştirme kapasitesi sınırlı
- Analytics önemli
- Maliyet ikincil

**Senaryo 2: Uzun Vadeli Kontrol (expo-iap)**
- Tam kontrol öncelikli
- Backend geliştirme kapasitesi var
- Maliyet optimizasyonu önemli
- Özel iş mantığı gerekli

### ÖNERİ: expo-iap

**Gerekçeler:**

1. **Maliyet Avantajı**
   - RevenueCat %1 komisyon = Yıllık binlerce dolar
   - expo-iap tamamen ücretsiz
   - Supabase Edge Functions zaten mevcut

2. **Supabase Entegrasyonu**
   - Zaten Supabase kullanıyoruz
   - Edge Functions hazır altyapı
   - Realtime broadcast mevcut
   - RPC fonksiyonları atomik işlemler için ideal

3. **Tam Kontrol**
   - Coin sistemi özel iş mantığı gerektiriyor
   - Hediye sistemi özel
   - Creator payı hesaplaması özel

4. **Vendor Lock-in Yok**
   - RevenueCat'e bağımlılık riski yok
   - Veri tamamen bizde

5. **Mevcut Altyapı**
   - `buy-coins` edge function zaten var (boş şablon)
   - `send-crystal-gift` edge function mevcut
   - Supabase Realtime aktif

### Hibrit Yaklaşım (Alternatif)

Eğer hızlı başlamak istiyorsanız:

1. **Faz 1:** react-native-purchases ile başla (hızlı MVP)
2. **Faz 2:** Gelir arttıkça expo-iap'a migrate et

Ancak migrasyon maliyeti yüksek olabilir.

---

## 5. Uygulama Planı (expo-iap)

### Gerekli Edge Functions

```
supabase/functions/
├── verify-purchase/          # Apple & Google validation
├── webhook-apple/            # Apple Server Notifications v2
├── webhook-google/           # Google RTDN
├── grant-tokens/             # Token ekleme
└── subscription-status/      # Abonelik durumu
```

### Gerekli Tablolar

```sql
-- purchases (satın alma kayıtları)
-- coin_balances (bakiyeler)
-- coin_transactions (işlem geçmişi)
-- gifts (hediyeler)
```

### Tahmini Geliştirme Süresi

| Görev         | expo-iap     | react-native-purchases |
| ------------- | ------------ | ---------------------- |
| Backend setup | 3-4 gün      | 0.5 gün                |
| Frontend      | 2-3 gün      | 1-2 gün                |
| Testing       | 2-3 gün      | 1-2 gün                |
| **Toplam**    | **7-10 gün** | **2.5-4.5 gün**        |

---

## 6. Sonuç

### Karar: **expo-iap**

**Kısa vadede:**
- Daha fazla geliştirme süresi
- Daha fazla backend kodu

**Uzun vadede:**
- Maliyet avantajı (yıllık binlerce dolar tasarruf)
- Tam kontrol
- Özel iş mantığı esnekliği
- Vendor lock-in yok

### Aksiyon Planı

1. ✅ Veritabanı tablolarını oluştur
2. ✅ `verify-purchase` edge function implement et
3. ✅ `expo-iap` kurulumu yap
4. ✅ Frontend hooks ve services oluştur
5. ✅ Apple/Google webhook'ları implement et
6. ✅ Test ve QA

---

## Referanslar

- [Expo IAP Documentation](https://hyochan.github.io/expo-iap/)
- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [Expo In-App Purchases Guide](https://docs.expo.dev/guides/in-app-purchases/)
- [LogRocket IAP Comparison](https://blog.logrocket.com/best-react-native-in-app-subscription-libraries/)
