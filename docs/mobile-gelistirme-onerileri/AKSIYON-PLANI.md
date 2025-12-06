# 📋 Aksiyon Planı

## Haftalık Plan

### Hafta 1: Kritik Sorunlar - Skeleton Migration

**Hedef:** ActivityIndicator → Skeleton geçişi

| Gün       | Görev                       | Dosya Sayısı |
| --------- | --------------------------- | ------------ |
| Pazartesi | Skeleton component oluştur  | 1            |
| Salı      | Auth ve Profile ekranları   | 8            |
| Çarşamba  | Feed ve Home ekranları      | 10           |
| Perşembe  | Messaging ekranları         | 12           |
| Cuma      | Live ve Broadcast ekranları | 15           |
| Cumartesi | Kalan dosyalar + Test       | 17           |

**Çıktılar:**
- [ ] `src/components/ui/Skeleton.tsx`
- [ ] `src/components/ui/SkeletonVariants.tsx`
- [ ] 62 dosya güncellendi

---

### Hafta 2: Console Log Temizliği

**Hedef:** Logger utility + console temizliği

| Gün       | Görev                               |
| --------- | ----------------------------------- |
| Pazartesi | Logger utility oluştur              |
| Salı      | Babel plugin ekle                   |
| Çarşamba  | Hooks klasörü (92 dosya)            |
| Perşembe  | Services klasörü (13 dosya)         |
| Cuma      | Components klasörü (kısım 1)        |
| Cumartesi | Components klasörü (kısım 2) + Test |

**Çıktılar:**
- [ ] `src/utils/logger.ts`
- [ ] `babel.config.js` güncellendi
- [ ] 172 dosya güncellendi

---

### Hafta 3: Auth Store Birleştirme

**Hedef:** Tek auth store + hook

| Gün       | Görev                                    |
| --------- | ---------------------------------------- |
| Pazartesi | Yeni auth.store.ts yaz                   |
| Salı      | useAuth hook güncelle                    |
| Çarşamba  | Tüm useAuthStore kullanımlarını güncelle |
| Perşembe  | Tüm useAuth kullanımlarını kontrol et    |
| Cuma      | Eski dosyaları sil                       |
| Cumartesi | Test + Bug fix                           |

**Çıktılar:**
- [ ] Birleşik `src/store/auth.store.ts`
- [ ] Güncel `src/hooks/useAuth.ts`
- [ ] Eski auth store silindi

---

### Hafta 4: UI Component Library

**Hedef:** Eksik UI component'leri ekle

| Gün       | Görev                             |
| --------- | --------------------------------- |
| Pazartesi | Avatar component                  |
| Salı      | Badge component                   |
| Çarşamba  | Card component                    |
| Perşembe  | Input component                   |
| Cuma      | EmptyState + Divider              |
| Cumartesi | index.ts güncelle + Dokümantasyon |

**Çıktılar:**
- [ ] 6 yeni UI component
- [ ] Güncel `src/components/ui/index.ts`

---

### Hafta 5: Mimari İyileştirmeler

**Hedef:** Error boundary, i18n, cleanup

| Gün       | Görev                     |
| --------- | ------------------------- |
| Pazartesi | ErrorBoundary component   |
| Salı      | i18n yapılandırması       |
| Çarşamba  | Türkçe çeviriler          |
| Perşembe  | Duplicate dosyaları sil   |
| Cuma      | Hardcoded renkleri düzelt |
| Cumartesi | Final test                |

**Çıktılar:**
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/i18n/` yapılandırıldı
- [ ] Duplicate dosyalar silindi

---

## Öncelik Sıralaması

### 🔴 Yüksek Öncelik (Hafta 1-2)
1. **Skeleton Migration** - UX iyileştirmesi
2. **Console Log Temizliği** - Production güvenliği

### 🟡 Orta Öncelik (Hafta 3-4)
3. **Auth Store Birleştirme** - Kod kalitesi
4. **UI Component Library** - Geliştirici deneyimi

### 🟢 Düşük Öncelik (Hafta 5+)
5. **Error Boundary** - Hata yönetimi
6. **i18n** - Çoklu dil desteği
7. **Cleanup** - Kod temizliği

---

## Başlangıç Noktası

### Hemen Şimdi Yapılacaklar

1. **Skeleton component oluştur:**
```bash
# Dosya oluştur
touch apps/mobile/src/components/ui/Skeleton.tsx
touch apps/mobile/src/components/ui/SkeletonVariants.tsx
```

2. **Logger utility oluştur:**
```bash
touch apps/mobile/src/utils/logger.ts
```

3. **Duplicate dosyaları sil:**
```bash
rm "apps/mobile/app/home copy.tsx"
```

---

## İlerleme Takibi

### Hafta 1 Progress
- [ ] Skeleton.tsx oluşturuldu
- [ ] SkeletonVariants.tsx oluşturuldu
- [ ] app/index.tsx güncellendi
- [ ] app/(auth)/*.tsx güncellendi
- [ ] app/(profile)/*.tsx güncellendi
- [ ] ... (devam)

### Hafta 2 Progress
- [ ] logger.ts oluşturuldu
- [ ] babel.config.js güncellendi
- [ ] hooks/ klasörü temizlendi
- [ ] services/ klasörü temizlendi
- [ ] ... (devam)

---

## Notlar

- Her değişiklikten sonra `npm run ios` ile test et
- Büyük değişikliklerden önce branch oluştur
- Sentry'de hata artışı olursa rollback yap
- Her hafta sonunda bu dosyayı güncelle

---

**Son Güncelleme:** 2025-12-06
