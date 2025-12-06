# 💓 Pulse (Haptik Kalp Bağı) - Gelişmiş Teknik Dokümantasyon

## 1. Vizyon ve Konsept
**"Dijital dokunuş, fiziksel histir."**

Pulse, sadece bir titreşim gönderme aracı değil, yeni bir iletişim dilidir. Morse alfabesinin duygusal versiyonudur. İnsanların kilometrelerce uzaktan birbirlerinin varlığını "tenlerinde" hissetmelerini sağlar.

### Temel Mekanikler
*   **Sync Mode:** İki kullanıcının haptik motorları senkronize olur.
*   **Live Beat:** Apple Watch'tan alınan gerçek zamanlı kalp atış hızı (BPM) karşı tarafa titreşim frekansı olarak iletilir.
*   **Touch:** Ekrana yapılan her dokunuş, karşı tarafın telefonunda aynı şiddet ve noktada titreşime dönüşür.

---

## 2. Özellik Modları

### A. "Manual Tap" (Giriş Seviyesi)
*   **Lobby:** Özel 1:1 Pulse Odası.
*   **Aksiyon:** Ekranda dev bir "Kalp" veya "Yüzey" vardır. Kullanıcı A ekrana dokunduğunda (kısa, uzun, sert), Kullanıcı B'nin telefon motoru aynı pattern'i çalar.
*   **Use Case:** Uzaktaki sevgililer, "Uyudun mu?" demek yerine 3 kısa titreşim gönderir.

### B. "Heartbeat Sync" (Premium)
*   **Gereksinim:** Apple Watch veya Android Wear.
*   **Aksiyon:** Saatteki sensör kalp ritmini (örn. 85 BPM) okur. Karşı tarafın telefonu dakikada 85 kez, kalbin atış formuna (lub-dub) uygun şekilde titrer.
*   **Deneyim:** Telefonu elinde tutan kişi, adeta sevdiği kişinin kalbini avucunda tutuyormuş gibi hisseder.

### C. "Rhythm Game / Music Sync" (Eğlence)
*   **Aksiyon:** Çalan bir müziğin (Spotify/Local) baslarına göre her iki tarafın telefonu aynı anda titrer.
*   **Use Case:** Birlikte müzik dinleme deneyimi.

### D. "Heartbeat History" (NFT / Anı)
*   **Konsept:** Özel bir anın (örn. evlilik teklifi, ilk buluşma) kalp atış grafiği kaydedilir.
*   **Saklama:** Bu 30 saniyelik "Pulse Verisi", dijital bir anı olarak saklanabilir veya partnerine hediye edilebilir.

---

## 3. Engagement & Monetization (Gelir Modeli)

Bu özellik, uygulamanın "Premium" hissini artıran en büyük faktörlerdendir.

| Özellik | Model | Açıklama |
| :--- | :--- | :--- |
| **Standart Tap** | Ücretsiz | Basit titreşimler. |
| **Heartbeat Sync** | Coin/Dakika | Dakikası X Coin (Creator ile fan arasında). |
| **Vibe Packs** | In-App Purchase | Özel titreşim desenleri (örn. "Yağmur", "Kedi Mırıltısı", "Techno Beat"). |
| **Pulse Gift** | Tek Seferlik | Creator'a 10 saniyelik kendi kalp atışını "Hediye" olarak gönderme. |

---

## 4. Teknik Stack & Veri Protokolü

### Data Channel Paket Yapısı
LiveKit üzerinden gönderilen `Uint8Array` binary verisinin yapısı optimize edilmelidir.

```typescript
// PulsePacket Interface
interface PulsePacket {
  t: 'P' | 'H';      // Type: (P)ulse Tap veya (H)eartbeat Data
  i?: number;        // Intensity (0-100 float) - Tap için
  b?: number;        // BPM (40-200 int) - Heartbeat için
  d?: number;        // Duration (ms)
  ts: number;        // Timestamp (Gecikme hesaplama için)
}
```

### Apple HealthKit Entegrasyonu (`config-plugin` ile)

`app.json` içinde HealthKit izinleri yapılandırılmalıdır:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "Kalp ritminizi Pulse özelliği ile partnerinize hissettirmek için sağlık verilerine erişim izni gereklidir.",
        "NSHealthUpdateUsageDescription": "Pulse verilerini sağlık geçmişinize kaydetmek için izin gereklidir."
      }
    }
  }
}
```

---

## 5. Implementasyon Detayları (Gelişmiş)

### A. Haptik Motor Sürücüsü (`HapticEngine.ts`)

Farklı titreşim tiplerini yöneten servis.

```typescript
import * as Haptics from 'expo-haptics';
import RNHapticFeedback from 'react-native-haptic-feedback';

export const HapticEngine = {
  // Basit Vuruş
  tap: (intensity: number) => {
    if (intensity < 0.3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (intensity < 0.7) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Kalp Atışı Simülasyonu (Double Beat)
  heartbeat: () => {
    // "Lub-Dub" efekti
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: true,
    };
    
    // İlk vuruş (Lub)
    RNHapticFeedback.trigger('impactHeavy', options);
    
    // İkinci vuruş (Dub) - 100ms sonra
    setTimeout(() => {
        RNHapticFeedback.trigger('impactLight', options);
    }, 100);
  }
};
```

### B. BPM Senkronizasyon Döngüsü (`useHeartbeatSync.ts`)

```typescript
import { useEffect, useRef } from 'react';
import { HapticEngine } from '@/services/HapticEngine';

export const useHeartbeatSync = (bpm: number | null) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!bpm || bpm <= 0) return;

        // BPM'i MS cinsinden aralığa çevir (60 BPM = 1000ms)
        const msPerBeat = (60 / bpm) * 1000;

        intervalRef.current = setInterval(() => {
            HapticEngine.heartbeat();
        }, msPerBeat);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [bpm]);
};
```

---

## 6. UX İyileştirmeleri

*   **Aura Visuals:** Titreşim geldiğinde ekranın kenarlarında "Neon Glow" efekti parlamalıdır (`react-native-reanimated` ile opacity animasyonu).
*   **Privacy Curtain:** Pulse ekranındayken mesaj içerikleri veya diğer bildirimler gizlenmelidir.
*   **Connection Quality:** Ping süresi 100ms üzerindeyse "Zayıf Bağlantı - Hissiyat Gecikebilir" uyarısı verilmelidir.

## 7. Roadmap

1.  **Faz 1:** Manual Tap + Visual Feedback.
2.  **Faz 2:** Apple Watch BPM entegrasyonu + Heartbeat pattern.
3.  **Faz 3:** Monetization (Paket satışı) + NFT History.
