# 🩸 Dead Man's Switch (Panik Modu & Biyometrik Kilit) - Gelişmiş Teknik Dokümantasyon

## 1. Vizyon ve Konsept
**"Güvenlik, hissedilmeyen bir reflekstir."**

Dead Man's Switch (DMS), kullanıcının fiziksel güvenliğini dijital gizlilikle birleştiren askeri sınıf bir panik sistemidir. Sadece bir uygulama özelliği değil, kullanıcının "Shadow Identity"sini koruyan son savunma hattıdır.

### Temel Mekanikler
*   **Shadow Zone:** Kullanıcı "Shadow Identity" modundayken sistem "Armed" (Tetik Teyakkuzda) durumundadır.
*   **Trigger (Tetik):** Fiziksel bir olay (parmak çekme, düşme, zorlama) sistemi "Panic State"e sokar.
*   **Decoy (Yem):** Sistem kapandığında siyah ekran vermez; tamamen fonksiyonel bir "Yem Uygulama"ya dönüşür.

---

## 2. Trigger Modları (Tetikleyiciler)

### A. "Touch Release" (Bas-Çek) - *Varsayılan*
En güvenilir ve yanlış alarm oranı en düşük yöntemdir.
*   **Mekanizma:** Shadow içeriği sadece kullanıcı parmağını ekranın belirli bir bölgesinde (örn. sol alt köşe) basılı tuttuğu sürece görünür.
*   **Aksiyon:** Parmak çekildiği an (Release), 50ms içinde Decoy UI devreye girer.

### B. "Gyro Drop" (Düşme/Darbe)
Ani müdahaleler için.
*   **Mekanizma:** Accelerometer 2.5G üzerinde ani bir ivme (telefonun elden düşmesi veya masaya sertçe bırakılması) algılarsa tetiklenir.
*   **Hassasiyet:** Ayarlardan "Düşük/Orta/Yüksek" olarak seçilebilir.

### C. "Duress PIN" (Zorlama Şifresi)
Kullanıcı fiziksel olarak tehdit altında şifre girmeye zorlanırsa.
*   **Mekanizma:** Kullanıcı "Gerçek PIN" (örn. 1234) yerine önceden belirlediği "Duress PIN" (örn. 9999) girer.
*   **Aksiyon:** Uygulama açılır, ancak Shadow verileri **görünürde silinmiş** veya **boş** gelir. Opsiyonel olarak sunucuya sessiz bir "Tehdit Altındayım" sinyali gönderir.

### D. "Smart Watch Detonator"
*   **Mekanizma:** Apple Watch üzerindeki komplikasyona tek dokunuş veya Digital Crown'a uzun basış, telefondaki Shadow oturumunu kilitler.

---

## 3. Decoy UI Modları (Yem Arayüzler)

Sistem tetiklendiğinde hangi "Maske"nin takılacağı seçilebilir:

1.  **Hesap Makinesi:** Tamamen çalışan bir hesap makinesi. (Özel bir matematik işlemi shadow'u geri getirir).
2.  **Borsa/Kripto:** Sahte (veya gerçek API ile) bir grafik ekranı. "Ben sadece piyasaları takip ediyorum" imajı için.
3.  **Haber Akışı:** RSS tabanlı teknoloji veya spor haberleri.
4.  **Not Defteri:** Masum bir alışveriş listesi.

---

## 4. Teknik Stack & Mimari

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Global State** | `zustand` + `persist` | `isPanicMode`, `activeDecoy`, `securityLevel` state'leri. `AsyncStorage` üzerinde şifreli saklanır. |
| **Hardware** | `react-native-sensors` | `setUpdateIntervalForType(SensorTypes.accelerometer, 100);` (100ms polling). |
| **Gesture** | `react-native-gesture-handler` | `State.BEGAN` -> `State.END` geçişi panic trigger'dır. |
| **Animation** | `react-native-reanimated` | UI değişimi `LayoutAnimation` kullanılmadan, opacity manipülasyonu ile <16ms (1 frame) içinde olmalıdır. |
| **Remote** | `useOpsRealtime` | Admin panelinden gönderilen `FORCE_PANIC` komutunu dinler. |

---

## 5. Implementasyon Detayları

### A. Panic Store (`shadow.store.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DecoyType = 'CALCULATOR' | 'STOCKS' | 'NEWS';

interface ShadowState {
  isPanicMode: boolean;
  decoyType: DecoyType;
  duressPin: string | null;
  triggerPanic: () => void;
  resetPanic: (pin: string) => boolean;
}

export const useShadowStore = create<ShadowState>()(
  persist(
    (set, get) => ({
      isPanicMode: false,
      decoyType: 'CALCULATOR',
      duressPin: '9999',
      
      triggerPanic: () => {
        // 1. Durumu değiştir
        set({ isPanicMode: true });
        // 2. Haptik geri bildirim (Kullanıcı anlasın)
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // 3. (Opsiyonel) Local veriyi geçici olarak unmount et
      },

      resetPanic: (pin) => {
        // Gerçek PIN kontrolü burada yapılır
        if (pin === 'REAL_PIN') {
            set({ isPanicMode: false });
            return true;
        }
        return false;
      }
    }),
    {
      name: 'shadow-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### B. Görünmez Tetikleyici (`TouchTrigger.tsx`)

Bu component, Shadow UI'ın en üst katmanında (Overlay) durur.

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';

export const TouchTrigger = ({ children }) => {
    const { triggerPanic } = useShadowStore();
    const isPressed = useSharedValue(false);

    const longPress = Gesture.LongPress()
        .minDuration(0) // Anında algıla
        .onStart(() => {
            isPressed.value = true;
        })
        .onFinalize(() => {
            // Parmak çekildiği an PANİK!
            isPressed.value = false;
            runOnJS(triggerPanic)();
        });

    return (
        <GestureDetector gesture={longPress}>
            <Animated.View style={{ flex: 1 }}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};
```

---

## 6. Güvenlik Senaryoları & Edge Cases

*   **Şarj Bitmesi:** Telefon kapandığında panic mode `persist` edildiği için, telefon açıldığında doğrudan Decoy modunda başlar.
*   **Arka Plana Atma:** Kullanıcı app'i background'a atarsa (`AppState` change), otomatik olarak Panic Mode tetiklenir.
*   **Screenshot:** Shadow modundayken screenshot alınırsa (`expo-screen-capture`), alınan görüntü simsiyah çıkar veya panic tetiklenir.

## 7. Roadmap & Gelecek

1.  **v1.0:** Touch Release + Calculator Decoy.
2.  **v1.5:** Duress PIN entegrasyonu.
3.  **v2.0:** Yapay Zeka Tabanlı Anomali Tespiti ("Bu saatte bu konumda Shadow açılmaz" diyerek oto-kilit).
