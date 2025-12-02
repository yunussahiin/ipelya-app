# Ödeme Yönetimi - Mobile Implementation

Bu döküman, creator'ların ödeme taleplerini ve ödeme yöntemlerini yönetmesini sağlayan sistemin detaylı tasarımını açıklar.

---

## 📊 Genel Bakış

Ödeme yönetimi sistemi 4 ana bileşenden oluşur:

1. **Ödeme Durumu Özeti** - Çekilebilir bakiye, bekleyen talepler
2. **Ödeme Yöntemleri** - Banka/Kripto hesap yönetimi
3. **Ödeme Talebi** - Manuel ve otomatik talep oluşturma
4. **Ödeme Geçmişi** - Geçmiş taleplerin listesi

---

## 🎨 UI Tasarımı

### 1. Ödeme Durumu Özeti

```
┌─────────────────────────────────────────────┐
│  💰 Ödeme Özeti                             │
├─────────────────────────────────────────────┤
│                                             │
│  Çekilebilir Bakiye                         │
│  🪙 8,450  (≈ ₺4,225)                       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ⏳ Bekleyen Talep: ₺2,000           │    │
│  │    Oluşturulma: 01 Aralık 2025      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ℹ️ Minimum ödeme: 500 coin (≈ ₺250)        │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Ödeme Yöntemi Durumu (Alert Kartı)

**Durum: Eklenmemiş**
```
┌─────────────────────────────────────────────┐
│  ⚠️ Ödeme Yöntemi Gerekli                   │
│                                             │
│  Ödeme alabilmek için önce bir ödeme        │
│  yöntemi eklemelisin.                       │
│                                             │
│  [+ Ödeme Yöntemi Ekle]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Durum: Onay Bekliyor**
```
┌─────────────────────────────────────────────┐
│  ⏳ Ödeme Yöntemi İnceleniyor               │
│                                             │
│  Banka hesap bilgilerin muhasebe departmanı tarafından      │
│  inceleniyor. Onaylandığında bildirim       │
│  alacaksın.                                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Durum: Onaylandı**
```
┌─────────────────────────────────────────────┐
│  ✅ Ödeme Yöntemlerin Hazır                 │
│                                             │
│  • Ziraat Bankası (****1234)                │
│  • TRC20 Wallet (****abcd)                  │
│                                             │
│  [Yönet →]                                  │
│                                             │
└─────────────────────────────────────────────┘
```

**Durum: Reddedildi**
```
┌─────────────────────────────────────────────┐
│  ❌ Ödeme Yöntemi Reddedildi                │
│                                             │
│  Sebep: IBAN numarası hatalı                │
│                                             │
│  [Düzenle]                                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. Ödeme Yöntemleri Ekranı

```
┌─────────────────────────────────────────────┐
│  ← Ödeme Yöntemleri                         │
├─────────────────────────────────────────────┤
│                                             │
│  🏦 Banka Hesapları                         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🏦 Ziraat Bankası           ✅ Onaylı│    │
│  │    TR12 0006 1234 5678 9012 3456    │    │
│  │    Ali Yılmaz                       │    │
│  │    ⭐ Varsayılan                    │    │
│  │                          [Düzenle]  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🏦 Akbank                   ⏳ Bekliyor│   │
│  │    TR98 0046 0001 2345 6789 0123    │    │
│  │    Ali Yılmaz                       │    │
│  │                          [Düzenle]  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [+ Banka Hesabı Ekle]                      │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  🔗 Kripto Cüzdanları                       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 💎 USDT (TRC20)             ✅ Onaylı│    │
│  │    TQn9Y2k...8hXz                   │    │
│  │                          [Düzenle]  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [+ Kripto Cüzdanı Ekle]                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. Banka Hesabı Ekleme Sheet

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  🏦 Banka Hesabı Ekle                       │
│                                             │
│  Banka                                      │
│  ┌─────────────────────────────────────┐    │
│  │ Seçiniz...                        ▼ │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  IBAN                                       │
│  ┌─────────────────────────────────────┐    │
│  │ TR__ ____ ____ ____ ____ ____ __   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Hesap Sahibi Ad Soyad                      │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│  ℹ️ Kimlik bilgilerinle aynı olmalı         │
│                                             │
│  ☐ Varsayılan ödeme yöntemi olarak ayarla   │
│                                             │
│  [Kaydet ve Onaya Gönder]                   │
│                                             │
│  ⚠️ Hesap bilgilerin Ipelya muhasebe departmanı tarafından         │
│  onaylandıktan sonra ödeme talebi           │
│  oluşturabilirsin.                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 5. Kripto Cüzdanı Ekleme Sheet

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  💎 Kripto Cüzdanı Ekle                     │
│                                             │
│  Ağ                                         │
│  ┌─────────────────────────────────────┐    │
│  │ ○ TRC20 (Tron)                      │    │
│  │ ○ ERC20 (Ethereum)                  │    │
│  │ ○ BEP20 (BSC)                       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Cüzdan Adresi                              │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ☐ Varsayılan ödeme yöntemi olarak ayarla   │
│                                             │
│  [Kaydet ve Onaya Gönder]                   │
│                                             │
│  ⚠️ Yanlış ağ veya adres nedeniyle          │
│  kaybolacak ödemelerden sorumluluk          │
│  kabul edilmez.                             │
│                                             │
└─────────────────────────────────────────────┘
```

### 6. Ödeme Talebi Oluşturma Sheet

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  💸 Ödeme Talebi Oluştur                    │
│                                             │
│  Çekilebilir Bakiye: 🪙 8,450 (≈ ₺4,225)    │
│                                             │
│  Çekmek İstediğin Miktar                    │
│  ┌─────────────────────────────────────┐    │
│  │          🪙 5,000                   │    │
│  └─────────────────────────────────────┘    │
│  ≈ ₺2,500                                   │
│                                             │
│  ├────────────●──────────────────────┤      │
│  500                              8,450     │
│                                             │
│  Ödeme Yöntemi                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🏦 Ziraat Bankası (****1234)      ▼ │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📋 Özet                                    │
│  Çekilecek: 🪙 5,000                        │
│  Kur: 1 coin = ₺0.50                        │
│  Net Tutar: ₺2,500                          │
│                                             │
│  ℹ️ Talebin muhasebe departmanı tarafından incelenecek.     │
│  Ortalama işlem süresi: 3-5 iş günü.        │
│                                             │
│  [Ödeme Talebi Oluştur]                     │
│                                             │
└─────────────────────────────────────────────┘
```

### 7. Otomatik Ödeme Ayarları

```
┌─────────────────────────────────────────────┐
│  🔄 Otomatik Ödeme                          │
├─────────────────────────────────────────────┤
│                                             │
│  Otomatik ödeme talebi              [ON/OFF]│
│                                             │
│  Her hafta pazartesi, bakiyen minimum       │
│  tutarın üzerindeyse otomatik ödeme         │
│  talebi oluşturulur.                        │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Minimum Miktar                             │
│  ┌─────────────────────────────────────┐    │
│  │ 🪙 1,000                          ▼ │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Ödeme Yöntemi                              │
│  ┌─────────────────────────────────────┐    │
│  │ 🏦 Ziraat Bankası (****1234)      ▼ │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Kaydet]                                   │
│                                             │
└─────────────────────────────────────────────┘
```

### 8. Ödeme Geçmişi

```
┌─────────────────────────────────────────────┐
│  📋 Ödeme Geçmişi                           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 💸 ₺2,500                   ✅ Ödendi│    │
│  │    Ziraat Bankası                   │    │
│  │    28 Kasım 2025                    │    │
│  │                              [Detay]│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 💸 ₺1,000               ⏳ Beklemede │    │
│  │    USDT TRC20                       │    │
│  │    01 Aralık 2025                   │    │
│  │                              [Detay]│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 💸 ₺500                  ❌ Reddedildi│   │
│  │    Akbank                           │    │
│  │    15 Kasım 2025                    │    │
│  │                              [Detay]│    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

### 9. Ödeme Detay Sheet

```
┌─────────────────────────────────────────────┐
│  ━━━━                                       │
│                                             │
│  💸 Ödeme Detayı                            │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Tutar                                      │
│  ₺2,500                                     │
│                                             │
│  Coin Karşılığı                             │
│  🪙 5,000                                   │
│                                             │
│  Uygulanan Kur                              │
│  1 coin = ₺0.50 (28 Kasım 2025)             │
│                                             │
│  Ödeme Yöntemi                              │
│  🏦 Ziraat Bankası                          │
│  TR12 0006 1234 5678 9012 3456              │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📍 Durum Geçmişi                           │
│                                             │
│  ✅ Ödendi                                  │
│     30 Kasım 2025 14:32                     │
│     │                                       │
│  ✅ Onaylandı                               │
│     29 Kasım 2025 10:15                     │
│     │                                       │
│  🔄 İnceleniyor                             │
│     28 Kasım 2025 16:00                     │
│     │                                       │
│  📝 Talep Oluşturuldu                       │
│     28 Kasım 2025 12:30                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Type Definitions

```typescript
// Ödeme yöntemi türleri
export type PaymentMethodType = 'bank' | 'crypto';
export type PaymentMethodStatus = 'pending' | 'approved' | 'rejected';
export type CryptoNetwork = 'TRC20' | 'ERC20' | 'BEP20';

// Ödeme talebi durumları
export type PayoutRequestStatus = 
  | 'pending'      // Beklemede
  | 'in_review'    // İnceleniyor
  | 'approved'     // Onaylandı
  | 'paid'         // Ödendi
  | 'rejected'     // Reddedildi
  | 'cancelled';   // İptal edildi

// Banka hesabı
export interface BankAccount {
  id: string;
  creatorId: string;
  bankName: string;
  bankCode: string;
  iban: string;
  accountHolder: string;
  isDefault: boolean;
  status: PaymentMethodStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Kripto cüzdanı
export interface CryptoWallet {
  id: string;
  creatorId: string;
  network: CryptoNetwork;
  walletAddress: string;
  isDefault: boolean;
  status: PaymentMethodStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Birleşik ödeme yöntemi
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  displayName: string;      // "Ziraat Bankası (****1234)"
  isDefault: boolean;
  status: PaymentMethodStatus;
  rejectionReason?: string;
  details: BankAccount | CryptoWallet;
}

// Ödeme talebi
export interface PayoutRequest {
  id: string;
  creatorId: string;
  coinAmount: number;
  tlAmount: number;
  coinRate: number;         // Kilitlenmiş kur
  rateLockedAt: string;
  paymentMethodId: string;
  paymentMethodType: PaymentMethodType;
  paymentMethodDisplayName: string;
  status: PayoutRequestStatus;
  rejectionReason?: string;
  internalNotes?: string;   // Creator görmez
  statusHistory: PayoutStatusChange[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

// Durum değişikliği kaydı
export interface PayoutStatusChange {
  status: PayoutRequestStatus;
  changedAt: string;
  changedBy?: string;       // Admin user_id
  note?: string;
}

// Otomatik ödeme ayarları
export interface AutoPayoutSettings {
  isEnabled: boolean;
  minimumCoinAmount: number;
  paymentMethodId: string;
  dayOfWeek: number;        // 1 = Pazartesi
}
```

---

## 🔧 Hook Implementations

### usePaymentMethods

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods');
      if (error) throw error;
      setMethods(data.methods);
    } catch (err) {
      console.error('Load payment methods error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  // Banka hesabı ekle
  const addBankAccount = async (data: {
    bankName: string;
    bankCode: string;
    iban: string;
    accountHolder: string;
    isDefault: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('add-payment-method', {
        body: { type: 'bank', ...data }
      });
      if (error) throw error;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kripto cüzdanı ekle
  const addCryptoWallet = async (data: {
    network: CryptoNetwork;
    walletAddress: string;
    isDefault: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('add-payment-method', {
        body: { type: 'crypto', ...data }
      });
      if (error) throw error;
      await loadMethods();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Varsayılan yap
  const setAsDefault = async (methodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-payment-method', {
        body: { methodId, isDefault: true }
      });
      if (error) throw error;
      await loadMethods();
    } catch (err) {
      console.error('Set default error:', err);
    }
  };

  // Sil
  const deleteMethod = async (methodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: { methodId }
      });
      if (error) throw error;
      await loadMethods();
    } catch (err) {
      console.error('Delete method error:', err);
    }
  };

  // Duruma göre filtrele
  const approvedMethods = methods.filter(m => m.status === 'approved');
  const pendingMethods = methods.filter(m => m.status === 'pending');
  const hasApprovedMethod = approvedMethods.length > 0;

  return {
    methods,
    approvedMethods,
    pendingMethods,
    hasApprovedMethod,
    isLoading,
    isSubmitting,
    addBankAccount,
    addCryptoWallet,
    setAsDefault,
    deleteMethod,
    refresh: loadMethods,
  };
}
```

### usePayoutRequests

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export function usePayoutRequests() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PayoutRequest | null>(null);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payout-requests');
      if (error) throw error;

      setRequests(data.requests);
      setPendingRequest(data.pendingRequest);
      setWithdrawableBalance(data.withdrawableBalance);
    } catch (err) {
      console.error('Load payout requests error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    // Realtime: Ödeme durumu değişince güncelle
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel(`payout-requests-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payout_requests',
            filter: `creator_id=eq.${session.user.id}`
          },
          () => {
            loadRequests();
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadRequests]);

  // Ödeme talebi oluştur
  const createRequest = async (data: {
    coinAmount: number;
    paymentMethodId: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-payout-request', {
        body: data
      });
      if (error) throw error;

      await loadRequests();
      return { success: true, request: result.request };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Talebi iptal et (sadece pending durumda)
  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-payout-request', {
        body: { requestId }
      });
      if (error) throw error;
      await loadRequests();
    } catch (err) {
      console.error('Cancel request error:', err);
    }
  };

  return {
    requests,
    pendingRequest,
    withdrawableBalance,
    hasPendingRequest: !!pendingRequest,
    isLoading,
    isSubmitting,
    createRequest,
    cancelRequest,
    refresh: loadRequests,
  };
}
```

### useAutoPayoutSettings

```typescript
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useAutoPayoutSettings() {
  const [settings, setSettings] = useState<AutoPayoutSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-auto-payout-settings');
      if (error) throw error;
      setSettings(data.settings);
    } catch (err) {
      console.error('Load auto payout settings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (data: Partial<AutoPayoutSettings>) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-auto-payout-settings', {
        body: data
      });
      if (error) throw error;
      await loadSettings();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAutoPayout = async (enabled: boolean) => {
    return updateSettings({ isEnabled: enabled });
  };

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    toggleAutoPayout,
    refresh: loadSettings,
  };
}
```

---

## 📱 Component Yapısı

```
/apps/mobile/src/
├── app/(creator)/
│   ├── earnings.tsx                    # Ana gelir ekranı
│   └── payment-methods.tsx             # Ödeme yöntemleri ekranı
├── components/creator/payout/
│   ├── index.ts
│   ├── PayoutSummaryCard.tsx          # Çekilebilir bakiye özeti
│   ├── PaymentMethodStatus.tsx        # Durum alert kartı
│   ├── PaymentMethodList.tsx          # Yöntem listesi
│   ├── PaymentMethodCard.tsx          # Tek yöntem kartı
│   ├── AddBankAccountSheet.tsx        # Banka ekleme sheet
│   ├── AddCryptoWalletSheet.tsx       # Kripto ekleme sheet
│   ├── CreatePayoutSheet.tsx          # Talep oluşturma sheet
│   ├── AutoPayoutSettings.tsx         # Otomatik ödeme ayarları
│   ├── PayoutHistoryList.tsx          # Ödeme geçmişi listesi
│   ├── PayoutRequestCard.tsx          # Tek ödeme kartı
│   └── PayoutDetailSheet.tsx          # Ödeme detay sheet
└── hooks/
    ├── usePaymentMethods.ts
    ├── usePayoutRequests.ts
    └── useAutoPayoutSettings.ts
```

---

## ✅ Checklist

### Mobile Implementation

- [ ] `usePaymentMethods` hook oluştur
- [ ] `usePayoutRequests` hook oluştur
- [ ] `useAutoPayoutSettings` hook oluştur
- [ ] `PayoutSummaryCard` component
- [ ] `PaymentMethodStatus` component
- [ ] `AddBankAccountSheet` component
- [ ] `AddCryptoWalletSheet` component
- [ ] `CreatePayoutSheet` component
- [ ] `AutoPayoutSettings` component
- [ ] `PayoutHistoryList` component
- [ ] `PayoutDetailSheet` component
- [ ] `/payment-methods` ekranı oluştur
- [ ] `earnings.tsx` ekranına ödeme section ekle

### Edge Functions

- [ ] `get-payment-methods`
- [ ] `add-payment-method`
- [ ] `update-payment-method`
- [ ] `delete-payment-method`
- [ ] `get-payout-requests`
- [ ] `create-payout-request`
- [ ] `cancel-payout-request`
- [ ] `get-auto-payout-settings`
- [ ] `update-auto-payout-settings`
