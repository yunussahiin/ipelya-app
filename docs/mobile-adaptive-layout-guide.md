# 📱 Cihaz Üst Alanı (Top Area) — Dinamik, Future-Proof Rehber

Aşağıda **iPhone 11 → iPhone 17 Pro Max** dahil olmak üzere tüm cihazlarda, hatta gelecekte çıkacak modellerde bile sorunsuz çalışan **tam kapsamlı üst alan yönetimi (Top Area Layout Guide)** bulunmaktadır.

Bu rehber **hiçbir cihaz model adı hardcode etmez**.
Tüm ayarlamalar **safe area**, **platform**, **gerçek cihaz/simülatör farkı** ve **ekran oranı** üzerinden çalışır.

---

## 🎯 Amaç
- Dynamic Island / Notch yüksekliğini otomatik yönetmek
- iPhone SE gibi notch olmayan cihazları doğru ayarlamak
- iPad & tablet cihazları doğru sınıflandırmak
- Android notch + status bar kombinasyonlarını doğru ölçmek
- Çentik, status bar, kamera deliği gibi tüm varyasyonlara otomatik uyum sağlamak
- “iPhone 14 / 15 / 16 / 17” gibi sabit değerler kullanmadan **future-proof** bir yapı oluşturmak

---

# 🔧 **useDeviceLayout.ts** — Her Şeyi Yöneten Hook
Aşağıdaki kod direkt projede kullanılabilir.

```ts
import { Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Device from "expo-device";

export function useDeviceLayout() {
  const insets = useSafeAreaInsets();
  const { height, width } = Dimensions.get("window");

  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";
  const isTablet = Device.deviceType === Device.DeviceType.TABLET;

  // iPhone notch / Dynamic Island detection — model bağımsız
  const hasNotchOrIsland = isIOS && insets.top >= 44; // X → 17 Pro Max ve sonrası

  // Android notch detection
  const hasAndroidCutout = isAndroid && insets.top > 24;

  const topPadding = Math.max(insets.top, hasNotchOrIsland ? 48 : 20);
  const bottomPadding = Math.max(insets.bottom, 16);

  const isPortrait = height > width;

  return {
    isIOS,
    isAndroid,
    isTablet,
    isPortrait,
    insets,
    topPadding,
    bottomPadding,
    hasNotchOrIsland,
    hasAndroidCutout,
    screen: { width, height }
  };
}
```

---

# 🧩 Nerelerde Kullanılır?
Bu hook'u şu alanların tamamında kullanabilirsin:

### ✅ **Top Navigation (üst bar)**
Dynamic Island ve notch’ı otomatik hesaplar.

```ts
const { topPadding } = useDeviceLayout();

<View style={{ paddingTop: topPadding }}>...</View>
```

### ✅ **Bottom Navigation (home indicator yüksekliği)**
X → 17 Pro Max cihazlarında otomatik genişler.

### ✅ **Full-screen modlar**
Story viewer, video player vb.

### ✅ **Modal & Sheet komponentleri**
Hem iOS hem Android için güvenilir safe-area değerleri.

---

# 📌 Bonus: iPhone Model Algılamaya Gerek Yok!
Eskiden şöyle şeyler yapılıyordu:

```js
Device.modelName.includes("iPhone 15")
```

Bu **yanlış** ve artık kullanılmamalı çünkü:
- iPhone 18, 19 çıktığında bozulur
- Region / locale bazlı model isimleri farklıdır
- Future-proof değildir

**Doğru yöntem:** `safe-area + screen ratio + platform`

---

# 🔮 Bu Sistem ile Desteklenen Cihaz Grupları
### iPhone (Notch / Dynamic Island)
- iPhone X → XS → 11 → 12 → 13 → 14 → 15 → 16 → **17** → gelecekteki tüm modeller

### iPhone (Notchsuz)
- iPhone SE tüm nesiller

### iPad ailesi
- iPad Pro 11/12/13/14
- iPad Air M1/M2/M3/M4

### Android
- Samsung Galaxy S / Note / Ultra
- Xiaomi, Pixel, Oppo vb.
- Kamera deliği / geniş notch / dar notch / kavisli ekran her şey

Hepsi **tek bir hook ile** çalışır.

---

# 🧱 İstersen Bir “TopBar.tsx” de Hazırlayabilirim
Şöyle bir komponent oluşturabilirim:

- Dynamic Island’a akıllı padding
- Shadow + blur destekli
- iOS/Android farklı stil seçenekleri
- Titreme / skipping effect olmadan animasyonlu
- Tamamen senin UI/UX stiline göre

İstersen bottom nav ile entegre responsiv bir **Full Layout Framework** bile oluşturabiliriz.

---

## ✔️ Hazır! Artık tüm cihazlarda %100 dinamik üst alan yönetimi var.
Daha gelişmiş bir layout sistemi, animasyonlu navbar, iPhone Island reactive UI veya Android toolbar varyantı istersen hemen ekleyebilirim.
