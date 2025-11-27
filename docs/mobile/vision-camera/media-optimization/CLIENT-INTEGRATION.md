# Client Integration

## Dosyalar

| Dosya                                                                  | Açıklama               |
| ---------------------------------------------------------------------- | ---------------------- |
| `apps/mobile/src/services/media-upload.service.ts`                     | Upload + Queue servisi |
| `apps/mobile/src/components/messaging/ChatScreen/GiftedChatScreen.tsx` | Chat entegrasyonu      |
| `apps/mobile/src/components/camera/VisionCamera/`                      | Kamera component'i     |

## media-upload.service.ts

### Fonksiyonlar

#### uploadMedia
Raw dosyayı Supabase Storage'a yükler.

```typescript
const result = await uploadMedia(
  uri,           // file:///path/to/file.jpg
  userId,        // User ID
  'message-media', // Bucket
  accessToken    // Supabase access token
);
// Returns: { url, path, type, size }
```

#### queueMediaProcessing
Queue'ya optimization job ekler.

```typescript
const result = await queueMediaProcessing(
  userId,
  sourcePath,    // Storage path
  accessToken,
  messageId,     // Optional
  { preset: 'chat' }
);
// Returns: { message_id, queued }
```

### Preset Tipleri

```typescript
type MediaPreset = 'chat' | 'post' | 'story' | 'profile';
```

## Chat Entegrasyonu

### GiftedChatScreen.tsx

```typescript
const handleMediaSelect = useCallback(
  async (media: SelectedMedia) => {
    // 1. Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 2. Upload
    const result = await uploadMedia(media.uri, user.id, "message-media", accessToken);

    // 3. Mesajı gönder (optimistic update)
    handleSend([mediaMessage]);

    // 4. Queue for optimization (non-blocking)
    queueMediaProcessing(user.id, result.path, accessToken, undefined, {
      preset: "chat"
    });
  },
  [user?.id, conversationId, handleSend]
);
```

## VisionCamera Entegrasyonu

VisionCamera component'i `onCapture` callback'i ile çekilen medyayı döndürür:

```typescript
<VisionCamera
  mode="photo"
  onCapture={(media: CapturedMedia) => {
    // media.path: file:///...
    // media.type: "photo" | "video"
    // media.width, media.height
  }}
  onClose={() => navigation.goBack()}
/>
```

### MediaPicker Entegrasyonu

```typescript
// MediaPicker → VisionCamera → onCapture → handleMediaSelect
<MediaPicker
  visible={showMediaPicker}
  onClose={() => setShowMediaPicker(false)}
  onSelect={handleMediaSelect}
/>
```

## Akış Diyagramı

```
VisionCamera
    │
    ▼ onCapture
MediaPicker
    │
    ▼ onSelect
handleMediaSelect
    │
    ├──▶ uploadMedia() ──▶ Supabase Storage
    │
    ├──▶ handleSend() ──▶ Optimistic UI + API
    │
    └──▶ queueMediaProcessing() ──▶ PGMQ Queue
                                        │
                                        ▼
                                  media-worker
                                        │
                                        ▼
                                  Optimized File
```

## Hata Yönetimi

```typescript
try {
  const result = await uploadMedia(...);
  handleSend([mediaMessage]);
  queueMediaProcessing(...).catch(console.warn); // Non-blocking
} catch (error) {
  Alert.alert("Hata", "Medya yüklenirken bir hata oluştu");
}
```

Queue hatası kritik değil - upload zaten tamamlanmış, sadece optimization skip edilir.
