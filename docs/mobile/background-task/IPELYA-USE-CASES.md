# İPELYA - Background Task Kullanım Senaryoları

> Bu dokümantasyon, `expo-background-task` sisteminin İPELYA projesinde potansiyel kullanım alanlarını ve implementasyon önerilerini içerir.

## İçindekiler

1. [Mevcut Durum Analizi](#mevcut-durum-analizi)
2. [Potansiyel Kullanım Senaryoları](#potansiyel-kullanım-senaryoları)
3. [Öncelik Sıralaması](#öncelik-sıralaması)
4. [Implementasyon Planı](#implementasyon-planı)
5. [Dikkat Edilmesi Gerekenler](#dikkat-edilmesi-gerekenler)

---

## Mevcut Durum Analizi

### Şu An Kullandığımız Sistemler

| Sistem                                        | Amaç                              | Background Task Gerekli mi?            |
| --------------------------------------------- | --------------------------------- | -------------------------------------- |
| **Push Notifications** (`expo-notifications`) | Gerçek zamanlı bildirimler        | ❌ Hayır - Zaten anlık çalışıyor        |
| **Supabase Realtime**                         | Mesajlar, yorumlar, beğeniler     | ❌ Hayır - Uygulama açıkken çalışıyor   |
| **React Query**                               | Veri cache'leme ve senkronizasyon | ❌ Hayır - Uygulama açıkken çalışıyor   |
| **Expo Updates**                              | OTA güncellemeler                 | ✅ Evet - Background'da kontrol faydalı |

### Sonuç

**Şu an için kritik bir ihtiyaç yok**, ancak aşağıdaki senaryolarda kullanıcı deneyimini iyileştirebilir.

---

## Potansiyel Kullanım Senaryoları

### 1. 📱 OTA Update Kontrolü (Yüksek Öncelik)

**Amaç:** Kullanıcı uygulamayı açmadan önce güncellemeleri kontrol et ve indir.

**Fayda:**
- Uygulama açıldığında güncelleme hazır olur
- Kullanıcı bekleme süresi azalır
- Kritik bug fix'ler daha hızlı yayılır

```typescript
// tasks/update-check.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Updates from 'expo-updates';

const UPDATE_CHECK_TASK = 'update-check-task';

TaskManager.defineTask(UPDATE_CHECK_TASK, async () => {
  try {
    console.log('[UpdateCheck] Güncelleme kontrolü başladı');
    
    const update = await Updates.checkForUpdateAsync();
    
    if (update.isAvailable) {
      console.log('[UpdateCheck] Yeni güncelleme bulundu, indiriliyor...');
      await Updates.fetchUpdateAsync();
      console.log('[UpdateCheck] Güncelleme indirildi, sonraki açılışta uygulanacak');
    } else {
      console.log('[UpdateCheck] Güncelleme yok');
    }
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[UpdateCheck] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Kayıt fonksiyonu
export async function registerUpdateCheckTask() {
  await BackgroundTask.registerTaskAsync(UPDATE_CHECK_TASK, {
    minimumInterval: 60 * 60 * 12, // 12 saat
  });
}

export { UPDATE_CHECK_TASK };
```

---

### 2. 🖼️ Feed Pre-fetch (Orta Öncelik)

**Amaç:** Ana feed içeriklerini arka planda önceden yükle.

**Fayda:**
- Uygulama açıldığında feed anında görünür
- Skeleton loading süresi azalır
- Daha akıcı kullanıcı deneyimi

```typescript
// tasks/feed-prefetch.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const FEED_PREFETCH_TASK = 'feed-prefetch-task';
const PREFETCH_CACHE_KEY = 'prefetched_feed';

TaskManager.defineTask(FEED_PREFETCH_TASK, async () => {
  try {
    console.log('[FeedPrefetch] Feed pre-fetch başladı');
    
    // Supabase client oluştur (background'da auth olmadan)
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Son 20 public postu çek
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        media_url,
        created_at,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    // Cache'e kaydet
    await AsyncStorage.setItem(PREFETCH_CACHE_KEY, JSON.stringify({
      posts,
      fetchedAt: Date.now(),
    }));
    
    console.log(`[FeedPrefetch] ${posts?.length || 0} post cache'lendi`);
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[FeedPrefetch] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Hook: Cache'den veri oku
export function usePrefetchedFeed() {
  const getPrefetchedFeed = async () => {
    try {
      const cached = await AsyncStorage.getItem(PREFETCH_CACHE_KEY);
      if (!cached) return null;
      
      const { posts, fetchedAt } = JSON.parse(cached);
      
      // 1 saatten eski ise kullanma
      if (Date.now() - fetchedAt > 60 * 60 * 1000) {
        return null;
      }
      
      return posts;
    } catch {
      return null;
    }
  };
  
  return { getPrefetchedFeed };
}

export { FEED_PREFETCH_TASK };
```

---

### 3. 💬 Okunmamış Mesaj Sayısı Senkronizasyonu (Orta Öncelik)

**Amaç:** Uygulama badge'ini güncel tut.

**Fayda:**
- Kullanıcı uygulamayı açmadan kaç mesajı olduğunu görür
- App icon badge her zaman güncel
- Push notification'a ek olarak badge güncelleme

```typescript
// tasks/badge-sync.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const BADGE_SYNC_TASK = 'badge-sync-task';

TaskManager.defineTask(BADGE_SYNC_TASK, async () => {
  try {
    console.log('[BadgeSync] Badge senkronizasyonu başladı');
    
    // Kullanıcı ID'sini al
    const userId = await SecureStore.getItemAsync('user_id');
    if (!userId) {
      console.log('[BadgeSync] Kullanıcı giriş yapmamış');
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Okunmamış mesaj sayısını al
    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    
    // Okunmamış bildirim sayısını al
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
    
    const totalBadge = (unreadMessages || 0) + (unreadNotifications || 0);
    
    // Badge'i güncelle
    await Notifications.setBadgeCountAsync(totalBadge);
    
    console.log(`[BadgeSync] Badge güncellendi: ${totalBadge}`);
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BadgeSync] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export { BADGE_SYNC_TASK };
```

---

### 4. 🗑️ Cache Temizleme (Düşük Öncelik)

**Amaç:** Eski cache verilerini ve geçici dosyaları temizle.

**Fayda:**
- Depolama alanı optimize edilir
- Uygulama performansı artar
- Eski/stale veri birikimi önlenir

```typescript
// tasks/cache-cleanup.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_CLEANUP_TASK = 'cache-cleanup-task';

TaskManager.defineTask(CACHE_CLEANUP_TASK, async () => {
  try {
    console.log('[CacheCleanup] Cache temizleme başladı');
    
    // 1. Eski image cache'lerini temizle
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir) {
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      
      let deletedCount = 0;
      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        
        if (info.exists && info.modificationTime && info.modificationTime < oneWeekAgo) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          deletedCount++;
        }
      }
      
      console.log(`[CacheCleanup] ${deletedCount} eski dosya silindi`);
    }
    
    // 2. Eski AsyncStorage verilerini temizle
    const keys = await AsyncStorage.getAllKeys();
    const expiredKeys = keys.filter(key => key.startsWith('temp_') || key.startsWith('cache_'));
    
    for (const key of expiredKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const { expiresAt } = JSON.parse(value);
          if (expiresAt && Date.now() > expiresAt) {
            await AsyncStorage.removeItem(key);
          }
        } catch {
          // JSON parse hatası, muhtemelen eski format
        }
      }
    }
    
    console.log('[CacheCleanup] Cache temizleme tamamlandı');
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[CacheCleanup] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export { CACHE_CLEANUP_TASK };
```

---

### 5. 📊 Analytics Batch Gönderimi (Düşük Öncelik)

**Amaç:** Biriken analytics verilerini toplu olarak gönder.

**Fayda:**
- Anlık network istekleri azalır
- Batarya tüketimi optimize edilir
- Offline kullanımda veri kaybı önlenir

```typescript
// tasks/analytics-sync.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_SYNC_TASK = 'analytics-sync-task';
const ANALYTICS_QUEUE_KEY = 'analytics_queue';

TaskManager.defineTask(ANALYTICS_SYNC_TASK, async () => {
  try {
    console.log('[AnalyticsSync] Analytics senkronizasyonu başladı');
    
    // Queue'daki eventleri al
    const queueData = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!queueData) {
      console.log('[AnalyticsSync] Gönderilecek event yok');
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    const events = JSON.parse(queueData);
    
    if (events.length === 0) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    // Batch olarak gönder
    const response = await fetch('https://api.ipelya.com/analytics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
    
    if (response.ok) {
      // Başarılı, queue'yu temizle
      await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);
      console.log(`[AnalyticsSync] ${events.length} event gönderildi`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[AnalyticsSync] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Analytics event'i queue'ya ekle
export async function queueAnalyticsEvent(event: object) {
  const queueData = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
  const events = queueData ? JSON.parse(queueData) : [];
  
  events.push({
    ...event,
    timestamp: Date.now(),
  });
  
  await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(events));
}

export { ANALYTICS_SYNC_TASK };
```

---

### 6. 📥 Story/Post Draft Senkronizasyonu (Opsiyonel)

**Amaç:** Taslak içerikleri sunucuyla senkronize et.

**Fayda:**
- Cihazlar arası taslak senkronizasyonu
- Veri kaybı önleme
- Offline çalışma desteği

```typescript
// tasks/draft-sync.ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const DRAFT_SYNC_TASK = 'draft-sync-task';
const LOCAL_DRAFTS_KEY = 'local_drafts';

TaskManager.defineTask(DRAFT_SYNC_TASK, async () => {
  try {
    console.log('[DraftSync] Taslak senkronizasyonu başladı');
    
    const userId = await SecureStore.getItemAsync('user_id');
    if (!userId) return BackgroundTask.BackgroundTaskResult.Success;
    
    // Local taslakları al
    const localDrafts = await AsyncStorage.getItem(LOCAL_DRAFTS_KEY);
    if (!localDrafts) return BackgroundTask.BackgroundTaskResult.Success;
    
    const drafts = JSON.parse(localDrafts);
    const unsyncedDrafts = drafts.filter((d: any) => !d.synced);
    
    if (unsyncedDrafts.length === 0) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    
    // Sunucuya gönder
    // ... API çağrısı
    
    console.log(`[DraftSync] ${unsyncedDrafts.length} taslak senkronize edildi`);
    
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[DraftSync] Hata:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export { DRAFT_SYNC_TASK };
```

---

## Öncelik Sıralaması

| Öncelik         | Senaryo               | Fayda      | Karmaşıklık | Öneri                |
| --------------- | --------------------- | ---------- | ----------- | -------------------- |
| 🔴 **Yüksek**    | OTA Update Kontrolü   | Çok Yüksek | Düşük       | ✅ Hemen implement et |
| 🟡 **Orta**      | Feed Pre-fetch        | Yüksek     | Orta        | ⏳ İkinci fazda       |
| 🟡 **Orta**      | Badge Senkronizasyonu | Orta       | Düşük       | ⏳ İkinci fazda       |
| 🟢 **Düşük**     | Cache Temizleme       | Orta       | Düşük       | 📋 Backlog            |
| 🟢 **Düşük**     | Analytics Batch       | Düşük      | Orta        | 📋 Backlog            |
| ⚪ **Opsiyonel** | Draft Senkronizasyonu | Düşük      | Yüksek      | 🤔 Değerlendir        |

---

## Implementasyon Planı

### Faz 1: Temel Altyapı (1-2 gün)

```
1. expo-background-task kurulumu
2. Task manager altyapısı oluşturma
3. OTA Update task implementasyonu
4. Test ve debug
```

### Faz 2: Kullanıcı Deneyimi İyileştirmeleri (2-3 gün)

```
1. Feed pre-fetch implementasyonu
2. Badge senkronizasyonu
3. Cache stratejisi optimizasyonu
4. Performance testleri
```

### Faz 3: Optimizasyonlar (Opsiyonel)

```
1. Cache temizleme
2. Analytics batch
3. Monitoring ve alerting
```

---

## Dikkat Edilmesi Gerekenler

### ⚠️ Kritik Uyarılar

1. **iOS Simulator'da Çalışmaz**
   - Test için fiziksel cihaz gerekli
   - Development build kullan

2. **Garanti Yok**
   - Sistem task'ı erteleyebilir
   - Kritik işlemler için push notification kullan

3. **Sınırlı Çalışma Süresi**
   - Task'lar kısa tutulmalı (30 saniye - birkaç dakika)
   - Uzun işlemleri parçala

4. **Network Bağımlılığı**
   - Task sadece network varken çalışır
   - Offline senaryoları düşün

### ✅ Best Practices

```typescript
// 1. Her zaman try-catch kullan
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // İşlemler
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Task hatası:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// 2. Timeout ekle
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000);

try {
  await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}

// 3. Logging ekle
console.log(`[TaskName] Başladı: ${new Date().toISOString()}`);
console.log(`[TaskName] Tamamlandı: ${new Date().toISOString()}`);

// 4. Kullanıcı oturum kontrolü
const userId = await SecureStore.getItemAsync('user_id');
if (!userId) {
  return BackgroundTask.BackgroundTaskResult.Success;
}
```

---

## Sonuç

**Şu an için:**
- Push Notifications + Supabase Realtime yeterli
- Background Task kritik değil

**Gelecekte:**
- OTA Update kontrolü için implement edilebilir
- Feed pre-fetch ile UX iyileştirilebilir
- Badge senkronizasyonu eklenebilir

**Öneri:** OTA Update task'ı ile başla, diğerlerini ihtiyaç oldukça ekle.
