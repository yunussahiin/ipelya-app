## İpeya Monorepo Kurulum Planı

- [x] Dokümantasyonun tamamını incele ve yapılacakları çıkart.
- [x] Monorepo kök dizin yapısını hazırla:
  - [x] `apps/`, `packages/`, `supabase/`, `scripts/` klasörlerini oluştur.
  - [x] Kök `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc` dosyalarını yapılandır.
- [x] `apps/mobile` içinde Expo projesini başlat ve gerekli klasör/dosya düzenlemelerini yap.
- [x] `apps/web` içinde Next.js (App Router) projesini başlat ve yapılandır.
- [x] Ortak paketleri oluştur (`packages/types`, `packages/api`, `packages/hooks`, `packages/utils`, `packages/config`, `packages/ui`) ve her dosya başına Türkçe yorum ekle.
- [x] Supabase klasör yapısını ve Edge Function şablonlarını hazırla.
- [x] Scripts klasörüne temel shell script placeholderları ekle.
- [x] Gerekli örnek placeholder dosyaları ve TODO notlarını ekle (ör: shadow mode flow).
- [x] Yapılan tüm işlemleri kontrol edip bu todo listesini güncelle.

## Yeni Yapılacaklar
- [x] Ops yönetici paneli için Supabase auth sistemi kuruldu (login/register)
- [x] Admin profilleri tablosu oluşturuldu (admin_profiles)
- [x] Sadece adminlerin giriş yapabildiği ve ops dizinine erişebildiği sistem kuruldu
- [x] Ops dashboard'da giriş yapan admin kullanıcının tüm bilgileri gösteriliyor
- [x] TypeScript database tipleri generate edildi
- [ ] Mobil uygulamada Supabase auth + React Query entegrasyonunu tamamla, session hydrate akışını `useAuthStore` ile bağla.
- [ ] Shadow/Coin Zustand store'larını genişletip SecureStore senkronizasyonu ekle.
- [ ] LiveKit token akışı ve dakika bazlı coin düşümü için edge functions + mobile client entegrasyonunu gerçekleştir.
- [ ] AI Fantasy ve ASMR flow'larını edge functions ile uçtan uca bağlayıp UI'da sonuç dinlemeyi implemente et.
- [ ] Shadcn tabanlı web creator dashboard ekranlarını (dashboard/content/schedule/earnings) oluştur.
- [x] Vercel deploy'unda pnpm ERR_INVALID_THIS hatasını analiz edip package manager / engines yapılandırmasıyla çöz.

---

## Web Bildirim Sistemi - TODO

### Phase 1: Database & Infrastructure ✅ (Mobile'da yapıldı)
- [x] `notifications` tablosu oluşturuldu
- [x] `device_tokens` tablosu oluşturuldu
- [x] `notification_preferences` tablosu oluşturuldu
- [x] RLS policies eklendi
- [x] Realtime enabled

**Web tarafında yapılacak:**
- [ ] `notification_campaigns` tablosu oluştur (admin tarafı)
- [ ] `notification_templates` tablosu oluştur (admin tarafı)
- [ ] `notification_logs` tablosu oluştur (admin tarafı)
- [ ] Indexes ekle (campaign_id, status, recipient_id)
- [ ] RLS policies ekle (admin-only)

### Phase 2: Frontend Hooks 🎣
- [ ] `hooks/useNotifications.ts` oluştur (Mobile'daki ile aynı)
- [ ] `hooks/useSendNotification.ts` oluştur (Admin-only, Mobile'da yok)
- [ ] `hooks/useNotificationPreferences.ts` oluştur (Mobile'daki ile aynı)

### Phase 3: API Routes 🔌
- [ ] `app/api/notifications/send/route.ts` oluştur
- [ ] `app/api/notifications/mark-read/route.ts` oluştur
- [ ] `app/api/notifications/[id]/delete/route.ts` oluştur

### Phase 4: Components 🎨
- [ ] `components/notifications/NotificationCenter.tsx` oluştur
- [ ] `components/notifications/NotificationBell.tsx` oluştur
- [ ] `components/notifications/NotificationItem.tsx` oluştur
- [ ] `components/notifications/NotificationList.tsx` oluştur
- [ ] Layout'a NotificationCenter entegre et

### Phase 5: Admin Panel - Send 📬
- [ ] `app/ops/(private)/notifications/send/page.tsx` oluştur
- [ ] `SingleNotification.tsx` component oluştur
- [ ] `BulkNotification.tsx` component oluştur
- [ ] `ScheduledNotification.tsx` component oluştur

### Phase 6: Admin Panel - History & Templates 📊
- [ ] `app/ops/(private)/notifications/history/page.tsx` oluştur
- [ ] `app/ops/(private)/notifications/templates/page.tsx` oluştur
- [ ] `NotificationHistory.tsx` component oluştur
- [ ] `TemplateList.tsx` component oluştur
- [ ] `TemplateEditor.tsx` component oluştur

### Phase 7: Edge Functions 🚀
- [ ] `supabase/functions/send-notification/index.ts` oluştur
- [ ] `supabase/functions/send-bulk-notification/index.ts` oluştur
- [ ] `supabase/functions/process-scheduled-notifications/index.ts` oluştur
- [ ] `supabase/functions/cleanup-notifications/index.ts` oluştur

### Phase 8: Analytics 📈
- [ ] `app/ops/(private)/notifications/analytics/page.tsx` oluştur
- [ ] `AnalyticsDashboard.tsx` component oluştur

### Phase 9: Testing & Optimization 🧪
- [ ] Unit tests yazılacak
- [ ] Integration tests yazılacak
- [ ] Performance optimization

---

## EAS Update (OTA Güncellemeler) - TODO

📚 **Detaylı Dökümanlar:** `docs/mobile/expo-updates/`

### Phase 1: Konfigürasyon ⚙️
- [ ] `app.json`'a `updates` ve `runtimeVersion` ekle
- [ ] `eas update:configure` komutunu çalıştır
- [ ] Native dosyaların güncellendiğini doğrula

### Phase 2: Build & Test 🔨
- [ ] Development build oluştur (iOS + Android)
- [ ] Güncelleme akışını test et
- [ ] Production build oluştur

### Phase 3: Uygulama İçi UI 📱
- [ ] `useAppUpdate` hook oluştur
- [ ] `UpdateBanner` component oluştur
- [ ] Ayarlar sayfasına güncelleme kontrolü ekle
- [ ] Foreground güncelleme kontrolü ekle

### Phase 4: CI/CD & Monitoring 🔄
- [ ] GitHub Actions workflow oluştur
- [ ] Sentry entegrasyonu
- [ ] EAS Dashboard izleme

**Durum:** ⏳ Başlanmadı
**Öncelik:** 🔴 Kritik (Store yayını öncesi tamamlanmalı)
