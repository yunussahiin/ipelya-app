# Android Notification Channels - Teknik Detaylar 🤖

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Expo API Referansı](#expo-api-referansı)
3. [Mevcut Implementasyon](#mevcut-implementasyon)
4. [Kanal Özellikleri](#kanal-özellikleri)
5. [Çoklu Kanal Senaryoları](#çoklu-kanal-senaryoları)
6. [Troubleshooting](#troubleshooting)

---

## Genel Bakış

### Android Notification Channels Nedir?

Android 8.0 (API 26, Oreo) ile tanıtılan Notification Channels, bildirimleri kategorilere ayırarak kullanıcıya granüler kontrol sağlar.

```
┌─────────────────────────────────────────────────────────────┐
│                    Android Bildirim Sistemi                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Android 7.x ve öncesi:                                     │
│  ─────────────────────                                      │
│  Tüm bildirimler → Tek ayar (Açık/Kapalı)                   │
│                                                              │
│  Android 8.0+ (API 26+):                                    │
│  ─────────────────────                                      │
│  Bildirimler → Kanallar → Her kanal için ayrı ayar          │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Mesajlar  │  │   Sosyal    │  │   Sistem    │         │
│  │   ────────  │  │   ────────  │  │   ────────  │         │
│  │   Ses: ON   │  │   Ses: OFF  │  │   Ses: ON   │         │
│  │   Titreşim  │  │   Badge     │  │   Bypass    │         │
│  │   Heads-up  │  │   Silent    │  │   DND       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Neden Zorunlu?

| Android Sürümü         | Kanal Gereksinimi                             |
| ---------------------- | --------------------------------------------- |
| Android 7.x ve öncesi  | Kanal gerekmez                                |
| Android 8.0+ (API 26+) | **Zorunlu** - Kanal olmadan bildirim görünmez |

---

## Expo API Referansı

### `setNotificationChannelAsync`

Yeni kanal oluşturur veya mevcut kanalı günceller.

```typescript
import * as Notifications from 'expo-notifications';

await Notifications.setNotificationChannelAsync(channelId, {
  name: string;                    // Zorunlu - Kullanıcıya görünen ad
  description?: string;            // Kanal açıklaması
  importance: AndroidImportance;   // Öncelik seviyesi
  sound?: string | boolean;        // Ses dosyası veya true/false
  vibrationPattern?: number[];     // Titreşim deseni [bekleme, titreşim, ...]
  lightColor?: string;             // LED rengi (#RRGGBB)
  lockscreenVisibility?: AndroidNotificationVisibility;
  bypassDnd?: boolean;             // Rahatsız Etme modunu atla
  showBadge?: boolean;             // Uygulama badge'i göster
  enableLights?: boolean;          // LED'i etkinleştir
  enableVibrate?: boolean;         // Titreşimi etkinleştir
  groupId?: string;                // Kanal grubu ID'si
});
```

### `getNotificationChannelsAsync`

Tüm kanalları listeler.

```typescript
const channels = await Notifications.getNotificationChannelsAsync();
// [{ id: 'default', name: 'Default', importance: 5, ... }]
```

### `getNotificationChannelAsync`

Belirli bir kanalı getirir.

```typescript
const channel = await Notifications.getNotificationChannelAsync('default');
// { id: 'default', name: 'Default', importance: 5, ... } veya null
```

### `deleteNotificationChannelAsync`

Kanalı siler.

```typescript
await Notifications.deleteNotificationChannelAsync('old-channel');
```

### AndroidImportance Enum

```typescript
import { AndroidImportance } from 'expo-notifications';

AndroidImportance.MAX     // 5 - Heads-up, ses, titreşim
AndroidImportance.HIGH    // 4 - Ses, titreşim
AndroidImportance.DEFAULT // 3 - Ses
AndroidImportance.LOW     // 2 - Sessiz, status bar'da görünür
AndroidImportance.MIN     // 1 - Sessiz, gizli
AndroidImportance.NONE    // 0 - Kanal kapalı
```

### AndroidNotificationVisibility Enum

```typescript
import { AndroidNotificationVisibility } from 'expo-notifications';

AndroidNotificationVisibility.PUBLIC  // Kilit ekranında tam içerik
AndroidNotificationVisibility.PRIVATE // Kilit ekranında gizli içerik
AndroidNotificationVisibility.SECRET  // Kilit ekranında görünmez
```

---

## Mevcut Implementasyon

### Dosya Konumu

```
apps/mobile/src/hooks/useDeviceToken.ts
```

### Kod

```typescript
// 3. Android notification channel oluştur
if (Device.osName === 'Android') {
  console.log('🤖 Setting up Android notification channel...');
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B35', // İpelya turuncu
  });
  console.log('✅ Android notification channel created');
}
```

### Konfigürasyon Detayları

| Özellik            | Değer                | Açıklama                                         |
| ------------------ | -------------------- | ------------------------------------------------ |
| `id`               | `'default'`          | Kanal benzersiz ID'si                            |
| `name`             | `'Default'`          | Kullanıcıya görünen ad                           |
| `importance`       | `MAX` (5)            | En yüksek öncelik - heads-up notification        |
| `vibrationPattern` | `[0, 250, 250, 250]` | 0ms bekle, 250ms titre, 250ms bekle, 250ms titre |
| `lightColor`       | `'#FF6B35'`          | İpelya turuncu LED rengi                         |

### Kullanıcı Deneyimi

```
Android Ayarları → Uygulamalar → İpelya → Bildirimler
└── Default
    ├── Ses: Varsayılan bildirim sesi
    ├── Titreşim: Açık
    ├── Kilit ekranı: Tüm içerik göster
    ├── Heads-up: Açık
    └── Badge: Açık
```

---

## Kanal Özellikleri

### Importance Seviyeleri Detaylı

| Seviye    | Değer | Ses | Titreşim | Heads-up | Status Bar | Kullanım Örneği                   |
| --------- | ----- | --- | -------- | -------- | ---------- | --------------------------------- |
| `MAX`     | 5     | ✅   | ✅        | ✅        | ✅          | Acil mesajlar, güvenlik uyarıları |
| `HIGH`    | 4     | ✅   | ✅        | ❌        | ✅          | Yeni mesajlar, takipçiler         |
| `DEFAULT` | 3     | ✅   | ❌        | ❌        | ✅          | Genel bildirimler                 |
| `LOW`     | 2     | ❌   | ❌        | ❌        | ✅          | Promosyonlar, öneriler            |
| `MIN`     | 1     | ❌   | ❌        | ❌        | ❌          | Arka plan işlemleri               |
| `NONE`    | 0     | ❌   | ❌        | ❌        | ❌          | Kanal kapalı                      |

### Vibration Pattern

```typescript
// Format: [bekleme, titreşim, bekleme, titreşim, ...]
// Milisaniye cinsinden

// Kısa titreşim
vibrationPattern: [0, 100]

// Orta titreşim (mevcut)
vibrationPattern: [0, 250, 250, 250]

// Uzun titreşim
vibrationPattern: [0, 500, 200, 500]

// Acil durum titreşimi
vibrationPattern: [0, 1000, 500, 1000, 500, 1000]
```

### Light Color

```typescript
// LED rengi (destekleyen cihazlarda)
lightColor: '#FF6B35'  // İpelya turuncu
lightColor: '#FF0000'  // Kırmızı (acil)
lightColor: '#00FF00'  // Yeşil (başarı)
lightColor: '#0000FF'  // Mavi (bilgi)
```

### Özel Ses Dosyası

```typescript
// Özel ses kullanmak için:
// 1. Ses dosyasını android/app/src/main/res/raw/ klasörüne koy
// 2. Kanal oluştururken belirt

await Notifications.setNotificationChannelAsync('messages', {
  name: 'Mesajlar',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'message_sound.wav', // res/raw/message_sound.wav
});

// Bildirim gönderirken de belirt
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Yeni Mesaj',
    body: 'Merhaba!',
    sound: 'message_sound.wav',
  },
  trigger: {
    channelId: 'messages',
    // ...
  },
});
```

---

## Çoklu Kanal Senaryoları

### Senaryo 1: Basit (Mevcut)

```typescript
// Tek kanal - tüm bildirimler aynı ayarlarla
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
});
```

**Avantajları:**
- Basit implementasyon
- Bakımı kolay
- Kullanıcı için anlaşılır

**Dezavantajları:**
- Granüler kontrol yok
- Ya hep ya hiç

### Senaryo 2: Orta (Önerilen Gelecek)

```typescript
// 3 kanal - temel kategoriler
const channels = [
  {
    id: 'messages',
    name: 'Mesajlar',
    description: 'Yeni mesaj ve yanıt bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: 'social',
    name: 'Sosyal',
    description: 'Takipçi ve etkileşim bildirimleri',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: 'system',
    name: 'Sistem',
    description: 'Güvenlik ve bakım bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    bypassDnd: true,
  },
];

for (const channel of channels) {
  await Notifications.setNotificationChannelAsync(channel.id, channel);
}
```

**Kullanıcı Deneyimi:**
```
Android Ayarları → Uygulamalar → İpelya → Bildirimler
├── Mesajlar: Açık, Sesli
├── Sosyal: Açık, Sessiz
└── Sistem: Açık, DND Bypass
```

### Senaryo 3: Detaylı (Gelişmiş)

```typescript
// 6+ kanal - tam granüler kontrol
const channels = [
  // Mesajlaşma
  { id: 'new_message', name: 'Yeni Mesajlar', importance: HIGH },
  { id: 'message_reply', name: 'Mesaj Yanıtları', importance: DEFAULT },
  
  // Sosyal
  { id: 'new_follower', name: 'Yeni Takipçiler', importance: DEFAULT },
  { id: 'content_interaction', name: 'İçerik Etkileşimleri', importance: LOW },
  
  // Sistem
  { id: 'security', name: 'Güvenlik', importance: MAX, bypassDnd: true },
  { id: 'updates', name: 'Güncellemeler', importance: LOW },
];
```

**Avantajları:**
- Maksimum kullanıcı kontrolü
- Her bildirim tipi için ayrı ayar

**Dezavantajları:**
- Karmaşık implementasyon
- Kullanıcı için kafa karıştırıcı olabilir
- Bakımı zor

### Kanal Grupları

```typescript
// Kanalları gruplamak için
await Notifications.setNotificationChannelGroupAsync('social_group', {
  name: 'Sosyal Bildirimler',
  description: 'Takipçi ve etkileşim bildirimleri',
});

await Notifications.setNotificationChannelAsync('new_follower', {
  name: 'Yeni Takipçiler',
  importance: Notifications.AndroidImportance.DEFAULT,
  groupId: 'social_group', // Gruba ata
});
```

---

## Troubleshooting

### Sorun: Bildirimler Görünmüyor

**Olası Sebepler:**

1. **Kanal oluşturulmamış**
```typescript
// Kontrol et
const channel = await Notifications.getNotificationChannelAsync('default');
if (!channel) {
  console.error('Kanal bulunamadı!');
}
```

2. **Kullanıcı kanalı kapatmış**
```typescript
const channel = await Notifications.getNotificationChannelAsync('default');
if (channel?.importance === Notifications.AndroidImportance.NONE) {
  console.warn('Kullanıcı kanalı kapatmış');
  // Kullanıcıyı ayarlara yönlendir
}
```

3. **Yanlış channelId**
```typescript
// Bildirim gönderirken doğru channelId kullan
await Notifications.scheduleNotificationAsync({
  content: { title: 'Test', body: 'Test' },
  trigger: {
    channelId: 'default', // Mevcut kanal ID'si
    seconds: 1,
  },
});
```

### Sorun: Ses Çalmıyor

**Çözümler:**

1. **Importance seviyesini kontrol et**
```typescript
// Ses için en az DEFAULT (3) gerekli
importance: Notifications.AndroidImportance.DEFAULT
```

2. **Cihaz sessize alınmış olabilir**
```typescript
// Önemli bildirimler için
bypassDnd: true
```

3. **Özel ses dosyası yolu yanlış**
```typescript
// Doğru yol: android/app/src/main/res/raw/sound.wav
sound: 'sound.wav' // Sadece dosya adı, yol değil
```

### Sorun: Kanal Ayarları Değişmiyor

**Önemli Not:** Android'de kanal oluşturulduktan sonra sadece `name` ve `description` değiştirilebilir. Diğer ayarlar (importance, sound, vibration) değiştirilemez.

**Çözüm:** Yeni kanal oluştur

```typescript
// Eski kanalı sil
await Notifications.deleteNotificationChannelAsync('old_channel');

// Yeni kanal oluştur
await Notifications.setNotificationChannelAsync('new_channel', {
  name: 'Yeni Kanal',
  importance: Notifications.AndroidImportance.HIGH,
  // Yeni ayarlar...
});
```

### Debug: Tüm Kanalları Listele

```typescript
async function debugChannels() {
  const channels = await Notifications.getNotificationChannelsAsync();
  
  console.log(`Toplam ${channels.length} kanal:`);
  channels.forEach(channel => {
    console.log(`
      ID: ${channel.id}
      Name: ${channel.name}
      Importance: ${channel.importance}
      Sound: ${channel.sound}
      Vibration: ${channel.enableVibrate}
    `);
  });
}
```

---

## Özet

| Konu                | Durum        | Açıklama              |
| ------------------- | ------------ | --------------------- |
| Tek `default` kanal | ✅ Tamamlandı | Mevcut implementasyon |
| Importance: MAX     | ✅ Tamamlandı | Heads-up notification |
| Titreşim deseni     | ✅ Tamamlandı | `[0, 250, 250, 250]`  |
| LED rengi           | ✅ Tamamlandı | İpelya turuncu        |
| Çoklu kanal         | 📋 Backlog    | Talep olursa          |
| Özel sesler         | 📋 Backlog    | Talep olursa          |
| Kanal grupları      | 📋 Backlog    | Talep olursa          |

---

**İlgili Dosyalar:**
- `apps/mobile/src/hooks/useDeviceToken.ts` - Kanal oluşturma
- `apps/mobile/app.config.ts` - Expo konfigürasyonu
- `android/app/src/main/res/raw/` - Özel ses dosyaları (gelecekte)
