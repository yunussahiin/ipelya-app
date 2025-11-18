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
