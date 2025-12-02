# IBAN ve KYC Validasyon Dokümantasyonu

## TR IBAN Formatı

### Yapı
Türkiye IBAN'ı toplam **26 karakter**den oluşur:

```
TR33 0006 1005 1978 6457 8413 26
│ │  │    │    │    │    │    │
│ │  │    │    │    │    │    └── Son 2 karakter (hesap no parçası)
│ │  │    │    │    │    └─────── Hesap numarası devamı
│ │  │    │    │    └──────────── Hesap numarası devamı  
│ │  │    │    └───────────────── Hesap numarası devamı
│ │  │    └────────────────────── Şube kodu + Hesap numarası
│ │  └─────────────────────────── Banka kodu (4 rakam)
│ └────────────────────────────── Rezerv karakter (her zaman 0)
└──────────────────────────────── Kontrol basamağı (2 rakam)
└──────────────────────────────── Ülke kodu (TR)
```

### Detaylı Format
| Pozisyon | Uzunluk | Açıklama              | Örnek               |
| -------- | ------- | --------------------- | ------------------- |
| 1-2      | 2       | Ülke kodu             | TR                  |
| 3-4      | 2       | Kontrol basamağı      | 33                  |
| 5-8      | 4       | Banka kodu            | 0006                |
| 9        | 1       | Rezerv (her zaman 0)  | 0                   |
| 10-26    | 17      | Şube + Hesap numarası | 1005197864578413 26 |

### Toplam: 26 karakter

## IBAN Validasyonu

### 1. Format Kontrolü
```typescript
// Regex ile kontrol
const isValidFormat = /^TR[0-9]{24}$/.test(iban);
```

### 2. Mod97 Checksum Kontrolü (ISO 7064)

```typescript
function validateIbanChecksum(iban: string): boolean {
  // 1. İlk 4 karakteri sona taşı
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  
  // 2. Harfleri sayıya çevir (T=29, R=27)
  let numericIban = "";
  for (const char of rearranged) {
    if (char >= "A" && char <= "Z") {
      numericIban += (char.charCodeAt(0) - 55).toString();
    } else {
      numericIban += char;
    }
  }
  
  // 3. Mod 97 hesapla (parça parça - büyük sayı desteği)
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i += 7) {
    const chunk = remainder.toString() + numericIban.slice(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }
  
  // 4. Sonuç 1 olmalı
  return remainder === 1;
}
```

### 3. Örnek Validasyon

```typescript
// TR33 0006 1005 1978 6457 8413 26
// 1. Yeniden düzenle: 0006100519786457841326TR33
// 2. Harfleri çevir: 0006100519786457841326292733
// 3. Mod 97 hesapla: 0006100519786457841326292733 % 97 = 1 ✓
```

## KYC Entegrasyonu

### Banka Hesabı Ekleme Akışı

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. Kullanıcı "Banka Hesabı Ekle" butonuna basar       │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. KYC Durumu Kontrol Edilir                          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ kycStatus === 'approved' ?                        │ │
│  │                                                   │ │
│  │ HAYIR → Uyarı göster:                            │ │
│  │         "KYC doğrulaması gerekli"                │ │
│  │         ❌ Form disabled                          │ │
│  │                                                   │ │
│  │ EVET → Devam et                                  │ │
│  │        ✅ Form enabled                            │ │
│  │        ✅ Hesap sahibi = verifiedName             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  3. Form Doldurulur                                    │
│                                                         │
│  • Banka: [Seçim/Yazım]                                │
│  • IBAN: [TR__ ____ ____ ____ ____ ____ __]           │
│          ✓ Real-time validasyon                        │
│          ✓ Mod97 checksum kontrolü                     │
│          ✓ 26 karakter sayacı                          │
│  • Hesap Sahibi: [Auto-filled from KYC]               │
│                  🔒 Düzenlenemez (KYC onaylı ise)      │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  4. Submit Kontrolü                                    │
│                                                         │
│  ✓ IBAN formatı geçerli mi?                           │
│  ✓ IBAN checksum doğru mu?                            │
│  ✓ Hesap sahibi = verifiedName mi?                    │
│  ✓ Banka seçilmiş mi?                                 │
│                                                         │
│  Tüm kontroller geçtiyse → API'ye gönder              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Neden KYC Gerekli?

1. **Fraud Önleme**: Başkasının banka hesabına para göndermemek için
2. **Yasal Zorunluluk**: Para transferlerinde kimlik doğrulama gerekli
3. **IBAN-İsim Eşleşmesi**: Hesap sahibinin kimlik bilgileriyle eşleşmesi
4. **Vergi Uyumu**: Gelir beyanı için doğru kişi bilgisi

### Veri Akışı

```typescript
// KYC'den gelen veriler
interface KYCProfile {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  verifiedName: string;    // "Ali Yılmaz"
  tcNumber?: string;       // "12345678901" (opsiyonel - veritabanında encrypted)
  birthDate?: string;      // "1990-01-15" (opsiyonel)
}

// Banka hesabı ekleme
interface BankAccountSubmit {
  bankName: string;
  iban: string;            // "TR330006100519786457841326"
  accountHolder: string;   // === verifiedName olmalı
  isDefault: boolean;
}

// Validasyon
if (accountHolder !== verifiedName) {
  throw new Error("Hesap sahibi KYC ile eşleşmiyor");
}
```

## Güvenlik Notları

### TC Kimlik Numarası
- **Nerede saklanır**: `creator_kyc_profiles.tc_number` (encrypted)
- **Ne zaman alınır**: KYC formu doldurulurken
- **Kim görebilir**: Sadece sistem (admin bile göremez hash'li)
- **Banka hesabında gerekli mi**: HAYIR - sadece KYC'de bir kez alınır

### Doğum Tarihi
- **Nerede saklanır**: `creator_kyc_profiles.birth_date`
- **Ne zaman alınır**: KYC formu doldurulurken
- **Yaş kontrolü**: 18+ olmalı
- **Banka hesabında gerekli mi**: HAYIR - sadece KYC'de bir kez alınır

### IBAN
- **Nerede saklanır**: `payment_methods.account_details` (JSON)
- **Görüntüleme**: Maskelenmiş (TR33 **** **** **** **** **** 26)
- **Validasyon**: Format + Mod97 checksum

## Component Kullanımı

```tsx
import { AddBankAccountSheet } from "@/components/creator/payments";
import { useKYCVerification } from "@/hooks/creator";

function PaymentMethodsScreen() {
  const { profile: kycProfile } = useKYCVerification();
  const [showAddBank, setShowAddBank] = useState(false);

  return (
    <>
      <Button onPress={() => setShowAddBank(true)}>
        Banka Hesabı Ekle
      </Button>

      <AddBankAccountSheet
        visible={showAddBank}
        onClose={() => setShowAddBank(false)}
        onSubmit={handleAddBank}
        isSubmitting={false}
        verifiedName={kycProfile?.verifiedName}
        kycStatus={kycProfile?.status || 'none'}
      />
    </>
  );
}
```

## Test Senaryoları

### 1. KYC Onaylı Olmayan Kullanıcı
- ❌ Form açılır ama uyarı gösterilir
- ❌ Submit butonu çalışmaz
- ✓ "KYC doğrulaması gerekli" mesajı

### 2. Geçersiz IBAN
- ✓ Real-time hata gösterimi
- ✓ Kırmızı border
- ✓ "IBAN kontrol basamağı hatalı" mesajı

### 3. Yanlış İsim
- ❌ Submit'te hata
- ✓ "Hesap sahibi adı, doğrulanmış kimlik bilgilerinizle eşleşmiyor"

### 4. Başarılı Ekleme
- ✓ IBAN formatı doğru
- ✓ Checksum geçerli
- ✓ İsim eşleşiyor
- ✓ API'ye gönderilir
- ✓ Onay bekliyor durumuna geçer

## Dosya Yapısı

```
apps/mobile/src/components/creator/payments/
├── AddBankAccountSheet.tsx  # IBAN validasyonu + KYC kontrolü
└── index.ts

apps/mobile/src/hooks/creator/
├── useKYCVerification.ts    # KYC profil ve durum yönetimi
└── index.ts

docs/mobile/tier-ozelliklerinin-kontrolu/creator-gelir-sistemi/
└── 08-IBAN-KYC-VALIDASYON.md  # Bu döküman
```
