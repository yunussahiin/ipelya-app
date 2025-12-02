# Creator Gelir Sistemi - Web Ops TODO

> **Referans Dökümanlar:** [03-WEB-OPS-PANEL.md](./03-WEB-OPS-PANEL.md), [04-KYC-DOGRULAMA.md](./04-KYC-DOGRULAMA.md), [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md)

---

## Phase 1: Finance Dashboard

- [x] **id:** web_finance_dashboard
  - **description:** Finance ana dashboard sayfası oluştur
  - **checked:** true
  - **comments:** /ops/(private)/finance/page.tsx, özet kartları + hızlı linkler
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 2: Kur Yönetimi (03-WEB-OPS-PANEL.md)

- [x] **id:** web_coin_rates_page
  - **description:** Coin/TL kur yönetimi sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/coin-rates/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_coin_rates_list
      - **description:** Kur geçmişi tablosu
      - **checked:** true
      - **comments:** Tarih, kur, güncelleyen, not kolonları
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_coin_rates_modal
      - **description:** Kuru güncelle modal/dialog
      - **checked:** true
      - **comments:** Yeni kur input, not alanı, uyarı metni
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** api_coin_rates
  - **description:** Coin rates API routes oluştur
  - **checked:** true
  - **comments:** GET (liste), POST (yeni kur ekle)
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 3: Creator Bakiyeleri (03-WEB-OPS-PANEL.md)

- [x] **id:** web_creator_balances_list
  - **description:** Creator bakiyeleri liste sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/creator-balances/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_balances_summary_cards
      - **description:** Toplam/Çekilebilir/Kilitli/Ödenen özet kartları
      - **checked:** true
      - **comments:** shadcn Card components
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_balances_table
      - **description:** Creator bakiye tablosu + arama/filtre
      - **checked:** true
      - **comments:** Pagination, export CSV
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** web_creator_balance_detail
  - **description:** Creator bakiye detay sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/creator-balances/[creatorId]/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_balance_chart
      - **description:** Son 6 ay gelir grafiği
      - **checked:** true
      - **comments:** recharts veya chart.js kullan
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_balance_transactions
      - **description:** Son işlemler tablosu
      - **checked:** true
      - **comments:** Tip, miktar, kaynak, tarih
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_balance_adjustment
      - **description:** Manuel düzeltme modal
      - **checked:** true
      - **comments:** Ekleme/Çıkarma, miktar, sebep (zorunlu)
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
  - **priority:** high

- [x] **id:** api_creator_balances
  - **description:** Creator balances API routes
  - **checked:** true
  - **comments:** GET (liste), GET/:id (detay), POST/:id/adjustment
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 4: Ödeme Yöntemi Onayları (03-WEB-OPS-PANEL.md)

- [x] **id:** web_payment_methods_list
  - **description:** Ödeme yöntemi onay listesi sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/payment-methods/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_pm_filters
      - **description:** Durum filtreleri (Tümü/Bekleyen/Onaylı/Reddedilmiş)
      - **checked:** true
      - **comments:** Tab veya toggle group
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pm_table
      - **description:** Yöntemler tablosu
      - **checked:** true
      - **comments:** Creator, tip, detay, tarih, durum badge
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** web_payment_method_detail
  - **description:** Ödeme yöntemi detay/onay sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/payment-methods/[methodId]/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_pm_creator_info
      - **description:** Creator bilgileri kartı (KYC durumu dahil)
      - **checked:** true
      - **comments:** Username, email, KYC status
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_pm_details
      - **description:** Banka/Kripto bilgileri kartı
      - **checked:** true
      - **comments:** IBAN veya wallet adresi
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_pm_validation
      - **description:** Doğrulama kontrolleri kartı
      - **checked:** true
      - **comments:** IBAN format, isim uyumu, ilk yöntem uyarısı
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pm_reject_modal
      - **description:** Reddetme modal (sebep seçimi + açıklama)
      - **checked:** true
      - **comments:** Ön tanımlı sebepler + diğer
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** api_payment_methods_ops
  - **description:** Payment methods ops API routes
  - **checked:** true
  - **comments:** GET (liste), GET/:id, PATCH/:id (onay/red)
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 5: Ödeme Talepleri (03-WEB-OPS-PANEL.md)

- [x] **id:** web_payout_requests_list
  - **description:** Ödeme talepleri liste sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/payout-requests/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_pr_summary
      - **description:** Bugünkü özet kartları (Bekleyen/Onaylanan/Ödenen)
      - **checked:** true
      - **comments:** Tutar ve talep sayısı
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pr_filters
      - **description:** Durum filtreleri (5 durum)
      - **checked:** true
      - **comments:** pending, in_review, approved, paid, rejected
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pr_table
      - **description:** Talepler tablosu
      - **checked:** true
      - **comments:** Creator, coin/TL, yöntem, tarih, durum
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_pr_warnings
      - **description:** Uyarı kartı (48 saat+, yüksek tutar)
      - **checked:** true
      - **comments:** Alert component
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** low
  - **priority:** high

- [x] **id:** web_payout_request_detail
  - **description:** Ödeme talebi detay sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/payout-requests/[requestId]/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_pr_info
      - **description:** Talep bilgileri kartı (coin, TL, kur, kilitleme)
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_pr_payment_method
      - **description:** Ödeme yöntemi detayları kartı
      - **checked:** true
      - **comments:** Banka/IBAN veya wallet
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_pr_status_history
      - **description:** Durum geçmişi timeline
      - **checked:** true
      - **comments:** payout_status_history tablosundan
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pr_balance_status
      - **description:** Creator bakiye durumu kartı
      - **checked:** true
      - **comments:** Toplam, bu talep, kalan
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_pr_actions
      - **description:** Aksiyon butonları (İncelemeye Al/Onayla/Ödendi/Reddet)
      - **checked:** true
      - **comments:** Dropdown menu veya button group
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** api_payout_requests_ops
  - **description:** Payout requests ops API routes
  - **checked:** true
  - **comments:** GET (liste), GET/:id, PATCH/:id (durum güncelle)
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 6: Otomatik Ödemeler (03-WEB-OPS-PANEL.md)

- [x] **id:** web_auto_payouts
  - **description:** Otomatik ödeme yönetimi sayfası
  - **checked:** true
  - **comments:** /ops/(private)/finance/auto-payouts/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_ap_system_settings
      - **description:** Sistem ayarları kartı (ON/OFF, gün, saat, son/sonraki çalışma)
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_ap_creators_list
      - **description:** Auto-payout aktif creator tablosu
      - **checked:** true
      - **comments:** Min tutar, yöntem, son talep, durum
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_ap_stats
      - **description:** Son 4 hafta istatistikleri tablosu
      - **checked:** true
      - **comments:** Talep sayısı, toplam tutar, başarı oranı
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** low
  - **priority:** medium

---

## Phase 7: KYC Yönetimi (04-KYC-DOGRULAMA.md)

- [x] **id:** web_kyc_list
  - **description:** KYC başvuruları liste sayfası
  - **checked:** true
  - **comments:** /ops/(private)/kyc/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_kyc_filters
      - **description:** Durum filtreleri (Tümü/Bekleyen/Onaylı/Reddedilmiş)
      - **checked:** true
      - **comments:** Bekleyen sayısı badge
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_kyc_table
      - **description:** Başvurular tablosu
      - **checked:** true
      - **comments:** Creator, ad soyad, skor, öneri, tarih, durum
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** web_kyc_detail
  - **description:** KYC başvuru detay sayfası
  - **checked:** true
  - **comments:** /ops/(private)/kyc/[applicationId]/page.tsx
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_kyc_creator_info
      - **description:** Creator bilgileri (sol panel üst)
      - **checked:** true
      - **comments:** Username, email, başvuru tarihi
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_form_data
      - **description:** Form bilgileri kartı (sol panel)
      - **checked:** true
      - **comments:** Ad, soyad, doğum, TC (maskelenmiş)
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_auto_results
      - **description:** Otomatik doğrulama sonuçları kartı (sol panel)
      - **checked:** true
      - **comments:** OCR match, yüz match, canlılık, genel skor, öneri
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_documents
      - **description:** Belgeler yan yana görünüm (sağ panel)
      - **checked:** true
      - **comments:** Kimlik ön + selfie yan yana, kimlik arka, büyütme
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_face_compare
      - **description:** Yüz karşılaştırma bölümü (sağ panel)
      - **checked:** true
      - **comments:** Kimlik foto + selfie + benzerlik skoru bar
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_admin_notes
      - **description:** Admin notu input (sol panel)
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_kyc_rejection_select
      - **description:** Reddetme sebebi select (sol panel)
      - **checked:** true
      - **comments:** Ön tanımlı sebepler dropdown
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_kyc_actions
      - **description:** Onayla/Reddet butonları
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** api_kyc_ops
  - **description:** KYC ops API routes
  - **checked:** true
  - **comments:** GET (liste), GET/:id (detay + signed URLs), PATCH/:id (onay/red)
  - **assignee:** web-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 8: Ortak Components

- [x] **id:** web_shared_components
  - **description:** Ortak kullanılacak components
  - **checked:** true
  - **comments:** Tüm finance sayfalarında kullanılacak
  - **assignee:** web-dev
  - **subtasks:**
    - [x] **id:** web_status_badge
      - **description:** Durum badge component (pending, approved, rejected, vb.)
      - **checked:** true
      - **comments:** Renk kodlaması, dark mode uyumlu
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** web_creator_card
      - **description:** Creator mini kart (avatar, username, email)
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** web_coin_display
      - **description:** Coin miktarı gösterim (icon + miktar + TL)
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** web-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
  - **priority:** high

---

## ⚠️ Potansiyel Eksikler (Kontrol Edilmeli)

Bu bölüm, implementasyonda eksik olabilecek kritik noktaları listeler. Her madde kontrol edilmeli ve gerekirse tamamlanmalıdır.

### 1. IBAN Mod97 Validasyonu (Web Ops)

**Durum:** ✅ Tamamlandı

**Gereksinim:**
Ödeme yöntemi onaylama sayfasında IBAN formatı ve checksum kontrolü yapılmalı.

**Kontrol Noktaları:**
- [x] `/apps/web/app/ops/(private)/finance/payment-methods/[methodId]/page.tsx` dosyasında IBAN validasyonu var mı? ✅
- [x] `/lib/utils/iban.ts` - Mod97 validasyon fonksiyonu oluşturuldu ✅

**Olması Gereken:**
```typescript
// lib/utils/iban.ts
export function validateTurkishIBAN(iban: string): { valid: boolean; error?: string } {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  
  // Format kontrolü
  if (!/^TR[0-9]{24}$/.test(clean)) {
    return { valid: false, error: 'Geçersiz IBAN formatı' };
  }
  
  // Mod97 checksum
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let numericIban = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numericIban += (char.charCodeAt(0) - 55).toString();
    } else {
      numericIban += char;
    }
  }
  
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 7) {
    const chunk = remainder.toString() + numericIban.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  
  if (remainder !== 1) {
    return { valid: false, error: 'IBAN kontrol basamağı hatalı' };
  }
  
  return { valid: true };
}
```

**UI'da Gösterim:**
```tsx
// Ödeme yöntemi detay sayfasında
const ibanValidation = validateTurkishIBAN(paymentMethod.iban);

<Card>
  <CardHeader>
    <CardTitle>IBAN Doğrulama</CardTitle>
  </CardHeader>
  <CardContent>
    {ibanValidation.valid ? (
      <Badge variant="success">✓ Geçerli IBAN</Badge>
    ) : (
      <Badge variant="destructive">✗ {ibanValidation.error}</Badge>
    )}
  </CardContent>
</Card>
```

---

### 2. Realtime Event Tetikleme

**Durum:** ✅ Tamamlandı

**Gereksinim:**
Web Ops'tan yapılan işlemler (KYC onay, payout onay, payment method onay) mobile'a realtime event göndermelidir.

**Kontrol Noktaları:**
- [x] Supabase tablolarında `REPLICA IDENTITY FULL` ayarı var mı? ✅ (payout_requests, payment_methods, creator_transactions, kyc_applications, creator_kyc_profiles)
- [x] Tablolar `supabase_realtime` publication'a eklenmiş mi? ✅
- [x] API route'lar UPDATE işlemi yapıyor mu? ✅

**Supabase'de Olması Gereken:**
```sql
-- Realtime publication'a tablolar eklenmeli
ALTER PUBLICATION supabase_realtime ADD TABLE payout_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;
ALTER PUBLICATION supabase_realtime ADD TABLE creator_kyc_profiles;

-- Full row data için (old ve new değerleri almak için)
ALTER TABLE payout_requests REPLICA IDENTITY FULL;
ALTER TABLE payment_methods REPLICA IDENTITY FULL;
ALTER TABLE creator_kyc_profiles REPLICA IDENTITY FULL;
```

**API Route'larda:**
```typescript
// PATCH /api/ops/finance/payout-requests/[id]/route.ts
export async function PATCH(request: NextRequest, { params }) {
  // ... validation
  
  // UPDATE yapmalı (INSERT değil) - bu realtime event tetikler
  const { error } = await adminSupabase
    .from('payout_requests')
    .update({ 
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id
    })
    .eq('id', params.id);
  
  // Supabase realtime otomatik olarak mobile'a postgres_changes event gönderir
}
```

**Test Senaryosu:**
1. Mobile uygulamada creator hesabıyla giriş yap
2. Bir payout talebi oluştur
3. Web Ops'tan talebi onayla
4. Mobile'da bildirim görünmeli (toast veya push)

---

### 3. Signed URL Süresi

**Durum:** ✅ Tamamlandı

**Gereksinim:**
KYC belgelerini görüntülemek için signed URL kullanılmalı ve expire süresi yeterli olmalıdır.

**Kontrol Noktaları:**
- [x] `/api/ops/kyc/[applicationId]/route.ts` dosyasında signed URL oluşturuluyor mu? ✅
- [x] Expire süresi yeterli mi? ✅ (3600 saniye = 1 saat)
- [x] Signed URL frontend'e gönderiliyor mu? ✅

**Olması Gereken:**
```typescript
// GET /api/ops/kyc/[applicationId]/route.ts
export async function GET(request: NextRequest, { params }) {
  const application = await getKYCApplication(params.applicationId);
  
  // Storage'dan signed URL oluştur
  const signedUrls = {
    idFront: null,
    idBack: null,
    selfie: null,
  };
  
  if (application.id_front_path) {
    const { data } = await adminSupabase.storage
      .from('kyc-documents')
      .createSignedUrl(application.id_front_path, 3600); // 1 saat
    signedUrls.idFront = data?.signedUrl;
  }
  
  if (application.id_back_path) {
    const { data } = await adminSupabase.storage
      .from('kyc-documents')
      .createSignedUrl(application.id_back_path, 3600);
    signedUrls.idBack = data?.signedUrl;
  }
  
  if (application.selfie_path) {
    const { data } = await adminSupabase.storage
      .from('kyc-documents')
      .createSignedUrl(application.selfie_path, 3600);
    signedUrls.selfie = data?.signedUrl;
  }
  
  return NextResponse.json({
    ...application,
    signedUrls,
  });
}
```

**Frontend Kullanımı:**
```tsx
// KYC detay sayfasında
<Image 
  src={application.signedUrls.idFront} 
  alt="Kimlik Ön Yüz"
  onError={() => refetchSignedUrls()} // URL expire olursa yenile
/>
```

**Expire Süreleri Önerisi:**
| Kullanım           | Süre     | Gerekçe                     |
| ------------------ | -------- | --------------------------- |
| Belge görüntüleme  | 1 saat   | Ops incelemesi için yeterli |
| İndirme linki      | 5 dakika | Güvenlik                    |
| Önizleme thumbnail | 24 saat  | Cache için                  |

---

### 4. Storage Bucket RLS Policies

**Durum:** ✅ Tamamlandı

**Gereksinim:**
KYC belgeleri sadece yetkili kişiler tarafından görüntülenebilmeli.

**Kontrol Noktaları:**
- [x] `kyc-documents` bucket'ı private mı? ✅ (public: false)
- [x] RLS policy tanımlı mı? ✅ (3 policy: Admin view, Service role, User own docs)

**Olması Gereken:**
```sql
-- kyc-documents bucket için RLS
CREATE POLICY "KYC documents are private"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (
    -- Kendi belgelerini görüntüleyebilir
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Admin/Ops görüntüleyebilir
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  )
);

-- Upload policy
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📱 Mobile Plugin Adaptasyonu (Web Ops İçin)

Mobile tarafında KYC için VisionCamera plugin'leri entegre ediliyor. Web Ops tarafında bu bilgilerin görüntülenmesi için adaptasyon gerekebilir.

### OCR Sonuçları (Gelecek)

Mobile'da kimlik OCR yapıldığında, sonuçlar `kyc_applications` tablosuna kaydedilecek:

```typescript
// kyc_applications tablosuna eklenecek alanlar
{
  ocr_data: {
    tc_number: string | null,      // OCR ile okunan TC
    first_name: string | null,     // OCR ile okunan ad
    last_name: string | null,      // OCR ile okunan soyad
    birth_date: string | null,     // OCR ile okunan doğum tarihi
    confidence_score: number       // OCR güven skoru (0-1)
  },
  ocr_form_match: boolean,         // Form bilgileriyle eşleşiyor mu?
  face_detection_passed: boolean   // Selfie'de yüz algılandı mı?
}
```

### Web Ops'ta Gösterilecekler

- [x] **OCR vs Form Karşılaştırma:** KYC detay sayfasında OCR sonuçları ile kullanıcının girdiği bilgileri yan yana göster ✅
- [x] **Eşleşme Durumu:** Eşleşmeyen alanları kırmızı highlight et ✅
- [x] **Güven Skoru:** OCR güven skorunu progress bar olarak göster ✅
- [x] **Yüz Algılama:** Selfie'de yüz algılanıp algılanmadığını göster ✅

### Implementasyon Detayları

**Database Migration:** `add_ocr_fields_to_kyc_applications`
- `ocr_data` (jsonb) - OCR ile okunan veriler
- `ocr_form_match` (boolean) - Form eşleşme durumu
- `face_detection_passed` (boolean) - Yüz algılama durumu

**Component:** `/components/ops/finance/kyc/ocr-comparison-card.tsx`
- Form vs OCR tablo karşılaştırması
- Eşleşmeyen satırlar kırmızı highlight
- Genel ve alan bazlı güven skorları (progress bar)
- Yüz algılama durumu badge

**Sayfa Entegrasyonu:** `/ops/(private)/kyc/[applicationId]/page.tsx`
- `OCRComparisonCard` component'i entegre edildi

**Durum:** ✅ Tamamlandı (Mobile OCR entegrasyonu tamamlandığında veriler görünecek)

---

## Notlar

- Web Ops paneli shadcn/ui kullanıyor, dark/light mode uyumlu olmalı
- Memory'deki Web Ops styling kurallarına uy (CSS variables, text-muted-foreground vb.)
- API routes'lar admin yetkisi kontrolü yapmalı
- KYC belgelerini görüntülemek için signed URL kullan
- Her görev tamamlandığında checked: true yapılmalı
- Sorun çıkarsa comments'a not ekle
