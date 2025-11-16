## İpeya Monorepo Kurulum Planı

- [ ] Dokümantasyonun tamamını incele ve yapılacakları çıkart.
- [ ] Monorepo kök dizin yapısını hazırla:
  - [ ] `apps/`, `packages/`, `supabase/`, `scripts/` klasörlerini oluştur.
  - [ ] Kök `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc` dosyalarını yapılandır.
- [ ] `apps/mobile` içinde Expo projesini başlat ve gerekli klasör/dosya düzenlemelerini yap.
- [ ] `apps/web` içinde Next.js (App Router) projesini başlat ve yapılandır.
- [ ] Ortak paketleri oluştur (`packages/types`, `packages/api`, `packages/hooks`, `packages/utils`, `packages/config`, `packages/ui`) ve her dosya başına Türkçe yorum ekle.
- [ ] Supabase klasör yapısını ve Edge Function şablonlarını hazırla.
- [ ] Scripts klasörüne temel shell script placeholderları ekle.
- [ ] Gerekli örnek placeholder dosyaları ve TODO notlarını ekle (ör: shadow mode flow).
- [ ] Yapılan tüm işlemleri kontrol edip bu todo listesini güncelle.
