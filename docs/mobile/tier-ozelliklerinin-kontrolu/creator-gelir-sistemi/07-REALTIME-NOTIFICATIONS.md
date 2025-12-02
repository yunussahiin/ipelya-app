# Creator Gelir Sistemi - Realtime & Bildirimler

## Genel Bakış

Bu döküman, Creator Gelir Sistemi'ndeki realtime event'leri ve bildirim sistemini açıklar.

## Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Tables                                               │
│  ├── creator_transactions (INSERT trigger)                      │
│  ├── payout_requests (UPDATE trigger)                           │
│  ├── payment_methods (UPDATE trigger)                           │
│  └── creator_kyc_profiles (INSERT/UPDATE trigger)               │
│                                                                  │
│  Realtime Broadcast                                              │
│  └── Channel: creator:{user_id}                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ postgres_changes
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE APP                                  │
├─────────────────────────────────────────────────────────────────┤
│  useCreatorRealtime Hook                                         │
│  ├── Subscribes to Supabase Realtime                            │
│  ├── Filters events by creator_id                               │
│  └── Dispatches to callbacks                                     │
│                                                                  │
│  useCreatorNotifications Hook                                    │
│  ├── Listens to useCreatorRealtime                              │
│  ├── Shows in-app toast (foreground)                            │
│  └── Schedules push notification (background)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (for background)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WEB OPS (Opsiyonel)                         │
├─────────────────────────────────────────────────────────────────┤
│  Admin Panel Actions → Edge Functions                            │
│  ├── approve-payout-request → payout_requests UPDATE            │
│  ├── reject-payout-request → payout_requests UPDATE             │
│  ├── approve-payment-method → payment_methods UPDATE            │
│  ├── approve-kyc → creator_kyc_profiles UPDATE                  │
│  └── reject-kyc → creator_kyc_profiles UPDATE                   │
│                                                                  │
│  Bu işlemler otomatik olarak mobile'a realtime event gönderir   │
└─────────────────────────────────────────────────────────────────┘
```

## Event Türleri

### 1. new_earning
Yeni kazanç eklendi.

```typescript
interface NewEarningEvent {
  type: 'new_earning';
  data: {
    id: string;
    creator_id: string;
    type: 'subscription' | 'gift' | 'ppv' | 'tip';
    amount: number;
    description: string;
    metadata: Record<string, any>;
    created_at: string;
  };
}
```

**Tetikleyiciler:**
- Yeni abonelik satışı
- Hediye gönderimi
- PPV satışı
- Tip gönderimi

### 2. payout_status_changed
Ödeme talebi durumu değişti.

```typescript
interface PayoutStatusChangedEvent {
  type: 'payout_status_changed';
  data: {
    id: string;
    status: 'pending' | 'in_review' | 'approved' | 'paid' | 'rejected' | 'cancelled';
    coin_amount: number;
    tl_amount: number;
    rejection_reason?: string;
    paid_at?: string;
    payment_reference?: string;
  };
}
```

**Tetikleyiciler:**
- Web Ops: Ödeme onayı
- Web Ops: Ödeme reddi
- Sistem: Ödeme tamamlandı

### 3. payment_method_verified
Ödeme yöntemi durumu değişti.

```typescript
interface PaymentMethodVerifiedEvent {
  type: 'payment_method_verified';
  data: {
    id: string;
    type: 'bank' | 'crypto';
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
  };
}
```

**Tetikleyiciler:**
- Web Ops: Ödeme yöntemi onayı
- Web Ops: Ödeme yöntemi reddi

### 4. kyc_status_changed
KYC durumu değişti.

```typescript
interface KYCStatusChangedEvent {
  type: 'kyc_status_changed';
  data: {
    status: 'pending' | 'approved' | 'rejected';
    level: 'basic' | 'full';
    rejection_reason?: string;
    verified_at?: string;
  };
}
```

**Tetikleyiciler:**
- Sistem: Otomatik KYC doğrulama
- Web Ops: Manuel KYC onayı/reddi

## Mobile Kullanımı

### useCreatorRealtime

```typescript
import { useCreatorRealtime } from '@/hooks/creator';

function MyComponent() {
  useCreatorRealtime({
    onNewEarning: (transaction) => {
      console.log('Yeni kazanç:', transaction);
      // State güncelle, animasyon göster, vs.
    },
    onPayoutStatusChanged: (request) => {
      console.log('Ödeme durumu:', request.status);
      // UI güncelle
    },
    onPaymentMethodVerified: (method) => {
      console.log('Ödeme yöntemi:', method.status);
    },
    onKYCStatusChanged: (kyc) => {
      console.log('KYC durumu:', kyc.status);
    },
    enabled: true // false yaparak devre dışı bırakılabilir
  });

  return <View>...</View>;
}
```

### useCreatorNotifications

```typescript
import { useCreatorNotifications } from '@/hooks/creator';

function CreatorDashboardScreen() {
  // Otomatik olarak tüm creator event'lerini dinler
  // ve kullanıcıya bildirim gösterir
  useCreatorNotifications({
    showToasts: true,           // In-app toast göster
    sendPushNotifications: true, // Push notification gönder
    enabled: true
  });

  return <View>...</View>;
}
```

## Web Ops Entegrasyonu

### API Endpoints

Web Ops panelinden yapılan işlemler otomatik olarak realtime event tetikler:

| Endpoint                                     | Açıklama                      | Tetiklenen Event          |
| -------------------------------------------- | ----------------------------- | ------------------------- |
| `PATCH /api/ops/finance/payout-requests/:id` | Ödeme talebi durumu güncelle  | `payout_status_changed`   |
| `PATCH /api/ops/finance/payment-methods/:id` | Ödeme yöntemi durumu güncelle | `payment_method_verified` |
| `PATCH /api/ops/finance/kyc/:id`             | KYC durumu güncelle           | `kyc_status_changed`      |

### Örnek: Ödeme Onaylama

```typescript
// apps/web/app/api/ops/finance/payout-requests/[id]/route.ts

export async function PATCH(request: NextRequest, { params }) {
  const { id } = await params;
  const { action, rejection_reason } = await request.json();

  if (action === 'approve') {
    // 1. Status güncelle
    await adminSupabase
      .from('payout_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    // 2. Realtime event otomatik tetiklenir (postgres_changes)
    // Mobile app useCreatorRealtime ile bunu alır
  }

  if (action === 'reject') {
    await adminSupabase
      .from('payout_requests')
      .update({ status: 'rejected', rejection_reason })
      .eq('id', id);
  }

  return NextResponse.json({ success: true });
}
```

## Bildirim Metinleri

| Event                      | Başlık                     | İçerik                                          |
| -------------------------- | -------------------------- | ----------------------------------------------- |
| new_earning (subscription) | 🎉 Yeni Abone!              | Yeni bir abone kazandın! +{amount} coin         |
| new_earning (gift)         | 🎁 Hediye Aldın!            | Bir hayran sana hediye gönderdi! +{amount} coin |
| payout_approved            | ✓ Ödeme Onaylandı          | {coin_amount} coin çekim talebiniz onaylandı.   |
| payout_paid                | 💰 Ödeme Yapıldı!           | ₺{tl_amount} hesabınıza aktarıldı.              |
| payout_rejected            | ❌ Ödeme Reddedildi         | {rejection_reason}                              |
| payment_method_approved    | ✓ Ödeme Yöntemi Onaylandı  | Ödeme yönteminiz başarıyla doğrulandı.          |
| payment_method_rejected    | ❌ Ödeme Yöntemi Reddedildi | Ödeme yönteminiz doğrulanamadı.                 |
| kyc_approved               | 🎉 KYC Onaylandı!           | Kimlik doğrulamanız başarıyla tamamlandı.       |
| kyc_rejected               | ❌ KYC Reddedildi           | {rejection_reason}                              |

## Dosya Yapısı

```
apps/mobile/src/hooks/creator/
├── useCreatorRealtime.ts      # Realtime subscription hook
├── useCreatorNotifications.ts # Bildirim yönetimi hook
└── index.ts                   # Export'lar

docs/mobile/tier-ozelliklerinin-kontrolu/creator-gelir-sistemi/
└── 07-REALTIME-NOTIFICATIONS.md # Bu döküman
```

## Supabase Realtime Ayarları

### Gerekli RLS Policies

```sql
-- creator_transactions için realtime
ALTER PUBLICATION supabase_realtime ADD TABLE creator_transactions;

-- payout_requests için realtime  
ALTER PUBLICATION supabase_realtime ADD TABLE payout_requests;

-- payment_methods için realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_methods;

-- creator_kyc_profiles için realtime
ALTER PUBLICATION supabase_realtime ADD TABLE creator_kyc_profiles;
```

### Replica Identity

```sql
-- Full row data için (old ve new değerleri almak için)
ALTER TABLE creator_transactions REPLICA IDENTITY FULL;
ALTER TABLE payout_requests REPLICA IDENTITY FULL;
ALTER TABLE payment_methods REPLICA IDENTITY FULL;
ALTER TABLE creator_kyc_profiles REPLICA IDENTITY FULL;
```

## Test Senaryoları

### 1. Yeni Kazanç Testi
1. Test kullanıcısı olarak giriş yap
2. Başka bir hesaptan abonelik satın al
3. Creator dashboard'da toast görünmeli
4. Earnings listesi güncellenmiş olmalı

### 2. Ödeme Onay Testi
1. Creator olarak ödeme talebi oluştur
2. Web Ops'tan ödemeyi onayla
3. Mobile'da "Ödeme Onaylandı" bildirimi görünmeli

### 3. KYC Onay Testi
1. Creator olarak KYC başvurusu yap
2. Web Ops'tan KYC'yi onayla
3. Mobile'da "KYC Onaylandı" bildirimi görünmeli
4. Para çekme aktif olmalı

## Performans Notları

- Her creator için tek bir Supabase channel kullanılır
- Uygulama arka plandayken subscription devam eder
- Bellek sızıntısını önlemek için component unmount'ta unsubscribe yapılır
- Rate limiting: Supabase varsayılan limitler geçerli

## Hata Yönetimi

```typescript
useCreatorRealtime({
  onAnyEvent: (event) => {
    try {
      // Event işleme
    } catch (error) {
      console.error('[CreatorRealtime] Event processing failed:', error);
      // Sentry'ye gönder
    }
  }
});
```
