# Creator Gelir Sistemi - Mobile TODO

> **Referans Dökümanlar:** [01-GELIR-RAPORU.md](./01-GELIR-RAPORU.md), [02-ODEME-YONETIMI.md](./02-ODEME-YONETIMI.md), [04-KYC-DOGRULAMA.md](./04-KYC-DOGRULAMA.md), [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md), [06-EDGE-FUNCTIONS.md](./06-EDGE-FUNCTIONS.md)

---

## Phase 1: Database & Edge Functions (Backend)

- [x] **id:** db_setup_tables
  - **description:** Tüm veritabanı tablolarını Supabase MCP ile oluştur
  - **checked:** false
  - **comments:** Migration sırasıyla: coin_rates → creator_balances → creator_transactions → payment_methods → payout_requests → payout_status_history → auto_payout_settings → kyc_applications → creator_kyc_profiles
  - **assignee:** mobile-dev
  - **subtasks:**
    - [x] **id:** db_coin_rates
      - **description:** coin_rates tablosu + RLS + index oluştur
      - **checked:** true
      - **comments:** 05-DATABASE-SCHEMA.md referans
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** db_creator_balances
      - **description:** creator_balances tablosu + computed column + RLS
      - **checked:** true
      - **comments:** available_balance GENERATED column dikkat
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** db_creator_transactions
      - **description:** creator_transactions tablosu + enum type + trigger
      - **checked:** true
      - **comments:** update_creator_balance trigger'ı kritik
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** db_payment_methods
      - **description:** payment_methods tablosu + unique constraints + trigger
      - **checked:** true
      - **comments:** IBAN/wallet unique index, default trigger
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** db_payout_requests
      - **description:** payout_requests + payout_status_history tabloları
      - **checked:** true
      - **comments:** status history trigger dahil
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** db_kyc_tables
      - **description:** kyc_applications + creator_kyc_profiles + approval trigger
      - **checked:** true
      - **comments:** KYC onay trigger'ı profil güncellemesi yapıyor
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

- [x] **id:** storage_kyc_bucket
  - **description:** kyc-documents storage bucket ve RLS policies oluştur
  - **checked:** true
  - **comments:** 04-KYC-DOGRULAMA.md referans, private bucket, 5MB limit
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** edge_functions_deploy
  - **description:** Tüm edge functions'ları Supabase MCP ile deploy et
  - **checked:** true
  - **comments:** 06-EDGE-FUNCTIONS.md referans, önce mevcut functions kontrol et
  - **assignee:** mobile-dev
  - **subtasks:**
    - [x] **id:** ef_get_creator_earnings
      - **description:** get-creator-earnings edge function
      - **checked:** true
      - **comments:** Tier breakdown, daily trend, transactions dahil
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** ef_payment_methods
      - **description:** get/add/update/delete-payment-method edge functions
      - **checked:** true
      - **comments:** 4 ayrı function
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** ef_payout_requests
      - **description:** get/create/cancel-payout-request edge functions
      - **checked:** true
      - **comments:** Kur kilitleme mantığı önemli
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** ef_auto_payout
      - **description:** get/update-auto-payout-settings + process-auto-payouts
      - **checked:** true
      - **comments:** process-auto-payouts cron job olarak çalışacak
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
    - [x] **id:** ef_kyc
      - **description:** get-kyc-status + submit-kyc-application + verify-kyc-documents
      - **checked:** true
      - **comments:** verify-kyc-documents opsiyonel microservice gerektirir
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

---

## Phase 2: Mobile - Gelir Raporu (01-GELIR-RAPORU.md)

- [x] **id:** hook_creator_earnings
  - **description:** useCreatorEarnings hook güncelle/oluştur
  - **checked:** true
  - **comments:** 01-GELIR-RAPORU.md referans, realtime subscription dahil
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_earnings_summary
  - **description:** EarningsSummaryCard component oluştur
  - **checked:** true
  - **comments:** Toplam kazanç + TL karşılığı, kur info butonu
  - **assignee:** mobile-dev
  - **subtasks:**
    - [x] **id:** comp_coin_rate_sheet
      - **description:** CoinRateSheet bottom sheet component
      - **checked:** true
      - **comments:** Kur bilgisi açıklama metni
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** medium
  - **priority:** high

- [x] **id:** comp_earnings_breakdown
  - **description:** EarningsBreakdown + TierBreakdownSheet components
  - **checked:** true
  - **comments:** Abonelik/Hediye dağılımı, tier detay sheet
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** comp_earnings_trend
  - **description:** EarningsTrendChart component (chart library gerekli)
  - **checked:** true
  - **comments:** react-native-chart-kit veya victory-native kullan
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** comp_transaction_list
  - **description:** TransactionList + TransactionItem + TransactionFilters
  - **checked:** true
  - **comments:** Pagination, filtre, pull-to-refresh
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** screen_earnings
  - **description:** earnings.tsx ekranını güncelle
  - **checked:** true
  - **comments:** Tüm componentleri entegre et
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

---

## Phase 3: Mobile - Ödeme Yönetimi (02-ODEME-YONETIMI.md)

- [x] **id:** hooks_payment
  - **description:** usePaymentMethods + usePayoutRequests + useAutoPayoutSettings hooks
  - **checked:** true
  - **comments:** 02-ODEME-YONETIMI.md referans, 3 ayrı hook
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_payout_summary
  - **description:** PayoutSummaryCard component
  - **checked:** true
  - **comments:** Çekilebilir bakiye, bekleyen talep bilgisi
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [ ] **id:** comp_payment_method_status
  - **description:** PaymentMethodStatus alert kartı
  - **checked:** false
  - **comments:** Eklenmemiş/Bekliyor/Onaylı/Reddedildi durumları
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_payment_method_list
  - **description:** PaymentMethodList + PaymentMethodCard components
  - **checked:** true
  - **comments:** Banka/Kripto ayrımı, varsayılan badge
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** sheet_add_payment
  - **description:** AddBankAccountSheet + AddCryptoWalletSheet
  - **checked:** true
  - **comments:** IBAN validasyonu, ağ seçimi
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** sheet_create_payout
  - **description:** CreatePayoutSheet component
  - **checked:** true
  - **comments:** Slider, kur kilitleme, özet
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_auto_payout
  - **description:** AutoPayoutSettings component
  - **checked:** true
  - **comments:** Toggle, minimum miktar, yöntem seçimi
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** comp_payout_history
  - **description:** PayoutHistoryList + PayoutRequestCard + PayoutDetailSheet
  - **checked:** true
  - **comments:** Durum geçmişi timeline
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** screen_payment_methods
  - **description:** revenue.tsx (payment-methods) ekranı güncellendi
  - **checked:** true
  - **comments:** Yeni ekran, navigation entegrasyonu
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

---

## Phase 4: Mobile - KYC (04-KYC-DOGRULAMA.md)

- [x] **id:** packages_kyc
  - **description:** KYC için gerekli paketleri kur ve development build oluştur
  - **checked:** true
  - **comments:** VisionCamera zaten mevcut, expo-file-system kullanılıyor
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** hook_kyc_verification
  - **description:** useKYCVerification hook oluştur
  - **checked:** true
  - **comments:** 04-KYC-DOGRULAMA.md referans, step management, upload progress
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_kyc_status_card
  - **description:** KYCStatusCard component
  - **checked:** true
  - **comments:** Doğrulanmamış/Beklemede/Onaylandı durumları
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** comp_kyc_overlays
  - **description:** IDCaptureOverlay + SelfieCaptureOverlay components
  - **checked:** true
  - **comments:** Kimlik çerçevesi, oval yüz çerçevesi
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** high

- [x] **id:** screens_kyc_flow
  - **description:** KYC wizard ekranları oluştur
  - **checked:** true
  - **comments:** 6 ekran: index, form, id-front, id-back, selfie, result
  - **assignee:** mobile-dev
  - **subtasks:**
    - [x] **id:** screen_kyc_index
      - **description:** /kyc/index.tsx - KYC durumu kartı
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** screen_kyc_form
      - **description:** /kyc/form.tsx - Kişisel bilgi formu
      - **checked:** true
      - **comments:** TC validasyonu, tarih picker
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** screen_kyc_id_front
      - **description:** /kyc/id-front.tsx - Kimlik ön yüz
      - **checked:** true
      - **comments:** VisionCamera, overlay, ipuçları
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** screen_kyc_id_back
      - **description:** /kyc/id-back.tsx - Kimlik arka yüz
      - **checked:** true
      - **comments:** bilgi yok
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** screen_kyc_selfie
      - **description:** /kyc/selfie.tsx - Selfie çekimi
      - **checked:** true
      - **comments:** Oval overlay, yüz algılama feedback
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
    - [x] **id:** screen_kyc_result
      - **description:** /kyc/result.tsx - Sonuç ekranı
      - **checked:** true
      - **comments:** Başarı/hata durumları
      - **assignee:** mobile-dev
      - **subtasks:** bilgi yok
      - **priority:** high
  - **priority:** high

---

## Phase 5: Realtime & Bildirimler

- [x] **id:** realtime_subscriptions
  - **description:** Tüm realtime subscription'ı ekle
  - **checked:** true
  - **comments:** useCreatorRealtime hook oluşturuldu
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** medium

- [x] **id:** push_notifications
  - **description:** KYC ve payout durum değişikliği bildirimleri
  - **checked:** true
  - **comments:** useCreatorNotifications hook + 07-REALTIME-NOTIFICATIONS.md dokümantasyonu
  - **assignee:** mobile-dev
  - **subtasks:** bilgi yok
  - **priority:** low

---

## Notlar

- Her görev tamamlandığında checked: true yapılmalı
- Sorun çıkarsa comments'a not ekle
- Öncelik sırası: high → medium → low
- Edge functions için Supabase MCP server kullan
- VisionCamera plugins için development build gerekli
