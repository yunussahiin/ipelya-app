# react-native-vision-camera-ocr-plus

## Genel Bilgi

ML Kit tabanlı OCR (Optical Character Recognition) plugin'i. Kimlik kartı üzerindeki yazıları gerçek zamanlı olarak okur.

**Kullanım Alanları:**
- KYC form otomatik doldurma
- Kimlik bilgisi doğrulama (OCR sonucu vs kullanıcı girişi)
- TC Kimlik No formatı kontrolü

---

## Kurulum

```bash
yarn add react-native-vision-camera-ocr-plus
cd ios && pod install
```

**Peer Dependencies:**
- `react-native-vision-camera` (>=4.0.0)
- `react-native-worklets-core` (>=1.0.0)

---

## API Reference

### useTextRecognition Hook

```typescript
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';

const { scanText } = useTextRecognition({
  language: 'latin' // Türkçe karakterler için 'latin' kullan
});
```

### Desteklenen Diller

| Dil        | Kod          | Açıklama                       |
| ---------- | ------------ | ------------------------------ |
| Latin      | `latin`      | Türkçe, İngilizce, Almanca vb. |
| Chinese    | `chinese`    | Çince karakterler              |
| Japanese   | `japanese`   | Japonca                        |
| Korean     | `korean`     | Korece                         |
| Devanagari | `devanagari` | Hint dilleri                   |

### OCR Sonuç Yapısı

```typescript
interface OCRResult {
  resultText: string;        // Tüm metin (birleşik)
  blocks: TextBlock[];       // Metin blokları
}

interface TextBlock {
  text: string;              // Blok metni
  lines: TextLine[];         // Satırlar
  boundingBox: BoundingBox;  // Konum
  recognizedLanguages: string[];
}

interface TextLine {
  text: string;
  elements: TextElement[];   // Kelimeler
  boundingBox: BoundingBox;
}

interface TextElement {
  text: string;              // Tek kelime
  boundingBox: BoundingBox;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

## Kullanım Örnekleri

### 1. Basit OCR Okuma

```typescript
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { useFrameProcessor } from 'react-native-vision-camera';

function IDCardScanner() {
  const { scanText } = useTextRecognition({ language: 'latin' });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const result = scanText(frame);
    if (result?.resultText) {
      console.log('Okunan:', result.resultText);
    }
  }, [scanText]);

  return <Camera frameProcessor={frameProcessor} />;
}
```

### 2. TC Kimlik Bilgisi Çıkarma

```typescript
// apps/mobile/src/hooks/creator/useIDCardOCR.ts

import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

interface IDCardData {
  tcNumber?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  validUntil?: string;
}

export function useIDCardOCR() {
  const { scanText } = useTextRecognition({ language: 'latin' });

  /**
   * TC Kimlik No formatı: 11 haneli rakam
   * İlk hane 0 olamaz
   */
  const extractTCNumber = (text: string): string | undefined => {
    const tcRegex = /\b[1-9]\d{10}\b/g;
    const matches = text.match(tcRegex);
    
    if (matches && matches.length > 0) {
      // Algoritmik doğrulama
      for (const match of matches) {
        if (validateTCNumber(match)) {
          return match;
        }
      }
    }
    return undefined;
  };

  /**
   * TC Kimlik No algoritması
   * - 11 hane
   * - İlk 10 hanenin toplamı mod 10 = 11. hane
   * - Tek sıradaki rakamların toplamı * 7 - çift sıradaki toplamı mod 10 = 10. hane
   */
  const validateTCNumber = (tc: string): boolean => {
    if (tc.length !== 11) return false;
    if (tc[0] === '0') return false;

    const digits = tc.split('').map(Number);
    
    // 11. hane kontrolü
    const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    if (sum10 % 10 !== digits[10]) return false;

    // 10. hane kontrolü
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false;

    return true;
  };

  /**
   * Tarih çıkarma (GG.AA.YYYY formatı)
   */
  const extractDate = (text: string): string | undefined => {
    const dateRegex = /\b(\d{2})\.(\d{2})\.(\d{4})\b/g;
    const match = dateRegex.exec(text);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`; // ISO format
    }
    return undefined;
  };

  /**
   * İsim çıkarma (büyük harfli kelimeler)
   */
  const extractName = (text: string): { firstName?: string; lastName?: string } => {
    // TC kimlik kartında isimler büyük harfle yazılır
    const nameRegex = /\b[A-ZÇĞİÖŞÜ]{2,}\b/g;
    const matches = text.match(nameRegex);
    
    if (matches && matches.length >= 2) {
      // Genellikle soyad önce gelir
      return {
        lastName: matches[0],
        firstName: matches[1],
      };
    }
    return {};
  };

  /**
   * Frame'den kimlik bilgilerini çıkar
   */
  const parseIDCard = (ocrResult: any): IDCardData => {
    const text = ocrResult?.resultText || '';
    
    return {
      tcNumber: extractTCNumber(text),
      ...extractName(text),
      birthDate: extractDate(text),
    };
  };

  return {
    scanText,
    parseIDCard,
    validateTCNumber,
  };
}
```

### 3. Real-time ID Card Scanner Component

```typescript
// apps/mobile/src/components/creator/kyc/IDCardScanner.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useFrameProcessor, useCameraDevice } from 'react-native-vision-camera';
import { useIDCardOCR } from '@/hooks/creator/useIDCardOCR';
import { Worklets } from 'react-native-worklets-core';

interface Props {
  onDataExtracted: (data: IDCardData) => void;
}

export function IDCardScanner({ onDataExtracted }: Props) {
  const device = useCameraDevice('back');
  const { scanText, parseIDCard } = useIDCardOCR();
  
  const [extractedData, setExtractedData] = useState<IDCardData>({});
  const [confidence, setConfidence] = useState(0);

  const handleOCRResult = Worklets.createRunOnJS((data: IDCardData) => {
    // Birden fazla frame'de aynı TC algılanırsa güven artar
    setExtractedData(prev => {
      if (data.tcNumber && data.tcNumber === prev.tcNumber) {
        const newConfidence = Math.min(confidence + 0.1, 1);
        setConfidence(newConfidence);
        
        if (newConfidence >= 0.8) {
          onDataExtracted(data);
        }
      } else if (data.tcNumber) {
        setConfidence(0.1);
      }
      return data;
    });
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const result = scanText(frame);
    if (result?.resultText) {
      const data = parseIDCard(result);
      if (data.tcNumber) {
        handleOCRResult(data);
      }
    }
  }, [scanText, parseIDCard, handleOCRResult]);

  if (!device) return <Text>Kamera yükleniyor...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.cardFrame} />
        
        {extractedData.tcNumber && (
          <View style={styles.resultBox}>
            <Text style={styles.label}>TC: {extractedData.tcNumber}</Text>
            <Text style={styles.label}>
              Ad: {extractedData.firstName} {extractedData.lastName}
            </Text>
            <Text style={styles.confidence}>
              Güven: {Math.round(confidence * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFrame: {
    width: '90%',
    aspectRatio: 1.586, // Kredi kartı oranı
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  resultBox: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  confidence: {
    color: '#4CAF50',
    fontSize: 12,
  },
});
```

---

## KYC Entegrasyonu

### Form Otomatik Doldurma

```typescript
// KYC form.tsx içinde kullanım

const { parseIDCard } = useIDCardOCR();

// ID card çekildikten sonra
const handleIDCaptured = async (photoPath: string) => {
  // OCR ile bilgileri çıkar
  // Not: Statik fotoğraftan OCR için ayrı bir fonksiyon gerekli
  // Frame processor sadece live camera için çalışır
};

// Alternatif: Form bilgileriyle karşılaştır
const validateAgainstForm = (ocrData: IDCardData, formData: KYCFormData) => {
  const errors: string[] = [];
  
  if (ocrData.tcNumber && formData.idNumber) {
    if (ocrData.tcNumber !== formData.idNumber) {
      errors.push('TC Kimlik numarası eşleşmiyor');
    }
  }
  
  if (ocrData.firstName && formData.firstName) {
    if (ocrData.firstName.toLowerCase() !== formData.firstName.toLowerCase()) {
      errors.push('Ad eşleşmiyor');
    }
  }
  
  return errors;
};
```

---

## Performans İpuçları

1. **Frame Skip:** Her frame'i işleme, performans için 3-5 frame'de bir işle
2. **ROI (Region of Interest):** Sadece kimlik kartı alanını OCR'a gönder
3. **Debounce:** Sonuçları debounce et, sürekli state güncelleme

```typescript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  
  // Her 5 frame'de bir işle
  if (frameCount.value % 5 !== 0) {
    frameCount.value++;
    return;
  }
  frameCount.value++;
  
  const result = scanText(frame);
  // ...
}, [scanText]);
```

---

## Dosya Konumları

```
apps/mobile/src/
├── hooks/creator/
│   └── useIDCardOCR.ts          # OCR hook
└── components/creator/kyc/
    └── IDCardScanner.tsx        # Scanner component (opsiyonel)
```
