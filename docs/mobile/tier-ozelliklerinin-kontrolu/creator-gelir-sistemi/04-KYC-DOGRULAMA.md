# KYC Kimlik Doğrulama Sistemi

Bu döküman, creator'ların ödeme alabilmesi için gerekli kimlik doğrulama (KYC - Know Your Customer) sisteminin tasarımını açıklar.

---

## 📊 Genel Bakış

### Akış Özeti

Kullanıcıdan bilgileri alacağız → Kimlik tarayacağız → Kimlikteki bilgiler sistemdeki kullanıcının verdiği bilgilerle eşleşiyor mu kontrol edeceğiz → Selfie alacağız → Ops tarafında kimlik fotoğrafı ile selfie eşleşiyor mu görüntülenecek.

### Sistem Mimarisi (4 Katman)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. MOBILE (React Native + VisionCamera)          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  KYC Wizard: form → kimlik ön/arka → selfie                          │   │
│  │  Görsel çekimi + basit client-side kontroller                        │   │
│  │  Supabase Storage'a upload + Edge Function çağrıları                 │   │
│  │  Ekranlar: /apps/mobile/app/(creator)/kyc/*                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            2. SUPABASE DB                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  kyc_applications: tekil başvurular (form + doküman path + auto check)│   │
│  │  creator_kyc_profiles: son onaylı durum + limitler                   │   │
│  │  Trigger: onay durumunda profil otomatik güncellenir                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            3. EDGE FUNCTIONS                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  get-kyc-status: Mobile'a mevcut durumu verir                        │   │
│  │  submit-kyc-application: yeni KYC başvurusu oluşturur                │   │
│  │  verify-kyc-documents: OCR + face match (otomatik skor üretir)       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            4. WEB OPS PANEL (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Pending KYC listesi                                                 │   │
│  │  Detay: form bilgileri + kimlik ön/arka + selfie yan yana            │   │
│  │  Ops onayıyla creator_kyc_profiles güncellenir                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### KYC Seviyeleri

| Seviye               | Gereksinimler             | Özellikler                                     |
| -------------------- | ------------------------- | ---------------------------------------------- |
| **Seviye 0**         | Kayıt                     | Temel creator özellikleri                      |
| **Seviye 1 (Basic)** | Kimlik fotoğrafı + Selfie | Ödeme talebi oluşturabilir (limit: ₺10,000/ay) |
| **Seviye 2 (Full)**  | Basic + Adres belgesi     | Limitsiz ödeme                                 |

### Doğrulama Akışı

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Form      │ ──▶ │  Kimlik    │ ──▶ │  Selfie    │ ──▶ │  Backend   │
│  Bilgileri │     │  Çekimi    │     │  Çekimi    │     │  Doğrulama │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                                                │
                                                                ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Sonuç     │ ◀── │  Ops       │ ◀── │  Auto      │ ◀── │  OCR +     │
│  Bildirimi │     │  İnceleme  │     │  Check     │     │  Face Match│
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

---

## 🎨 Mobile UI Tasarımı

### 1. KYC Durumu Kartı (Profil/Ayarlar)

**Doğrulanmamış:**
```
┌─────────────────────────────────────────────┐
│  🪪 Kimlik Doğrulama                        │
│                                             │
│  ⚠️ Doğrulanmamış                           │
│                                             │
│  Ödeme alabilmek için kimlik doğrulaması    │
│  yapman gerekiyor.                          │
│                                             │
│  [Doğrulamayı Başlat]                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Beklemede:**
```
┌─────────────────────────────────────────────┐
│  🪪 Kimlik Doğrulama                        │
│                                             │
│  ⏳ İnceleniyor                             │
│                                             │
│  Kimlik bilgilerin inceleniyor.             │
│  Genellikle 24-48 saat                      │
│  içinde sonuçlanır.                         │
│                                             │
│  Gönderilme: 03 Aralık 2025, 14:30          │
│                                             │
└─────────────────────────────────────────────┘
```

**Onaylandı:**
```
┌─────────────────────────────────────────────┐
│  🪪 Kimlik Doğrulama                        │
│                                             │
│  ✅ Doğrulandı (Basic)                      │
│                                             │
│  Minimum ödeme limiti: xxx              │

│  Aylık ödeme limiti: ₺10,000                │
│                                             │
│  [Full Doğrulamaya Yükselt]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. KYC Başlangıç Ekranı

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama                         │
├─────────────────────────────────────────────┤
│                                             │
│            🪪                               │
│                                             │
│      Kimlik Doğrulaması                     │
│                                             │
│  Ödeme alabilmek için kimliğini             │
│  doğrulaman gerekiyor. Bu işlem             │
│  güvenliğin için önemli.                    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📋 Gerekli Belgeler                        │
│                                             │
│  • TC Kimlik Kartı (ön + arka yüz)          │
│  • Yüzünün net göründüğü selfie             │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  ⏱️ Tahmini Süre: 2-3 dakika                │
│                                             │
│  🔒 Verileriniz KVKK uyumlu şekilde         │
│  şifrelenerek saklanır.                     │
│                                             │
│  [Başla]                                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. Kişisel Bilgi Formu

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama           Adım 1/4      │
├─────────────────────────────────────────────┤
│                                             │
│  📝 Kişisel Bilgiler                        │
│                                             │
│  Bu bilgiler kimliğindeki bilgilerle        │
│  eşleşmelidir.                              │
│                                             │
│  Ad                                         │
│  ┌─────────────────────────────────────┐    │
│  │ Ali                                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Soyad                                      │
│  ┌─────────────────────────────────────┐    │
│  │ Yılmaz                              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Doğum Tarihi                               │
│  ┌─────────────────────────────────────┐    │
│  │ 15 / 06 / 1990                      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  TC Kimlik No                               │
│  ┌─────────────────────────────────────┐    │
│  │ 12345678901                         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Devam →]                                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. Kimlik Kartı Çekimi - Ön Yüz

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama           Adım 2/4      │
├─────────────────────────────────────────────┤
│                                             │
│  🪪 Kimlik Kartı - Ön Yüz                   │
│                                             │
│  Kimlik kartının ön yüzünü çerçeve          │
│  içine yerleştir.                           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │   ┌───────────────────────────┐     │    │
│  │   │                           │     │    │
│  │   │   📷 KAMERA ALANI         │     │    │
│  │   │                           │     │    │
│  │   │   ┌─────────────────┐     │     │    │
│  │   │   │  Kimlik kartını │     │     │    │
│  │   │   │  buraya yerleşt.│     │     │    │
│  │   │   └─────────────────┘     │     │    │
│  │   │                           │     │    │
│  │   └───────────────────────────┘     │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  💡 İpuçları:                               │
│  • Aydınlık bir ortamda çek                 │
│  • Yansıma olmamasına dikkat et             │
│  • Kartın tamamı görünmeli                  │
│                                             │
│  [📸 Fotoğraf Çek]                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 5. Kimlik Kartı Onay

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama           Adım 2/4      │
├─────────────────────────────────────────────┤
│                                             │
│  🪪 Kimlik Kartı - Ön Yüz                   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │   [Çekilen kimlik fotoğrafı]        │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ✅ Kontrol Listesi                         │
│                                             │
│  ☑️ Kimlik kartı net görünüyor              │
│  ☑️ Tüm köşeler görünüyor                   │
│  ☑️ Yazılar okunabilir                      │
│                                             │
│  [Tekrar Çek]         [Onayla ve Devam →]   │
│                                             │
└─────────────────────────────────────────────┘
```

### 6. Selfie Çekimi

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama           Adım 4/4      │
├─────────────────────────────────────────────┤
│                                             │
│  🤳 Selfie Doğrulama                        │
│                                             │
│  Yüzünü oval çerçeve içine yerleştir.       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │            ╭───────╮                │    │
│  │           ╱         ╲               │    │
│  │          │           │              │    │
│  │          │   📷      │              │    │
│  │          │           │              │    │
│  │           ╲         ╱               │    │
│  │            ╰───────╯                │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ✅ Yüz algılandı                           │
│  ✅ Yeterli aydınlık                        │
│  ⏳ Daha yaklaş...                          │
│                                             │
│  💡 İpuçları:                               │
│  • Gözlük veya şapka çıkar                  │
│  • Düz bir ifadeyle bak                     │
│                                             │
│  [📸 Fotoğraf Çek]                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 7. Liveness Check (Opsiyonel)

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama                         │
├─────────────────────────────────────────────┤
│                                             │
│  🔄 Canlılık Doğrulaması                    │
│                                             │
│  Lütfen aşağıdaki hareketi yap:             │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │            ╭───────╮                │    │
│  │           ╱   →     ╲               │    │
│  │          │   BAŞINI  │              │    │
│  │          │   SAĞA    │              │    │
│  │          │   ÇEVİR   │              │    │
│  │           ╲         ╱               │    │
│  │            ╰───────╯                │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ████████████░░░░░░░░░░  %60                │
│                                             │
│  ✅ Düz bak - Tamam                         │
│  ⏳ Başını sağa çevir...                    │
│  ○ Gözünü kırp                              │
│                                             │
└─────────────────────────────────────────────┘
```

### 8. Gönderim ve Sonuç

```
┌─────────────────────────────────────────────┐
│  ← Kimlik Doğrulama                         │
├─────────────────────────────────────────────┤
│                                             │
│            ✅                               │
│                                             │
│      Başvurun Alındı!                       │
│                                             │
│  Kimlik doğrulama başvurun başarıyla        │
│  gönderildi. Genellikle 24-48 saat          │
│  içinde sonuçlanır.                         │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📋 Gönderilen Bilgiler                     │
│                                             │
│  Ad Soyad: Ali Yılmaz                       │
│  Doğum Tarihi: 15.06.1990                   │
│  Kimlik Ön Yüz: ✅                          │
│  Kimlik Arka Yüz: ✅                        │
│  Selfie: ✅                                 │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Sonuç bildirimi için push notification     │
│  alacaksın.                                 │
│                                             │
│  [Tamam]                                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### React Native Paketleri

#### Zorunlu Paketler

| Paket                        | Açıklama                                           |
| ---------------------------- | -------------------------------------------------- |
| `react-native-vision-camera` | Kamera & frame processor core (zaten projede var)  |
| `react-native-permissions`   | Kamera izin yönetimi (Expo bare/Prebuild için)     |
| `expo-image-picker`          | Galeri fallback için                               |
| `expo-file-system`           | Local dosya okuma / Supabase Storage upload helper |
| `@supabase/supabase-js`      | Edge function ve storage çağrıları (projede var)   |

#### KYC için Önerilen VisionCamera Plugin'leri (Opsiyonel ama Güzel)

Plugin list ve plugin linkleri dökümasyonlarını context7 mcpden detaylı incele, başka pluginler olabilir. https://react-native-vision-camera.com/docs/guides/frame-processor-plugins-community
| Paket                                         | Amaç                                                   |
| --------------------------------------------- | ------------------------------------------------------ |
| `vision-camera-dynamsoft-document-normalizer` | Kimlik kartını düzgün crop + perspektif düzeltme       |
| `react-native-vision-camera-face-detector`    | Client-side yüz algılama ("tek yüz var mı, pozda mı?") |
| `vision-camera-base64`                        | Frame → base64 (genelde photo capture yeterli)         |

#### UI / Form Tarafı (İsteğe Bağlı)

| Paket             | Amaç                                        |
| ----------------- | ------------------------------------------- |
| `react-hook-form` | KYC form validasyonu                        |
| `zod`             | Schema bazlı validation (tarih, TC formatı) |

> **Not:** `react-native-vision-camera-face-detector` sadece UX iyileştirme içindir. Gerçek biometric face match backend'de veya Ops'ta yapılır.

### Type Definitions

```typescript
// KYC durumları
export type KYCStatus = 
  | 'not_started'    // Başlamadı
  | 'pending'        // İnceleniyor
  | 'approved'       // Onaylandı
  | 'rejected';      // Reddedildi

export type KYCLevel = 'none' | 'basic' | 'full';

// KYC başvurusu
export interface KYCApplication {
  id: string;
  creatorId: string;
  level: KYCLevel;
  status: KYCStatus;
  
  // Form bilgileri
  firstName: string;
  lastName: string;
  birthDate: string;
  idNumber: string;
  
  // Dokümanlar
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  livenessFrames?: string[];    // Liveness için ek kareler
  
  // Doğrulama sonuçları
  verificationResult?: {
    nameMatch: boolean;
    birthdateMatch: boolean;
    faceMatch: boolean;
    faceMatchScore: number;     // 0-1 arası
    livenessPass: boolean;
    ocrData?: {
      extractedName: string;
      extractedBirthdate: string;
      extractedIdNumber: string;
    };
  };
  
  // Admin işlemleri
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  internalNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Creator KYC profili
export interface CreatorKYCProfile {
  creatorId: string;
  level: KYCLevel;
  status: KYCStatus;
  verifiedName?: string;
  monthlyPayoutLimit: number;   // TL cinsinden
  lastApplication?: KYCApplication;
}
```

### useKYCVerification Hook

```typescript
// /apps/mobile/src/hooks/useKYCVerification.ts

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as FileSystem from 'expo-file-system';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface KYCFormData {
  firstName: string;
  lastName: string;
  birthDate: string;    // ISO format: YYYY-MM-DD TR TARİH FORMATI OLMALI
  idNumber: string;     // TC Kimlik No (11 hane)
}

interface KYCProfile {
  level: 'none' | 'basic' | 'full';
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  verifiedName?: string;
  monthlyPayoutLimit?: number;
  lastApplicationId?: string;
}

interface UploadProgress {
  idFront: number;
  idBack: number;
  selfie: number;
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useKYCVerification() {
  // State
  const [step, setStep] = useState(0);  // 0: form, 1: id-front, 2: id-back, 3: selfie, 4: review
  const [formData, setFormData] = useState<KYCFormData | null>(null);
  const [idFrontPhoto, setIdFrontPhoto] = useState<string | null>(null);
  const [idBackPhoto, setIdBackPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [livenessFrames, setLivenessFrames] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ idFront: 0, idBack: 0, selfie: 0 });
  
  const [status, setStatus] = useState<KYCStatus>('not_started');
  const [profile, setProfile] = useState<KYCProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const applicationIdRef = useRef<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Load KYC Status (profil/ayarlar ekranında çağrılır)
  // ─────────────────────────────────────────────────────────
  const loadKYCStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-kyc-status');
      
      if (fnError) throw fnError;
      
      setStatus(data.status);
      setProfile(data.profile || null);
      
      return data;
    } catch (err: any) {
      console.error('[KYC] Load status error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Step 1: Form bilgilerini kaydet
  // ─────────────────────────────────────────────────────────
  const saveFormData = useCallback((data: KYCFormData) => {
    // TC Kimlik No validasyonu
    if (data.idNumber && data.idNumber.length !== 11) {
      setError('TC Kimlik No 11 haneli olmalıdır');
      return false;
    }
    
    setFormData(data);
    setError(null);
    setStep(1);
    return true;
  }, []);

  // ─────────────────────────────────────────────────────────
  // Step 2: Kimlik ön yüz
  // ─────────────────────────────────────────────────────────
  const captureIdFront = useCallback((uri: string) => {
    setIdFrontPhoto(uri);
    setStep(2);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Step 3: Kimlik arka yüz
  // ─────────────────────────────────────────────────────────
  const captureIdBack = useCallback((uri: string) => {
    setIdBackPhoto(uri);
    setStep(3);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Step 4: Selfie
  // ─────────────────────────────────────────────────────────
  const captureSelfie = useCallback((uri: string) => {
    setSelfiePhoto(uri);
    setStep(4);  // Review ekranına geç
  }, []);

  // ─────────────────────────────────────────────────────────
  // Liveness Frames (opsiyonel)
  // ─────────────────────────────────────────────────────────
  const addLivenessFrame = useCallback((uri: string) => {
    setLivenessFrames(prev => [...prev, uri].slice(-5));  // Max 5 frame
  }, []);

  // ─────────────────────────────────────────────────────────
  // Upload Helper
  // ─────────────────────────────────────────────────────────
  const uploadPhoto = async (
    uri: string, 
    type: 'id_front' | 'id_back' | 'selfie',
    userId: string,
    applicationId: string
  ): Promise<string> => {
    // Base64 olarak oku
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Blob oluştur
    const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob());
    
    // Path: kyc/{userId}/{applicationId}/{type}.jpg
    const filePath = `kyc/${userId}/${applicationId}/${type}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, blob, { 
        contentType: 'image/jpeg',
        upsert: true 
      });
    
    if (error) throw error;
    
    // Progress update
    setUploadProgress(prev => ({ ...prev, [type.replace('_', '')]: 100 }));
    
    return data.path;
  };

  // ─────────────────────────────────────────────────────────
  // Submit Application
  // ─────────────────────────────────────────────────────────
  const submitApplication = useCallback(async () => {
    // Validation
    if (!formData) {
      return { success: false, error: 'Form bilgileri eksik' };
    }
    if (!idFrontPhoto) {
      return { success: false, error: 'Kimlik ön yüz fotoğrafı eksik' };
    }
    if (!idBackPhoto) {
      return { success: false, error: 'Kimlik arka yüz fotoğrafı eksik' };
    }
    if (!selfiePhoto) {
      return { success: false, error: 'Selfie fotoğrafı eksik' };
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress({ idFront: 0, idBack: 0, selfie: 0 });

    try {
      // User ID al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      // Application ID oluştur (upload için)
      const applicationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      applicationIdRef.current = applicationId;

      // 1. Fotoğrafları paralel upload et
      const [idFrontPath, idBackPath, selfiePath] = await Promise.all([
        uploadPhoto(idFrontPhoto, 'id_front', user.id, applicationId),
        uploadPhoto(idBackPhoto, 'id_back', user.id, applicationId),
        uploadPhoto(selfiePhoto, 'selfie', user.id, applicationId),
      ]);

      // 2. Liveness frames (varsa)
      let livenessFramePaths: string[] = [];
      if (livenessFrames.length > 0) {
        livenessFramePaths = await Promise.all(
          livenessFrames.map((uri, i) => 
            uploadPhoto(uri, `liveness_${i}` as any, user.id, applicationId)
          )
        );
      }

      // 3. Edge function'a gönder
      const { data, error: fnError } = await supabase.functions.invoke('submit-kyc-application', {
        body: {
          level: 'basic',
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: formData.birthDate,
          idNumber: formData.idNumber,
          idFrontPath,
          idBackPath,
          selfiePath,
          livenessFrames: livenessFramePaths,
        }
      });

      if (fnError) throw fnError;

      // 4. Status güncelle
      setStatus('pending');
      
      return { success: true, application: data.application };

    } catch (err: any) {
      console.error('[KYC] Submit error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, idFrontPhoto, idBackPhoto, selfiePhoto, livenessFrames]);

  // ─────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep(0);
    setFormData(null);
    setIdFrontPhoto(null);
    setIdBackPhoto(null);
    setSelfiePhoto(null);
    setLivenessFrames([]);
    setError(null);
    setUploadProgress({ idFront: 0, idBack: 0, selfie: 0 });
    applicationIdRef.current = null;
  }, []);

  // ─────────────────────────────────────────────────────────
  // Navigation helpers
  // ─────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
  }, []);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 0 && targetStep <= 4) {
      setStep(targetStep);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────
  return {
    // State
    step,
    status,
    profile,
    formData,
    idFrontPhoto,
    idBackPhoto,
    selfiePhoto,
    livenessFrames,
    
    // Loading states
    isLoading,
    isSubmitting,
    uploadProgress,
    error,
    
    // Actions
    loadKYCStatus,
    saveFormData,
    captureIdFront,
    captureIdBack,
    captureSelfie,
    addLivenessFrame,
    submitApplication,
    reset,
    goBack,
    goToStep,
    
    // Computed
    canSubmit: !!(formData && idFrontPhoto && idBackPhoto && selfiePhoto),
    totalProgress: Math.round(
      (uploadProgress.idFront + uploadProgress.idBack + uploadProgress.selfie) / 3
    ),
  };
}
```

---

## 🖥️ Backend Doğrulama

### Doğrulama Mimarisi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOĞRULAMA AKIŞI                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. submit-kyc-application                                                  │
│     └─▶ kyc_applications'a kayıt (status: pending)                          │
│     └─▶ verify-kyc-documents'ı async tetikle                                │
│                                                                             │
│  2. verify-kyc-documents (internal/cron)                                    │
│     ├─▶ OCR Microservice çağır (Node/Python)                               │
│     │   └─▶ Kimlikten isim, TC, doğum tarihi çıkar                         │
│     │                                                                       │
│     ├─▶ Face Match Microservice çağır                                       │
│     │   └─▶ Kimlik fotoğrafı ile selfie karşılaştır                        │
│     │   └─▶ Benzerlik skoru döndür (0.0 - 1.0)                             │
│     │                                                                       │
│     ├─▶ Form bilgileri ile OCR sonuçlarını karşılaştır                     │
│     │   └─▶ nameMatch, birthdateMatch, idNumberMatch                       │
│     │                                                                       │
│     └─▶ Sonuç hesapla                                                       │
│         ├─▶ auto_score: 0.00 - 1.00                                        │
│         └─▶ auto_recommendation: auto_approve | manual_review | auto_reject │
│                                                                             │
│  3. Ops Panel                                                               │
│     └─▶ auto_recommendation'ı öneri olarak kullanır                        │
│     └─▶ Final karar insan tarafından verilir                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### OCR + Face Match Microservice (Self-Hosted)

> **Önemli:** OCR ve Face Match işlemleri CPU/GPU yoğun işlemler olduğundan, bunları Supabase Edge Functions içinde değil ayrı bir container/worker olarak çalıştırmak önerilir.

#### OCR Seçenekleri

| Teknoloji      | Dil    | Açıklama                              |
| -------------- | ------ | ------------------------------------- |
| `tesseract.js` | Node   | Hafif, çoğu durumda yeterli           |
| `pytesseract`  | Python | opencv-python ile birlikte daha güçlü |
| Google Vision  | API    | En yüksek doğruluk, maliyetli         |
| AWS Textract   | API    | Yüksek doğruluk, maliyetli            |

#### Face Match Seçenekleri

| Teknoloji       | Dil    | Açıklama                            |
| --------------- | ------ | ----------------------------------- |
| `insightface`   | Python | Güçlü, ücretsiz, GPU önerilir       |
| `deepface`      | Python | Kolay kullanım, çoklu model desteği |
| AWS Rekognition | API    | Yüksek doğruluk, maliyetli          |

#### Örnek Python Microservice Yapısı

```python
# /services/kyc-verification/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import cv2
import pytesseract
from insightface.app import FaceAnalysis

app = FastAPI()
face_app = FaceAnalysis(name='buffalo_l')
face_app.prepare(ctx_id=0, det_size=(640, 640))

class OCRRequest(BaseModel):
    image_url: str

class FaceMatchRequest(BaseModel):
    id_image_url: str
    selfie_url: str

@app.post("/ocr")
async def perform_ocr(req: OCRRequest):
    # Görseli indir ve OCR uygula
    # ...
    return {
        "extractedName": "ALI YILMAZ",
        "extractedBirthdate": "1990-06-15",
        "extractedIdNumber": "12345678901"
    }

@app.post("/face-match")
async def compare_faces(req: FaceMatchRequest):
    # Yüzleri karşılaştır
    # ...
    return {
        "isMatch": True,
        "score": 0.92
    }
```

### Edge Function: verify-kyc-documents

```typescript
// /supabase/functions/verify-kyc-documents/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface VerificationResult {
  nameMatch: boolean;
  birthdateMatch: boolean;
  idNumberMatch: boolean;
  faceMatch: boolean;
  faceMatchScore: number;
  livenessPass: boolean;
  ocrData?: {
    extractedName: string;
    extractedBirthdate: string;
    extractedIdNumber: string;
  };
  overallScore: number;
  recommendation: 'auto_approve' | 'manual_review' | 'auto_reject';
}

serve(async (req) => {
  const { applicationId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Başvuruyu al
  const { data: application } = await supabase
    .from('kyc_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (!application) {
    return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
  }

  // 2. OCR - Kimlikten bilgi çıkar
  const ocrResult = await performOCR(application.id_front_url);

  // 3. Form bilgileri ile OCR sonuçlarını karşılaştır
  const nameMatch = normalizeAndCompare(
    `${application.first_name} ${application.last_name}`,
    ocrResult.extractedName
  );
  
  const birthdateMatch = application.birth_date === ocrResult.extractedBirthdate;

  // 4. Yüz eşleştirme
  const faceMatchResult = await compareFaces(
    application.id_front_url,
    application.selfie_url
  );

  // 5. Liveness kontrolü (varsa)
  const livenessPass = application.liveness_frames 
    ? await checkLiveness(application.liveness_frames)
    : true; // Liveness yoksa geç

  // 6. Sonuç skoru hesapla
  const overallScore = calculateScore({
    nameMatch,
    birthdateMatch,
    faceMatch: faceMatchResult.isMatch,
    faceMatchScore: faceMatchResult.score,
    livenessPass,
  });

  // 7. Öneri belirle
  let recommendation: VerificationResult['recommendation'];
  if (overallScore >= 0.85 && faceMatchResult.score >= 0.75) {
    recommendation = 'auto_approve';
  } else if (overallScore >= 0.5) {
    recommendation = 'manual_review';
  } else {
    recommendation = 'auto_reject';
  }

  const result: VerificationResult = {
    nameMatch,
    birthdateMatch,
    faceMatch: faceMatchResult.isMatch,
    faceMatchScore: faceMatchResult.score,
    livenessPass,
    ocrData: ocrResult,
    overallScore,
    recommendation,
  };

  // 8. Sonucu kaydet
  await supabase
    .from('kyc_applications')
    .update({
      verification_result: result,
      status: recommendation === 'auto_approve' ? 'approved' 
            : recommendation === 'auto_reject' ? 'rejected' 
            : 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  return new Response(JSON.stringify({ success: true, result }));
});

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

const KYC_MICROSERVICE_URL = Deno.env.get("KYC_MICROSERVICE_URL") || "http://kyc-service:8000";

async function performOCR(imagePath: string): Promise<{
  extractedName: string;
  extractedBirthdate: string;
  extractedIdNumber: string;
}> {
  try {
    // Storage'dan signed URL al
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const { data: signedUrl } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(imagePath, 3600);
    
    if (!signedUrl?.signedUrl) {
      throw new Error('Failed to get signed URL for image');
    }

    // OCR microservice'i çağır
    const response = await fetch(`${KYC_MICROSERVICE_URL}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: signedUrl.signedUrl }),
    });
    
    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('[KYC] OCR error:', err);
    // Fallback: boş döndür, manuel inceleme gerekir
    return {
      extractedName: '',
      extractedBirthdate: '',
      extractedIdNumber: '',
    };
  }
}

async function compareFaces(
  idImagePath: string, 
  selfiePath: string
): Promise<{ isMatch: boolean; score: number }> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Signed URL'ler al
    const [idUrl, selfieUrl] = await Promise.all([
      supabase.storage.from('kyc-documents').createSignedUrl(idImagePath, 3600),
      supabase.storage.from('kyc-documents').createSignedUrl(selfiePath, 3600),
    ]);
    
    if (!idUrl.data?.signedUrl || !selfieUrl.data?.signedUrl) {
      throw new Error('Failed to get signed URLs');
    }

    // Face match microservice'i çağır
    const response = await fetch(`${KYC_MICROSERVICE_URL}/face-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_image_url: idUrl.data.signedUrl,
        selfie_url: selfieUrl.data.signedUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Face match service error: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      isMatch: result.score >= 0.7,  // %70 üstü eşleşme
      score: result.score,
    };
  } catch (err) {
    console.error('[KYC] Face match error:', err);
    // Fallback: manuel inceleme gerekir
    return { isMatch: false, score: 0 };
  }
}

async function checkLiveness(frames: string[]): Promise<boolean> {
  // Liveness detection (basit implementasyon)
  // Gerçek implementasyonda: farklı açılardaki yüzleri analiz et
  return frames.length >= 3;  // En az 3 frame varsa geçer
}

function normalizeAndCompare(str1: string, str2: string): boolean {
  const normalize = (s: string) => s
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, ' ')
    .trim();
  
  const n1 = normalize(str1);
  const n2 = normalize(str2);
  
  // Tam eşleşme veya içerme kontrolü
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

function calculateScore(params: {
  nameMatch: boolean;
  birthdateMatch: boolean;
  idNumberMatch?: boolean;
  faceMatch: boolean;
  faceMatchScore: number;
  livenessPass: boolean;
}): number {
  let score = 0;
  
  // İsim eşleşmesi: %25
  if (params.nameMatch) score += 0.25;
  
  // Doğum tarihi eşleşmesi: %15
  if (params.birthdateMatch) score += 0.15;
  
  // TC Kimlik No eşleşmesi: %10 (opsiyonel)
  if (params.idNumberMatch) score += 0.10;
  
  // Yüz eşleştirme: %25 (skor bazlı)
  if (params.faceMatch) {
    score += 0.25 * params.faceMatchScore;
  }
  
  // Canlılık kontrolü: %25
  if (params.livenessPass) score += 0.25;
  
  return Math.min(1, score);  // Max 1.0
}
```

---

## 🖥️ Web Ops KYC Yönetimi

### KYC Başvuru Listesi

```
┌─────────────────────────────────────────────────────────────────┐
│  KYC Başvuruları                                                │
│                                                                 │
│  [Tümü] [⏳ Bekleyen (15)] [✅ Onaylı] [❌ Reddedilmiş]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Creator   │ Ad Soyad    │ Skor  │ Öneri    │ Tarih │ Durum │ │
│  ├───────────┼─────────────┼───────┼──────────┼───────┼───────┤ │
│  │ @creator1 │ Ali Yılmaz  │ %92   │ Oto-Onayla│ 2 saat│ ⏳    │ │
│  │ @creator2 │ Ayşe Demir  │ %68   │ Manuel   │ 4 saat│ ⏳    │ │
│  │ @creator3 │ Mehmet Kaya │ %35   │ Oto-Red  │ 1 gün │ ❌    │ │
│  └───────────┴─────────────┴───────┴──────────┴───────┴───────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### KYC Detay Sayfası

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← KYC Başvuru Detayı                                    [Onayla] [Reddet]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┬────────────────────────────────────────┐│
│  │         SOL PANEL               │           SAĞ PANEL                    ││
│  │                                 │                                        ││
│  │  � Creator: @creator_username  │   🪪 Belgeler (Yan Yana Görünüm)        ││
│  │  📧 Email: ***@***.com          │                                        ││
│  │  📅 Başvuru: 03.12.2025 14:30   │   ┌─────────────┐ ┌─────────────┐      ││
│  │                                 │   │             │ │             │      ││
│  │  ─────────────────────────────  │   │   KİMLİK    │ │   SELFİE    │      ││
│  │                                 │   │   ÖN YÜZ    │ │             │      ││
│  │  📋 Form Bilgileri              │   │             │ │             │      ││
│  │  ┌───────────────────────────┐  │   │ [Büyüt 🔍]  │ │ [Büyüt 🔍]  │      ││
│  │  │ Ad:          Ali          │  │   └─────────────┘ └─────────────┘      ││
│  │  │ Soyad:       Yılmaz       │  │                                        ││
│  │  │ Doğum:       15.06.1990   │  │   ┌─────────────┐                      ││
│  │  │ TC Kimlik:   123****901   │  │   │             │                      ││
│  │  └───────────────────────────┘  │   │   KİMLİK    │                      ││
│  │                                 │   │   ARKA YÜZ  │                      ││
│  │  ─────────────────────────────  │   │             │                      ││
│  │                                 │   │ [Büyüt 🔍]  │                      ││
│  │  🔍 Otomatik Doğrulama          │   └─────────────┘                      ││
│  │  ┌───────────────────────────┐  │                                        ││
│  │  │ OCR İsim:    ✅ Eşleşiyor │  │   📊 Yüz Karşılaştırma                 ││
│  │  │ OCR Doğum:   ✅ Eşleşiyor │  │   ┌───────────────────────────────┐    ││
│  │  │ Yüz Match:   ✅ %92       │  │   │                               │    ││
│  │  │ Canlılık:    ✅ Geçti     │  │   │   Kimlik Fotoğrafı   Selfie   │    ││
│  │  │ ─────────────────────────-│  │   │       [👤]    ↔️     [👤]      │    ││
│  │  │ Genel Skor:  %92          │  │   │                               │    ││
│  │  │ Öneri:       ✅ Onayla    │  │   │   Benzerlik Skoru: %92        │    ││
│  │  └───────────────────────────┘  │   │   ██████████████░░░░ %92       │    ││
│  │                                 │   │                               │    ││
│  │  ─────────────────────────────  │   └───────────────────────────────┘    ││
│  │                                 │                                        ││
│  │  📝 Admin Notu                  │                                        ││
│  │  ┌───────────────────────────┐  │                                        ││
│  │  │ [Not ekle...]             │  │                                        ││
│  │  └───────────────────────────┘  │                                        ││
│  │                                 │                                        ││
│  │  ❌ Reddetme Sebebi (opsiyonel) │                                        ││
│  │  ┌───────────────────────────┐  │                                        ││
│  │  │ [Seçiniz...]              │  │                                        ││
│  │  │ • Kimlik okunamıyor       │  │                                        ││
│  │  │ • Yüz eşleşmiyor          │  │                                        ││
│  │  │ • Belge geçersiz          │  │                                        ││
│  │  │ • Diğer                   │  │                                        ││
│  │  └───────────────────────────┘  │                                        ││
│  │                                 │                                        ││
│  └─────────────────────────────────┴────────────────────────────────────────┘│
│                                                                              │
│  [❌ Reddet]                                              [✅ Onayla]        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Web Ops API Routes

```typescript
// /apps/web/app/api/ops/kyc/route.ts

// GET - KYC başvurularını listele
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // pending, approved, rejected
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = createClient();
  
  let query = supabase
    .from('kyc_applications')
    .select(`
      id,
      creator_id,
      level,
      status,
      first_name,
      last_name,
      auto_score,
      auto_recommendation,
      created_at,
      profiles!creator_id (
        username,
        avatar_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .range((page - 1) * limit, page * limit - 1);

  return Response.json({ 
    applications: data, 
    total: count, 
    page, 
    limit 
  });
}
```

```typescript
// /apps/web/app/api/ops/kyc/[id]/route.ts

// GET - Tek başvuru detayı
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: application, error } = await supabase
    .from('kyc_applications')
    .select(`
      *,
      profiles!creator_id (
        user_id,
        username,
        avatar_url,
        email
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !application) {
    return Response.json({ error: 'Application not found' }, { status: 404 });
  }

  // Signed URLs oluştur (görüntüleme için)
  const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
    supabase.storage.from('kyc-documents').createSignedUrl(application.id_front_path, 3600),
    supabase.storage.from('kyc-documents').createSignedUrl(application.id_back_path, 3600),
    supabase.storage.from('kyc-documents').createSignedUrl(application.selfie_path, 3600),
  ]);

  return Response.json({
    ...application,
    idFrontUrl: idFrontUrl.data?.signedUrl,
    idBackUrl: idBackUrl.data?.signedUrl,
    selfieUrl: selfieUrl.data?.signedUrl,
  });
}

// PATCH - Başvuruyu onayla/reddet
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { action, rejectionReason, internalNotes } = await req.json();
  
  // Admin kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  // ... admin check ...

  const updateData: any = {
    status: action, // 'approved' veya 'rejected'
    reviewed_by: user?.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (action === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  if (internalNotes) {
    updateData.internal_notes = internalNotes;
  }

  const { data, error } = await supabase
    .from('kyc_applications')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  // Trigger otomatik olarak creator_kyc_profiles'ı günceller

  return Response.json({ success: true, application: data });
}
```

---

## 📁 Dosya Yapısı

### Mobile

```
/apps/mobile/src/
├── app/(creator)/
│   └── kyc/
│       ├── index.tsx             # KYC durumu/başlangıç
│       ├── form.tsx              # Kişisel bilgi formu
│       ├── id-front.tsx          # Kimlik ön yüz çekimi
│       ├── id-back.tsx           # Kimlik arka yüz çekimi
│       ├── selfie.tsx            # Selfie çekimi
│       ├── liveness.tsx          # Liveness check (opsiyonel)
│       └── result.tsx            # Sonuç ekranı
├── components/kyc/
│   ├── index.ts
│   ├── KYCStatusCard.tsx
│   ├── IDCaptureOverlay.tsx
│   ├── SelfieCaptureOverlay.tsx
│   ├── LivenessChallenge.tsx
│   └── DocumentPreview.tsx
└── hooks/
    └── useKYCVerification.ts
```

### Web Ops

```
/apps/web/app/ops/(private)/
└── kyc/
    ├── page.tsx                  # KYC listesi
    └── [applicationId]/
        └── page.tsx              # Başvuru detay
```

---

## 📦 Supabase Storage Bucket

```sql
-- kyc-documents bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,  -- Private bucket
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS Policies for kyc-documents bucket
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = 'kyc' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Service role can access all KYC documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'kyc-documents');
```

---

## ✅ Implementation Checklist

### Phase 1: Database & Storage

- [ ] `kyc_applications` tablosu oluştur
- [ ] `creator_kyc_profiles` tablosu oluştur
- [ ] KYC onay trigger'ı oluştur
- [ ] `kyc-documents` storage bucket oluştur
- [ ] Storage RLS policies ekle
- [ ] Realtime publications ekle

### Phase 2: Edge Functions

- [ ] `get-kyc-status` edge function deploy et
- [ ] `submit-kyc-application` edge function deploy et
- [ ] `verify-kyc-documents` edge function deploy et
- [ ] KYC_MICROSERVICE_URL env variable ekle

### Phase 3: Mobile - Paket Kurulumu

- [ ] `react-native-vision-camera` kurulu (zaten var)
- [ ] `react-native-permissions` kur
- [ ] `expo-file-system` kur
- [ ] `vision-camera-dynamsoft-document-normalizer` kur (opsiyonel)
- [ ] `react-native-vision-camera-face-detector` kur (opsiyonel)
- [ ] Development build oluştur (native modüller için)

### Phase 4: Mobile - Ekranlar

- [ ] `/app/(creator)/kyc/index.tsx` - KYC durumu kartı
- [ ] `/app/(creator)/kyc/form.tsx` - Kişisel bilgi formu
- [ ] `/app/(creator)/kyc/id-front.tsx` - Kimlik ön yüz çekimi
- [ ] `/app/(creator)/kyc/id-back.tsx` - Kimlik arka yüz çekimi
- [ ] `/app/(creator)/kyc/selfie.tsx` - Selfie çekimi
- [ ] `/app/(creator)/kyc/liveness.tsx` - Liveness check (opsiyonel)
- [ ] `/app/(creator)/kyc/result.tsx` - Sonuç ekranı

### Phase 5: Mobile - Components & Hooks

- [ ] `useKYCVerification` hook oluştur
- [ ] `KYCStatusCard` component
- [ ] `IDCaptureOverlay` component (çerçeve + ipuçları)
- [ ] `SelfieCaptureOverlay` component (oval çerçeve)
- [ ] `DocumentPreview` component
- [ ] `LivenessChallenge` component (opsiyonel)

### Phase 6: Web Ops Panel

- [ ] `/app/ops/(private)/kyc/page.tsx` - Başvuru listesi
- [ ] `/app/ops/(private)/kyc/[applicationId]/page.tsx` - Detay sayfası
- [ ] `/app/api/ops/kyc/route.ts` - List API
- [ ] `/app/api/ops/kyc/[id]/route.ts` - Detail & Update API
- [ ] Belge görüntüleme (yan yana kimlik + selfie)
- [ ] Onay/Red işlemleri

### Phase 7: OCR & Face Match Microservice (Opsiyonel)

- [ ] Python FastAPI servisi oluştur
- [ ] pytesseract + opencv-python kurulumu
- [ ] insightface veya deepface kurulumu
- [ ] `/ocr` endpoint
- [ ] `/face-match` endpoint
- [ ] Docker container oluştur
- [ ] Deploy (Railway, Fly.io, veya self-host)

### Phase 8: KVKK Uyumluluk

- [ ] Veri şifreleme (storage'da ve DB'de)
- [ ] Erişim logları (audit trail)
- [ ] Veri saklama süresi politikası (ör: 5 yıl)
- [ ] Veri silme prosedürü
- [ ] Kullanıcı aydınlatma metni

---

## 🔗 İlgili Dökümanlar

- [Database Schema (05)](./05-DATABASE-SCHEMA.md) - `kyc_applications`, `creator_kyc_profiles` tabloları
- [Edge Functions (06)](./06-EDGE-FUNCTIONS.md) - `submit-kyc-application`, `verify-kyc-documents`
- [Gelir Raporu (01)](./01-GELIR-RAPORU.md) - Creator bakiye ve kazanç sistemi
- [Ödeme Yönetimi (02)](./02-ODEME-YONETIMI.md) - Ödeme talebi için KYC gereksinimi
- [README](./README.md) - Genel bakış
