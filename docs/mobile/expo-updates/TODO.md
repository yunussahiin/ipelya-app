# EAS Update Entegrasyonu - TODO

Bu döküman, İPELYA mobil uygulamasında EAS Update entegrasyonunun yapılacaklar listesini içerir.

---

## Phase 1: Konfigürasyon ⚙️

### 1.1 app.json Güncellemesi
- [ ] `updates` objesi ekle
  - [ ] `enabled: true`
  - [ ] `url: "https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a"`
  - [ ] `fallbackToCacheTimeout: 0`
  - [ ] `checkAutomatically: "ON_LOAD"`
- [ ] `runtimeVersion` ekle
  - [ ] Policy seç: `appVersion` (önerilen)

### 1.2 EAS Update Yapılandırması
- [ ] `eas update:configure` komutunu çalıştır
- [ ] Native dosyaların güncellendiğini doğrula
  - [ ] iOS: `Expo.plist` kontrol et
  - [ ] Android: `AndroidManifest.xml` kontrol et

### 1.3 eas.json Doğrulama
- [x] `development` channel mevcut
- [x] `preview` channel mevcut
- [x] `production` channel mevcut
- [ ] `internal` profile'a channel ekle (opsiyonel)

---

## Phase 2: Development Build 🔨

### 2.1 iOS Build
- [ ] `eas build --profile development --platform ios` çalıştır
- [ ] Simulator veya cihaza kur
- [ ] Güncelleme akışını test et

### 2.2 Android Build
- [ ] `eas build --profile development --platform android` çalıştır
- [ ] APK'yı cihaza kur
- [ ] Güncelleme akışını test et

---

## Phase 3: Uygulama İçi Güncelleme UI 📱

### 3.1 useAppUpdate Hook
- [ ] `src/hooks/useAppUpdate.ts` oluştur
- [ ] `checkForUpdate()` fonksiyonu
- [ ] `downloadUpdate()` fonksiyonu
- [ ] Loading state'leri
- [ ] Hata yönetimi

### 3.2 UpdateBanner Component
- [ ] `src/components/common/UpdateBanner.tsx` oluştur
- [ ] Güncelleme mevcut banner'ı
- [ ] İndirme progress gösterimi
- [ ] "Güncellemeyi Uygula" butonu
- [ ] Theme entegrasyonu

### 3.3 Ayarlar Sayfası Entegrasyonu
- [ ] Ayarlar sayfasına "Güncelleme Kontrolü" butonu ekle
- [ ] Mevcut versiyon bilgisini göster
- [ ] Son güncelleme tarihini göster

### 3.4 Foreground Güncelleme Kontrolü
- [ ] AppState listener ekle
- [ ] Background'dan foreground'a geçişte kontrol
- [ ] Silent güncelleme indirme

---

## Phase 4: Production Hazırlığı Daha sonra yapacağız. 🚀

### 4.1 Production Build
- [ ] iOS production build oluştur
- [ ] Android production build oluştur
- [ ] App Store Connect'e yükle
- [ ] Google Play Console'a yükle

### 4.2 İlk OTA Test
- [ ] Küçük bir değişiklik yap (örn: versiyon text'i)
- [ ] `eas update --channel production` ile gönder
- [ ] Production build'de güncellemenin geldiğini doğrula

---

## Phase 5: CI/CD Entegrasyonu 🔄

### 5.1 GitHub Actions
- [ ] `.github/workflows/eas-update.yml` oluştur
- [ ] main branch'e push'ta otomatik güncelleme
- [ ] EXPO_TOKEN secret'ını ekle
- [ ] Conditional deployment (sadece mobile değişikliklerinde)

### 5.2 Manuel Deployment
- [ ] Deployment script'i oluştur (`scripts/deploy-update.sh`)
- [ ] Channel seçimi parametresi
- [ ] Mesaj parametresi

---

## Phase 6: Monitoring & Analytics 📊

### 6.1 Sentry Entegrasyonu
- [ ] Update ID'yi Sentry context'ine ekle
- [ ] Release tracking'i güncelle
- [ ] Update başarısızlıklarını izle

### 6.2 EAS Dashboard
- [ ] Güncelleme istatistiklerini izle
- [ ] Channel bazlı kullanımı kontrol et
- [ ] Rollback geçmişini takip et

---

## Phase 7: Dokümantasyon 📝

- [x] SETUP.md oluşturuldu
- [x] USAGE.md oluşturuldu
- [x] TODO.md oluşturuldu
- [ ] README.md oluştur (özet)
- [ ] Team'e eğitim ver

---

## Öncelik Sırası

```
1. Phase 1 (Konfigürasyon) - ZORUNLU, hemen yapılmalı
2. Phase 2 (Development Build) - Test için gerekli
3. Phase 4 (Production Build) - Store'a gönderim için gerekli
4. Phase 3 (UI) - Kullanıcı deneyimi için önemli
5. Phase 5 (CI/CD) - Otomasyon için
6. Phase 6 (Monitoring) - Uzun vadeli bakım için
```

---

## Tahmini Süre

| Phase   | Süre     | Öncelik       |
| ------- | -------- | ------------- |
| Phase 1 | 30 dk    | 🔴 Kritik      |
| Phase 2 | 1-2 saat | 🔴 Kritik      |
| Phase 3 | 2-3 saat | 🟡 Önemli      |
| Phase 4 | 1-2 saat | 🔴 Kritik      |
| Phase 5 | 1-2 saat | 🟢 İyileştirme |
| Phase 6 | 1 saat   | 🟢 İyileştirme |
| Phase 7 | 30 dk    | 🟢 İyileştirme |

**Toplam: ~8-11 saat**

---

## Notlar

- `expo-updates` paketi zaten yüklü (`~29.0.13`)
- EAS project ID: `ef2464e9-74a9-4b09-9ff6-a936e9cdc65a`
- Mevcut version: `1.0.1`
- Bundle ID: `com.ipelya.mobile`

---

## İlgili Dökümanlar

- [SETUP.md](./SETUP.md) - Kurulum rehberi
- [USAGE.md](./USAGE.md) - Kullanım rehberi
- [Expo Updates Resmi Dökümanı](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Dökümanı](https://docs.expo.dev/eas-update/introduction/)
