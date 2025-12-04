# 🛡️ Anti-Screenshot & Self-Destruct

## 1. Konsept
Gizliliğin en üst düzeyde olduğu, "Shadow" moduna özel içerikler. Ekran görüntüsü alındığında içeriğin kendini imha etmesi veya engellemesi.

## 2. Kullanıcı Deneyimi (UX)
1.  **Gönderim:**
    *   Kullanıcı story veya DM atarken "Gizli Mod" (Bomb ikonu) seçer.
    *   Süre belirler (örn: "Görüldükten 5 saniye sonra sil").
2.  **Görüntüleme:**
    *   Alıcı içeriği görmek için parmağını ekrana basılı tutmak zorundadır (Snapchat tarzı). Parmağını çekerse kapanır.
3.  **İhlal (Screenshot):**
    *   Alıcı ekran görüntüsü almaya çalışırsa:
        *   **Senaryo A (Engelleme):** Ekran görüntüsü simsiyah çıkar.
        *   **Senaryo B (Tespit):** Ekran görüntüsü alınır ama göndericiye "X ekran görüntüsü aldı!" bildirimi gider ve içerik kendini siler.

## 3. Teknik Mimari

### Database
İçeriğin "Görüldü" bilgisinin anlık işlenmesi gerekir.

```sql
-- Screenshot alındı bilgisi
CREATE TABLE content_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL, -- Story veya Message ID
  user_id UUID NOT NULL, -- Kim aldı?
  breach_type TEXT DEFAULT 'screenshot', -- 'screenshot', 'screen_record'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Functions
Screenshot alındığında tetiklenecek aksiyonlar.
*   `handle-breach`:
    1.  Bildirim gönder ("Yakalandın!").
    2.  İçeriği sil (`is_deleted = true`).
    3.  (Opsiyonel) Kullanıcının "Güven Puanı"nı düşür.

## 4. Mobil Uygulama (Expo)

### Kütüphane: `expo-screen-capture`

#### Android (Engelleme)
Android'de işletim sistemi seviyesinde ekran görüntüsü engellenebilir.
```typescript
import * as ScreenCapture from 'expo-screen-capture';

// Sayfa açıldığında
await ScreenCapture.preventScreenCaptureAsync();

// Sayfa kapandığında
await ScreenCapture.allowScreenCaptureAsync();
```
Bu komut çalıştığında, kullanıcı SS almaya çalışırsa "Uygulama izin vermiyor" hatası alır veya siyah ekran kaydeder.

#### iOS (Tespit Etme)
iOS'te engellemek (DRM harici) mümkün değildir, ancak tespit edilebilir.
```typescript
import * as ScreenCapture from 'expo-screen-capture';

useEffect(() => {
  const subscription = ScreenCapture.addScreenshotListener(() => {
    // SS alındı!
    alert("Ekran görüntüsü alındı! Göndericiye bildirildi.");
    notifySender(); // API call
    hideContent(); // İçeriği hemen gizle
  });

  return () => subscription.remove();
}, []);
```

### Ekran Kaydı (Screen Recording) Tespiti
Kullanıcı video kaydı başlatırsa:
*   iOS'te `UIScreen.main.isCaptured` (Native modül gerekir) kontrolü ile ekranın kaydedildiği anlaşılabilir ve içerik bulanıklaştırılabilir.

## 5. Zorluklar & Çözümler
*   **İkinci Telefon:** Kullanıcı başka bir telefonla ekranın fotoğrafını çekebilir.
    *   *Çözüm:* Bunun teknolojik bir çözümü yoktur. Sadece caydırıcılık (süreli görüntüleme) işe yarar.
*   **iOS Kısıtlamaları:** iOS'te SS almayı %100 engellemek imkansızdır. Sadece tespit edip "Shaming" (utandırma) mekanizması kullanılabilir.
