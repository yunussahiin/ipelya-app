# EAS Update Kullanım Rehberi

Bu döküman, İPELYA mobil uygulamasında EAS Update'in nasıl kullanılacağını açıklar.

---

## Güncelleme Gönderme

### Temel Komut

```bash
cd apps/mobile
eas update --branch <branch-name> --message "Güncelleme açıklaması"
```

### Kanal Bazlı Güncelleme

```bash
# Development ortamı için
eas update --channel development --message "Dev: Bug fix"

# Preview/Test ortamı için  
eas update --channel preview --message "Preview: Yeni özellik testi"

# Production ortamı için
eas update --channel production --message "v1.0.1: Kritik hata düzeltmesi"
```

### Platform Bazlı Güncelleme

```bash
# Sadece iOS için
eas update --channel production --platform ios --message "iOS: UI düzeltmesi"

# Sadece Android için
eas update --channel production --platform android --message "Android: Performance"

# Her iki platform için (varsayılan)
eas update --channel production --message "Tüm platformlar: Güncelleme"
```

---

## Güncelleme Yönetimi

### Yayınlanan Güncellemeleri Listele

```bash
# Tüm güncellemeleri gör
eas update:list

# Belirli bir kanal için
eas update:list --channel production

# Belirli bir branch için
eas update:list --branch main
```

### Güncelleme Detaylarını Gör

```bash
eas update:view <update-group-id>
```

### Güncellemeyi Geri Al (Rollback)

```bash
# Önceki güncellemeye dön
eas update:republish --channel production --group <previous-update-group-id>
```

---

## Kanal ve Branch Yönetimi

### Kanal Oluştur

```bash
eas channel:create <channel-name>

# Örnek
eas channel:create staging
```

### Kanalı Branch'e Bağla

```bash
eas channel:edit <channel-name> --branch <branch-name>

# Örnek: production kanalını release-1.0 branch'ine bağla
eas channel:edit production --branch release-1.0
```

### Kanalları Listele

```bash
eas channel:list
```

---

## Uygulama İçi Güncelleme Kontrolü

### Otomatik Güncelleme (Varsayılan)

`app.json`'daki `checkAutomatically: "ON_LOAD"` ayarı ile uygulama her açıldığında güncelleme kontrolü yapılır. Güncelleme varsa indirilir ve bir sonraki açılışta uygulanır.

### Manuel Güncelleme Kontrolü

Kullanıcıya güncelleme kontrolü butonu sunmak için:

```tsx
// src/hooks/useAppUpdate.ts
import { useCallback, useState } from 'react';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export function useAppUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__) {
      // Development modda çalışmaz
      Alert.alert('Bilgi', 'Güncelleme kontrolü sadece production build\'lerde çalışır.');
      return;
    }

    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          'Güncelleme Mevcut',
          'Yeni bir güncelleme var. İndirmek ister misiniz?',
          [
            { text: 'Daha Sonra', style: 'cancel' },
            { text: 'İndir', onPress: downloadUpdate },
          ]
        );
      } else {
        Alert.alert('Güncel', 'Uygulamanız güncel.');
      }
    } catch (error) {
      console.error('Güncelleme kontrolü hatası:', error);
      Alert.alert('Hata', 'Güncelleme kontrolü başarısız.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    try {
      setIsDownloading(true);
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        Alert.alert(
          'Güncelleme İndirildi',
          'Güncellemeyi uygulamak için uygulama yeniden başlatılacak.',
          [
            { text: 'Daha Sonra', style: 'cancel' },
            { text: 'Şimdi Yeniden Başlat', onPress: () => Updates.reloadAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Güncelleme indirme hatası:', error);
      Alert.alert('Hata', 'Güncelleme indirilemedi.');
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    isChecking,
    isDownloading,
    checkForUpdate,
    downloadUpdate,
  };
}
```

### useUpdates Hook Kullanımı

Expo'nun sağladığı `useUpdates` hook'u ile güncelleme durumunu izleyin:

```tsx
// src/components/UpdateBanner.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import { useTheme } from '@/theme/ThemeProvider';

export function UpdateBanner() {
  const { colors } = useTheme();
  const {
    currentlyRunning,
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    downloadProgress,
    availableUpdate,
  } = Updates.useUpdates();

  // Güncelleme yoksa banner gösterme
  if (!isUpdateAvailable && !isUpdatePending) {
    return null;
  }

  const handleDownload = async () => {
    try {
      await Updates.fetchUpdateAsync();
    } catch (error) {
      console.error('Güncelleme indirilemedi:', error);
    }
  };

  const handleReload = async () => {
    await Updates.reloadAsync();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.accent }]}>
      {isDownloading ? (
        <Text style={styles.text}>
          İndiriliyor... {Math.round((downloadProgress || 0) * 100)}%
        </Text>
      ) : isUpdatePending ? (
        <Pressable onPress={handleReload} style={styles.button}>
          <Text style={styles.text}>Güncellemeyi Uygula</Text>
        </Pressable>
      ) : isUpdateAvailable ? (
        <Pressable onPress={handleDownload} style={styles.button}>
          <Text style={styles.text}>Yeni Güncelleme Mevcut - İndir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
  },
  button: {
    padding: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
```

### Foreground'da Güncelleme Kontrolü

Uygulama foreground'a geldiğinde güncelleme kontrolü:

```tsx
// App.tsx veya _layout.tsx içinde
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

export function useCheckUpdateOnForeground() {
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // Opsiyonel: Kullanıcıya bildir
          }
        } catch (error) {
          // Sessizce başarısız ol
          console.log('Güncelleme kontrolü başarısız:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
```

---

## Güncelleme Bilgilerini Görüntüleme

### Mevcut Güncelleme Bilgisi

```tsx
import * as Updates from 'expo-updates';

function AppInfo() {
  return (
    <View>
      <Text>Update ID: {Updates.updateId}</Text>
      <Text>Channel: {Updates.channel}</Text>
      <Text>Runtime Version: {Updates.runtimeVersion}</Text>
      <Text>Created At: {Updates.createdAt?.toISOString()}</Text>
      <Text>Is Embedded: {Updates.isEmbeddedLaunch ? 'Evet' : 'Hayır'}</Text>
      <Text>Is Emergency: {Updates.isEmergencyLaunch ? 'Evet' : 'Hayır'}</Text>
    </View>
  );
}
```

### Güncelleme Loglarını Okuma

```tsx
import * as Updates from 'expo-updates';

async function getUpdateLogs() {
  // Son 1 saatin loglarını al
  const logs = await Updates.readLogEntriesAsync(3600000);
  
  logs.forEach(log => {
    console.log(`[${log.level}] ${log.message}`);
    console.log(`  Code: ${log.code}`);
    console.log(`  Timestamp: ${new Date(log.timestamp).toISOString()}`);
    if (log.updateId) {
      console.log(`  Update ID: ${log.updateId}`);
    }
  });
}
```

---

## Özel Reload Ekranı

Güncelleme uygulanırken özel bir ekran gösterin:

```tsx
await Updates.reloadAsync({
  reloadScreenOptions: {
    backgroundColor: '#000000',
    image: require('./assets/splash.png'),
    imageResizeMode: 'contain',
    spinner: {
      enabled: true,
      color: '#f472b6',
      size: 'medium',
    },
    fade: true,
  },
});
```

---

## Best Practices

### 1. Güncelleme Stratejisi

```
┌─────────────────────────────────────────────────────┐
│                  Güncelleme Akışı                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Development → Preview → Production                 │
│                                                     │
│  1. Kod değişikliği yap                            │
│  2. eas update --channel development               │
│  3. Development build'de test et                   │
│  4. eas update --channel preview                   │
│  5. QA/Test ekibi test etsin                       │
│  6. eas update --channel production                │
│  7. Kullanıcılara dağıtıldı!                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Semantic Versioning

```bash
# Major güncelleme (breaking changes) - YENİ BUILD GEREKLİ
# app.json: version: "2.0.0"
# Native kod değişikliği varsa App Store'a gönder

# Minor güncelleme (yeni özellik) - OTA ile gönderilebilir
eas update --channel production --message "v1.1.0: Yeni chat özellikleri"

# Patch güncelleme (bug fix) - OTA ile gönderilebilir
eas update --channel production --message "v1.0.2: Crash fix"
```

### 3. Güncelleme Mesajları

İyi mesaj formatı:
```bash
eas update --channel production --message "v1.0.2: [FIX] Chat mesajları yüklenmiyor hatası düzeltildi"
eas update --channel production --message "v1.1.0: [FEAT] Hikaye paylaşma özelliği eklendi"
eas update --channel production --message "v1.0.3: [PERF] Feed yükleme hızı iyileştirildi"
```

### 4. Rollback Stratejisi

Sorunlu bir güncelleme yayınladıysanız:

```bash
# 1. Önceki güncelleme ID'sini bul
eas update:list --channel production

# 2. Önceki güncellemeyi yeniden yayınla
eas update:republish --channel production --group <previous-group-id>

# 3. Veya embedded update'e dön
# (Kullanıcının uygulamayı yeniden başlatması gerekir)
```

### 5. Acil Güncelleme

Kritik bir bug için hızlı güncelleme:

```bash
# 1. Düzeltmeyi yap
# 2. Direkt production'a gönder
eas update --channel production --message "HOTFIX: Kritik güvenlik düzeltmesi"
```

---

## Test Etme

### Development Build'de Test

```bash
# 1. Development build oluştur
eas build --profile development --platform ios

# 2. Cihaza/Simulatöre kur

# 3. Güncelleme gönder
eas update --channel development --message "Test güncelleme"

# 4. Uygulamayı kapat ve aç, güncellemenin geldiğini doğrula
```

### Release Build'de Test

```bash
# 1. APK oluştur
eas build --profile preview --platform android

# 2. Cihaza kur ve test et
```

---

## Hata Kodları

| Kod                               | Açıklama                                  |
| --------------------------------- | ----------------------------------------- |
| `ERR_UPDATES_DISABLED`            | Updates devre dışı veya development modda |
| `ERR_UPDATES_RELOAD`              | Uygulama yeniden yüklenemedi              |
| `ERR_UPDATES_CHECK`               | Güncelleme kontrolü başarısız             |
| `ERR_UPDATES_FETCH`               | Güncelleme indirilemedi                   |
| `ERR_NOT_AVAILABLE_IN_DEV_CLIENT` | Development build'de kullanılamaz         |

---

## CI/CD Entegrasyonu

### GitHub Actions Örneği

```yaml
# .github/workflows/eas-update.yml
name: EAS Update

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Publish update
        working-directory: apps/mobile
        run: eas update --channel production --message "${{ github.event.head_commit.message }}"
```

---

## Referanslar

- [EAS Update Best Practices](https://expo.dev/blog/eas-update-best-practices)
- [expo-updates API](https://docs.expo.dev/versions/latest/sdk/updates/)
- [Debugging EAS Update](https://docs.expo.dev/eas-update/debug/)
