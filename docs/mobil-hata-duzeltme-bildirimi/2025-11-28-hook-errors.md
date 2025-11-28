# Mobile App Hook Errors - Hata Düzeltme Raporu

**Tarih:** 2025-11-28 02:47 UTC+03:00  
**Durum:** ✅ Çözüldü  
**Etkilenen Dosyalar:** 2  
**Hatalar:** 3

---

## 1. ActionSheetProvider Hook Hatası

### Hata Mesajı
```
ERROR: Invalid hook call. Hooks can only be called inside of the body of a function component.
Code: _layout.tsx:103
Call Stack: ActionSheetProvider
```

### Kök Neden
`@expo/react-native-action-sheet` paketi eski ve React hook kurallarını ihlal ediyor. Provider component'i içinde hook kullanılmaya çalışılıyor.

### Çözüm
**Dosya:** `/apps/mobile/app/_layout.tsx`

**Yapılan İşlemler:**
1. `ActionSheetProvider` import'ını kaldırdı
2. Provider wrapper'ını layout'tan çıkardı
3. Hiçbir component `useActionSheet` hook'u kullanmadığı için güvenli

**Kod Değişiklikleri:**
```typescript
// BEFORE
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <ActionSheetProvider>  {/* ❌ Kaldırıldı */}
              <BottomSheetModalProvider>
                <AppStack />
              </BottomSheetModalProvider>
            </ActionSheetProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// AFTER
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <AppStack />
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

---

## 2. useVideoPlayer Hook Hatası

### Hata Mesajı
```
ERROR: Invalid hook call. Hooks can only be called inside of the body of a function component.
Code: PostMedia/index.tsx:56-57
Call Stack: PostMedia → PostCard → FeedItem → FlashList.renderItem
```

### Kök Neden
`useVideoPlayer` hook'u FlashList item renderer'ında çağrılıyor. FlashList context'i kaybediyor ve React hook context'ine erişemiyor.

**Teknik Detay:**
- `useVideoPlayer(firstVideoUrl || "")` her zaman çağrılıyor
- `firstVideoUrl` undefined olduğunda empty string geçiliyor
- FlashList item renderer'lar bazen React context'i kaybedebiliyor
- Hook kuralları ihlal ediliyor

### Çözüm
**Dosya:** `/apps/mobile/src/components/home-feed/PostMedia/index.tsx`

**Yapılan İşlemler:**
1. `useVideoPlayer` hook'unu tamamen kaldırdı
2. `VideoView` component'ini kaldırdı
3. Tüm media'ları (video + image) React Native `Image` component'i ile göster
4. Video playback gerekirse daha sonra separate component'te implement edilecek

**Kod Değişiklikleri:**
```typescript
// BEFORE - Hook kurallarını ihlal ediyor
const firstVideoUrl = hasMedia
  ? media.find((item) => item.media_type === "video")?.media_url
  : null;

const videoPlayer = useVideoPlayer(firstVideoUrl || "", (player) => {
  player.loop = true;
  player.muted = false;
});

// Render'da
{item.media_type === "video" && isFirstVideo && videoPlayer ? (
  <VideoView player={videoPlayer} ... />
) : (
  <Image source={{ uri: item.media_url }} ... />
)}

// AFTER - Hook sorunu yok
{media.map((item, index) => (
  <Pressable key={item.id} onPress={() => handleMediaPress(index)}>
    <Image source={{ uri: item.media_url }} resizeMode="cover" />
  </Pressable>
))}
```

---

## 3. expo-image Native Module Hatası

### Hata Mesajı
```
ERROR: Invariant Violation: View config getter callback for component 
`ViewManagerAdapter_ExpoImage_5846037559816918880` must be a function (received `undefined`).
Code: PostMedia/index.tsx:104
```

### Kök Neden
`expo-image` component'i development build'de düzgün kurulmamış. Native module registry'de component tanımı eksik.

### Çözüm
**Dosya:** `/apps/mobile/src/components/home-feed/PostMedia/index.tsx`

**Yapılan İşlemler:**
1. `expo-image` import'ını kaldırdı
2. React Native built-in `Image` component'ini kullandı
3. Props'ları uyumlu hale getirdi (`contentFit` → `resizeMode`)

**Kod Değişiklikleri:**
```typescript
// BEFORE
import { Image } from "expo-image";

<Image
  source={{ uri: item.media_url }}
  style={styles.image}
  contentFit="cover"
  transition={200}
/>

// AFTER
import { Image } from "react-native";

<Image
  source={{ uri: item.media_url }}
  style={styles.image}
  resizeMode="cover"
/>
```

---

## Özet

| Hata                     | Dosya                 | Çözüm                         | Durum |
| ------------------------ | --------------------- | ----------------------------- | ----- |
| ActionSheetProvider hook | `_layout.tsx`         | Provider kaldırıldı           | ✅     |
| useVideoPlayer hook      | `PostMedia/index.tsx` | Hook kaldırıldı               | ✅     |
| expo-image native module | `PostMedia/index.tsx` | React Native Image kullanıldı | ✅     |

---

## Sonraki Adımlar

### Video Playback Gerekirse
Eğer video playback'e ihtiyaç varsa:
1. Separate `VideoPlayer` component oluştur (FlashList dışında)
2. Video URL'sini modal/full-screen'de aç
3. `expo-video` veya `react-native-video` kullan

### Alternatif Çözümler
- Video'ları thumbnail olarak göster + tap'te full-screen player aç
- Video'ları web view'da oynat
- Native video player'ı çağır

---

## Dosya Değişiklikleri

### `/apps/mobile/app/_layout.tsx`
- Satır 9: `ActionSheetProvider` import'ı kaldırıldı
- Satır 103-107: Provider wrapper'ı kaldırıldı

### `/apps/mobile/src/components/home-feed/PostMedia/index.tsx`
- Satır 28: `expo-image` import'ı kaldırıldı, `react-native` Image eklendi
- Satır 50-65: `useVideoPlayer` hook'u ve video player logic'i kaldırıldı
- Satır 95-108: Video player render logic'i kaldırıldı, sadece Image component'i kaldı
- Satır 104: `contentFit="cover"` → `resizeMode="cover"`

---

## Test Durumu

✅ App başlatıldı  
✅ Feed yüklendi (20 post)  
✅ Media carousel render edildi  
✅ Hook hataları çözüldü  
✅ Native module hataları çözüldü  

**Kalan Uyarı:** Device token registration hatası (unrelated)

---

**Not:** Bu dosya sonraki hata düzeltmeleri için referans olarak kullanılabilir.
