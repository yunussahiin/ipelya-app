# 🛒 Store Setup Rehberi (Faz 5)

Bu döküman App Store Connect ve Google Play Console'da IAP ürünlerini oluşturma adımlarını içerir.

---

## 📱 Apple App Store Connect

### 1. In-App Purchases Oluşturma

**App Store Connect → Uygulamam → In-App Purchases**

#### 1.1 Consumable Ürünler (Coin Paketleri)

| Product ID          | Tip        | Fiyat   | Açıklama               |
| ------------------- | ---------- | ------- | ---------------------- |
| `ipelya_coins_100`  | Consumable | ₺29.99  | 100 Coin               |
| `ipelya_coins_500`  | Consumable | ₺129.99 | 500 Coin (+50 bonus)   |
| `ipelya_coins_1000` | Consumable | ₺249.99 | 1000 Coin (+150 bonus) |

**Adımlar:**
1. App Store Connect → Uygulamam → Features → In-App Purchases
2. "+" butonuna tıkla → "Consumable" seç
3. Reference Name: "100 Coin Paketi"
4. Product ID: `ipelya_coins_100`
5. Pricing: Tier 4 (~₺29.99)
6. Localization ekle (Türkçe):
   - Display Name: "100 Coin"
   - Description: "100 coin satın al"
7. Review Screenshot ekle (zorunlu)
8. "Save" → "Submit for Review"

**Diğer paketler için tekrarla.**

#### 1.2 Auto-Renewable Subscriptions (Platform Abonelik)

| Product ID               | Tip            | Fiyat       | Süre  |
| ------------------------ | -------------- | ----------- | ----- |
| `ipelya_premium_monthly` | Auto-Renewable | ₺99.99/ay   | 1 ay  |
| `ipelya_premium_yearly`  | Auto-Renewable | ₺799.99/yıl | 1 yıl |

**Adımlar:**
1. Features → Subscriptions → "+" Subscription Group oluştur
   - Group Name: "İpelya Premium"
2. Grup içinde "+" ile subscription ekle
3. Reference Name: "Premium Aylık"
4. Product ID: `ipelya_premium_monthly`
5. Subscription Duration: 1 Month
6. Subscription Prices: Tier 12 (~₺99.99)
7. Localization ekle:
   - Display Name: "İpelya Premium"
   - Description: "Sınırsız erişim, reklamsız deneyim"
8. Review Screenshot ekle
9. "Save" → "Submit for Review"

---

### 2. Server Notifications v2 Ayarlama

**App Store Connect → Uygulamam → App Information → App Store Server Notifications**

1. Production Server URL:
```
https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/webhook-apple
```

2. Sandbox Server URL (test için):
```
https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/webhook-apple
```

3. Version: **Version 2** seç (önemli!)

---

### 3. Sandbox Test Hesapları

**Users and Access → Sandbox → Testers**

1. "+" ile yeni tester ekle
2. Email: `test1@ipelya.com` (gerçek email olmak zorunda değil)
3. Password: Güçlü bir şifre
4. App Store Territory: Turkey
5. "Save"

**Test için:**
- iPhone'da Settings → App Store → Sandbox Account ile giriş yap
- Veya test sırasında otomatik sorulacak

---

### 4. API Credentials (Receipt Validation için)

**Users and Access → Integrations → In-App Purchase**

1. "Generate In-App Purchase Key" tıkla
2. Key Name: "İpelya IAP Key"
3. Key dosyasını indir (.p8)
4. Not al:
   - **Key ID**: `XXXXXXXXXX`
   - **Issuer ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Shared Secret (eski yöntem, yine de al):**
1. App Store Connect → Uygulamam → In-App Purchases
2. "App-Specific Shared Secret" → Generate
3. Kopyala: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🤖 Google Play Console

### 1. In-App Products Oluşturma

**Google Play Console → Uygulamam → Monetize → Products → In-app products**

#### 1.1 Managed Products (Coin Paketleri)

| Product ID          | Fiyat   | Açıklama               |
| ------------------- | ------- | ---------------------- |
| `ipelya_coins_100`  | ₺29.99  | 100 Coin               |
| `ipelya_coins_500`  | ₺129.99 | 500 Coin (+50 bonus)   |
| `ipelya_coins_1000` | ₺249.99 | 1000 Coin (+150 bonus) |

**Adımlar:**
1. Monetize → Products → In-app products
2. "Create product" tıkla
3. Product ID: `ipelya_coins_100` (Apple ile aynı!)
4. Name: "100 Coin"
5. Description: "100 coin satın al"
6. Default price: ₺29.99
7. "Save" → "Activate"

#### 1.2 Subscriptions (Platform Abonelik)

**Monetize → Products → Subscriptions**

1. "Create subscription" tıkla
2. Product ID: `ipelya_premium_monthly`
3. Name: "İpelya Premium Aylık"
4. Description: "Sınırsız erişim, reklamsız deneyim"
5. "Add a base plan":
   - Billing period: Monthly
   - Price: ₺99.99
   - Renewal type: Auto-renewing
6. "Save" → "Activate"

---

### 2. Real-time Developer Notifications (RTDN)

**Monetize → Monetization setup → Real-time developer notifications**

1. Topic name: `projects/YOUR_PROJECT_ID/topics/play-billing`
2. Pub/Sub topic oluştur (Google Cloud Console'da)
3. Subscription endpoint:
```
https://ojkyisyjsbgbfytrmmlz.supabase.co/functions/v1/webhook-google
```

**Google Cloud Console'da:**
1. Pub/Sub → Topics → Create Topic
2. Topic ID: `play-billing`
3. Subscriptions → Create Subscription
4. Delivery type: Push
5. Endpoint URL: Yukarıdaki URL

---

### 3. Service Account (Server-side Validation)

**Google Cloud Console → IAM & Admin → Service Accounts**

1. "Create Service Account" tıkla
2. Name: "İpelya IAP Validator"
3. Role: "Pub/Sub Subscriber" + "Android Publisher"
4. "Create Key" → JSON → İndir

**Google Play Console'da Service Account'u bağla:**
1. Users and permissions → Invite new users
2. Service account email'ini ekle
3. Permissions: "View financial data" + "Manage orders and subscriptions"

---

## 🔐 Supabase Secrets

Tüm credential'ları Supabase'e ekle:

**Supabase Dashboard → Project Settings → Edge Functions → Secrets**

| Secret Name                  | Değer                            | Nereden                           |
| ---------------------------- | -------------------------------- | --------------------------------- |
| `APPLE_SHARED_SECRET`        | `xxxxxxxx...`                    | App Store Connect → Shared Secret |
| `APPLE_ISSUER_ID`            | `xxxxxxxx-xxxx-...`              | App Store Connect → API Keys      |
| `APPLE_KEY_ID`               | `XXXXXXXXXX`                     | App Store Connect → API Keys      |
| `APPLE_PRIVATE_KEY`          | `.p8 dosyası içeriği`            | İndirilen key dosyası             |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | JSON dosyası içeriği              |

**CLI ile eklemek için:**
```bash
# Apple
supabase secrets set APPLE_SHARED_SECRET=your_shared_secret
supabase secrets set APPLE_ISSUER_ID=your_issuer_id
supabase secrets set APPLE_KEY_ID=your_key_id
supabase secrets set APPLE_PRIVATE_KEY="$(cat AuthKey_XXXXXX.p8)"

# Google (JSON dosyasını tek satır yaparak)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

## ✅ Checklist

### Apple
- [ ] 3 Consumable ürün oluşturuldu
- [ ] 2 Subscription oluşturuldu
- [ ] Server Notifications v2 URL ayarlandı
- [ ] Sandbox test hesabı oluşturuldu
- [ ] API Key oluşturuldu (.p8 indirildi)
- [ ] Shared Secret alındı

### Google
- [ ] 3 Managed product oluşturuldu
- [ ] 2 Subscription oluşturuldu
- [ ] RTDN Pub/Sub ayarlandı
- [ ] Service Account oluşturuldu (JSON indirildi)
- [ ] Service Account Play Console'a bağlandı

### Supabase
- [ ] `APPLE_SHARED_SECRET` eklendi
- [ ] `APPLE_ISSUER_ID` eklendi
- [ ] `APPLE_KEY_ID` eklendi
- [ ] `APPLE_PRIVATE_KEY` eklendi
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` eklendi

---

## 🧪 Test Etme

### iOS Sandbox Test
1. iPhone'da Settings → App Store → Sign Out
2. Uygulamayı aç, satın alma yap
3. Sandbox hesabıyla giriş yap
4. Satın alma tamamlanacak (gerçek para çekilmez)

### Android Test
1. Google Play Console → License testing
2. Test hesabını ekle
3. Internal testing track'e yükle
4. Test hesabıyla satın alma yap

---

## 📞 Destek

Sorun yaşarsan:
- Apple: https://developer.apple.com/contact/
- Google: https://support.google.com/googleplay/android-developer/

---

**Son Güncelleme:** 2025-11-25
