# Expo Background Task System

> **Not:** Bu dokümantasyon `expo-background-task` kütüphanesini açıklar. Eski `expo-background-fetch` deprecated edilmiştir ve artık kullanılmamalıdır.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Nasıl Çalışır](#nasıl-çalışır)
3. [Platform Farklılıkları](#platform-farklılıkları)
4. [Kurulum](#kurulum)
5. [Temel Kullanım](#temel-kullanım)
6. [API Referansı](#api-referansı)
7. [Test Etme](#test-etme)
8. [Kısıtlamalar](#kısıtlamalar)
9. [Best Practices](#best-practices)

---

## Genel Bakış

`expo-background-task`, uygulamanız arka plandayken (background) ertelenebilir görevler çalıştırmanıza olanak tanıyan bir API sağlar. Bu sistem, son kullanıcının cihazında batarya ve güç tüketimini optimize edecek şekilde tasarlanmıştır.

### Kullanılan Native API'ler

| Platform    | API                                                                                          | Açıklama                                         |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Android** | [WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)        | Google'ın önerdiği modern background work API'si |
| **iOS**     | [BGTaskScheduler](https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler) | Apple'ın modern background task API'si           |

### Neden Background Task?

- **Daha hızlı başlangıç:** Uygulama açılmadan önce veri yükle, cache güncelle
- **Daha dayanıklı uygulamalar:** Offline-first tasarımlar için periyodik senkronizasyon
- **Platform uyumluluğu:** Modern sistem API'leri ile "first-class citizen" davranışı
- **Düşük bakım maliyeti:** Deprecated API'ler yerine stabil, modern temeller
- **Gelecek için hazırlık:** Daha güçlü background özellikleri için altyapı

---

## Nasıl Çalışır

### Background Task Nedir?

Background task, uygulamanızın yaşam döngüsü dışında, arka planda gerçekleştirilen ertelenebilir bir iş birimidir.

```
┌─────────────────────────────────────────────────────────────┐
│                    UYGULAMA DURUMU                          │
├─────────────────────────────────────────────────────────────┤
│  Foreground (Ön Plan)  │  Background (Arka Plan)  │ Killed  │
│  ─────────────────────────────────────────────────────────  │
│  Normal uygulama       │  Background Task         │  Task   │
│  kodu çalışır          │  çalışabilir             │  durur  │
└─────────────────────────────────────────────────────────────┘
```

### Task Ne Zaman Çalışır?

Expo Background Task API, her platformun kendi optimizasyonlarını kullanarak task'ı en uygun zamanda çalıştırır:

1. **Hemen çalışmaz** - Zamanlandıktan sonra sistem uygun gördüğünde çalışır
2. **Minimum interval** - Dakika cinsinden minimum aralık belirleyebilirsiniz
3. **Koşullar sağlanmalı:**
   - Batarya yeterli şarjda (veya şarjda)
   - Ağ bağlantısı mevcut

### Task Ne Zaman Durur?

| Durum                          | Davranış                                             |
| ------------------------------ | ---------------------------------------------------- |
| Kullanıcı uygulamayı kapatırsa | Task durur, uygulama yeniden başlatılınca devam eder |
| Sistem uygulamayı durdurursa   | Task devam eder, uygulama yeniden başlatılır         |
| Cihaz yeniden başlarsa         | Task devam eder, uygulama yeniden başlatılır         |

> ⚠️ **Android Uyarısı:** Cihaz üreticisine göre davranış değişebilir. Bazı üreticiler "son uygulamalar"dan kaldırmayı uygulama kapatma olarak değerlendirir. Detaylar: [dontkillmyapp.com](https://dontkillmyapp.com)

---

## Platform Farklılıkları

### Android

```
┌─────────────────────────────────────────────────────────────┐
│                    ANDROID - WorkManager                    │
├─────────────────────────────────────────────────────────────┤
│  • Minimum interval: 15 dakika                              │
│  • Task, interval geçtikten sonra koşullar sağlanınca çalışır│
│  • Daha öngörülebilir zamanlama                             │
│  • Cihaz üreticisine göre davranış farklılıkları olabilir   │
└─────────────────────────────────────────────────────────────┘
```

### iOS

```
┌─────────────────────────────────────────────────────────────┐
│                    iOS - BGTaskScheduler                    │
├─────────────────────────────────────────────────────────────┤
│  • Sistem en uygun zamanı belirler                          │
│  • Batarya seviyesi, ağ durumu, kullanım kalıpları dikkate  │
│    alınır                                                   │
│  • Minimum interval belirlenebilir ama sistem daha geç     │
│    çalıştırabilir                                           │
│  • Simulator'da ÇALIŞMAZ - sadece fiziksel cihaz           │
└─────────────────────────────────────────────────────────────┘
```

---

## Kurulum

### 1. Paketi Yükle

```bash
npx expo install expo-background-task expo-task-manager
```

### 2. app.config.ts Konfigürasyonu

```typescript
// app.config.ts
export default {
  expo: {
    // ... diğer konfigürasyonlar
    plugins: [
      // expo-background-task otomatik olarak gerekli
      // native konfigürasyonları uygular
    ],
  },
};
```

### 3. Prebuild (Native Projeler İçin)

```bash
npx expo prebuild
```

---

## Temel Kullanım

### Adım 1: Task Tanımla (Global Scope)

```typescript
// tasks/background-sync.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

// ⚠️ ÖNEMLİ: Bu kod GLOBAL SCOPE'ta olmalı!
// React component içinde DEĞİL!
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log(`[BackgroundTask] Çalışıyor: ${new Date().toISOString()}`);
    
    // Burada background işlemlerinizi yapın
    // Örnek: API'den veri çek, cache güncelle, vs.
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BackgroundTask] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export { BACKGROUND_SYNC_TASK };
```

### Adım 2: Task'ı Kaydet

```typescript
// hooks/useBackgroundTask.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { BACKGROUND_SYNC_TASK } from '@/tasks/background-sync';

export function useBackgroundTask() {
  const registerTask = async () => {
    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 60 * 15, // 15 dakika (minimum)
      });
      console.log('[BackgroundTask] Kayıt başarılı');
    } catch (error) {
      console.error('[BackgroundTask] Kayıt hatası:', error);
    }
  };

  const unregisterTask = async () => {
    try {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[BackgroundTask] Kayıt silindi');
    } catch (error) {
      console.error('[BackgroundTask] Kayıt silme hatası:', error);
    }
  };

  const checkStatus = async () => {
    const status = await BackgroundTask.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    
    return {
      status,
      isRegistered,
      statusText: BackgroundTask.BackgroundTaskStatus[status],
    };
  };

  return {
    registerTask,
    unregisterTask,
    checkStatus,
  };
}
```

### Adım 3: Component'te Kullan

```typescript
// components/BackgroundTaskManager.tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useBackgroundTask } from '@/hooks/useBackgroundTask';

export function BackgroundTaskManager() {
  const { registerTask, unregisterTask, checkStatus } = useBackgroundTask();
  const [isRegistered, setIsRegistered] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = async () => {
    const { isRegistered, statusText } = await checkStatus();
    setIsRegistered(isRegistered);
    setStatusText(statusText);
  };

  const toggleTask = async () => {
    if (isRegistered) {
      await unregisterTask();
    } else {
      await registerTask();
    }
    await updateStatus();
  };

  return (
    <View>
      <Text>Status: {statusText}</Text>
      <Text>Kayıtlı: {isRegistered ? 'Evet' : 'Hayır'}</Text>
      <Button
        title={isRegistered ? 'Task\'ı Durdur' : 'Task\'ı Başlat'}
        onPress={toggleTask}
      />
    </View>
  );
}
```

---

## API Referansı

### Methods

#### `BackgroundTask.getStatusAsync()`

Background Task API'nin durumunu döndürür.

```typescript
const status = await BackgroundTask.getStatusAsync();
// BackgroundTaskStatus.Available | Restricted | Denied
```

#### `BackgroundTask.registerTaskAsync(taskName, options?)`

Task'ı kaydeder ve periyodik çalışmasını sağlar.

```typescript
await BackgroundTask.registerTaskAsync('my-task', {
  minimumInterval: 60 * 15, // 15 dakika (saniye cinsinden)
});
```

| Parametre                 | Tip      | Açıklama                             |
| ------------------------- | -------- | ------------------------------------ |
| `taskName`                | `string` | Task adı (defineTask ile tanımlanan) |
| `options.minimumInterval` | `number` | Minimum çalışma aralığı (saniye)     |

#### `BackgroundTask.unregisterTaskAsync(taskName)`

Task kaydını siler.

```typescript
await BackgroundTask.unregisterTaskAsync('my-task');
```

#### `BackgroundTask.triggerTaskWorkerForTestingAsync()` (Debug Only)

Test için task'ı manuel tetikler. **Sadece debug modda çalışır!**

```typescript
if (__DEV__) {
  await BackgroundTask.triggerTaskWorkerForTestingAsync();
}
```

### Enums

#### `BackgroundTaskStatus`

| Değer        | Açıklama                         |
| ------------ | -------------------------------- |
| `Available`  | Background task kullanılabilir   |
| `Restricted` | Sistem tarafından kısıtlanmış    |
| `Denied`     | Kullanıcı tarafından reddedilmiş |

#### `BackgroundTaskResult`

| Değer     | Açıklama                  |
| --------- | ------------------------- |
| `Success` | Task başarıyla tamamlandı |
| `Failed`  | Task başarısız oldu       |

---

## Test Etme

### iOS (Fiziksel Cihaz Gerekli)

```typescript
// Debug modda test için
if (__DEV__) {
  await BackgroundTask.triggerTaskWorkerForTestingAsync();
}
```

> ⚠️ iOS Simulator'da background task ÇALIŞMAZ!

### Android

```bash
# 1. Kayıtlı job'ları listele
adb shell dumpsys jobscheduler | grep -A 10 "JOB #"

# 2. Job'u zorla çalıştır (önce uygulamayı arka plana al!)
adb shell cmd jobscheduler run -f <package-name> <JOB_ID>
```

---

## Kısıtlamalar

### Genel Kısıtlamalar

| Kısıtlama            | Açıklama                                       |
| -------------------- | ---------------------------------------------- |
| **Minimum Interval** | Android: 15 dakika, iOS: Sistem belirler       |
| **Çalışma Süresi**   | Sınırlı (genellikle 30 saniye - birkaç dakika) |
| **Garanti Yok**      | Sistem task'ı erteleyebilir veya atlayabilir   |
| **Koşullar**         | Batarya ve ağ koşulları sağlanmalı             |

### iOS Özel Kısıtlamalar

- Simulator'da çalışmaz
- Sistem kullanım kalıplarına göre optimize eder
- Kullanıcı uygulamayı kapatırsa task durur

### Android Özel Kısıtlamalar

- Cihaz üreticisine göre davranış farklılıkları
- Doze mode ve App Standby etkileyebilir
- Battery optimization ayarları

---

## Best Practices

### ✅ Yapılması Gerekenler

```typescript
// 1. Task tanımını global scope'ta yap
TaskManager.defineTask(TASK_NAME, async () => {
  // ...
});

// 2. Hata yönetimi ekle
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // İşlemler
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Task hatası:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// 3. Kısa ve öz işlemler yap
// Background task'lar sınırlı sürede çalışır

// 4. Network işlemlerinde timeout kullan
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000);

try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

### ❌ Yapılmaması Gerekenler

```typescript
// 1. Task tanımını component içinde YAPMA
function MyComponent() {
  // ❌ YANLIŞ!
  TaskManager.defineTask(TASK_NAME, async () => {});
}

// 2. Uzun süren işlemler YAPMA
TaskManager.defineTask(TASK_NAME, async () => {
  // ❌ YANLIŞ! Çok uzun sürebilir
  await downloadLargeFile();
  await processAllData();
});

// 3. UI güncellemesi YAPMA
TaskManager.defineTask(TASK_NAME, async () => {
  // ❌ YANLIŞ! Background'da UI yok
  setState(newValue);
});
```

---

## Kaynaklar

- [Expo Background Task Docs](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Expo Blog: Goodbye background-fetch](https://expo.dev/blog/goodbye-background-fetch-hello-expo-background-task)
- [Android WorkManager](https://developer.android.com/topic/libraries/architecture/workmanager)
- [iOS BGTaskScheduler](https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler)
- [Don't Kill My App](https://dontkillmyapp.com)
