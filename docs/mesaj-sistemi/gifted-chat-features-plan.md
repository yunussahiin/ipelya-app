# Gifted Chat Özellikler Planı

## Mevcut Durum

### ✅ Tamamlanan
- [x] Temel chat UI (bubble, input, send)
- [x] Skeleton loading
- [x] Türkçe tarih formatı (Bugün, Dün, 25 Kasım)
- [x] Safe area + keyboard handling
- [x] System messages render
- [x] Parse patterns (URL, telefon, email)
- [x] Scroll to bottom button
- [x] Load earlier messages
- [x] **Typing indicator** - Realtime broadcast + theme uyumlu "Yazıyor..." UI
- [x] **Türkçe placeholder** - "Mesaj yaz..."

### ⚠️ Kısmi Çalışan
- [ ] Read receipts (UI var, edge function güncellenmeli)
- [ ] Message status ticks (sent/received/pending)

---

## 1. ✅ Typing Indicator (Tamamlandı)

### Çözüm
- `textInputProps.onChangeText` ile text değişimi yakalanıyor
- `useConversationPresence` ile broadcast gönderiliyor
- `useTypingIndicator` ile store'dan okunuyor
- Custom `renderFooter` ile theme uyumlu "Yazıyor..." gösteriliyor

---

## 2. Long Press Actions (Kolay - 1 saat) ⬅️ ŞİMDİ

### Gerekli
- `react-native-action-sheet` veya custom bottom sheet
- Haptic feedback (zaten var)

### Aksiyonlar
| Aksiyon | Açıklama                                  |
| ------- | ----------------------------------------- |
| Kopyala | Mesaj metnini clipboard'a kopyala         |
| Yanıtla | Reply mode'a geç                          |
| İlet    | Forward modal aç                          |
| Sil     | Sadece kendi mesajları için               |
| Düzenle | Sadece kendi mesajları için (5 dk içinde) |

### Dosyalar
- `components/ChatMessageActions.tsx` - Action sheet component
- `GiftedChatScreen.tsx` - onLongPress handler güncelle

---

## 3. Reply to Message (Orta - 2-3 saat)

### Gerekli
- Swipe gesture (react-native-gesture-handler)
- Reply preview component
- Database: `reply_to_id` field (zaten var)

### UI
```
┌─────────────────────────────┐
│ ↩️ Yanıtlanan mesaj preview │
│ ─────────────────────────── │
│ Yeni mesaj içeriği          │
└─────────────────────────────┘
```

### Dosyalar
- `components/ChatReplyPreview.tsx` - Reply preview
- `components/ChatSwipeableMessage.tsx` - Swipe wrapper
- `hooks/useChatMessages.ts` - reply_to_id ekle
- Edge function: `send-message` - reply_to_id destekle

---

## 4. Read Receipts (Orta - 2 saat)

### Mevcut Durum
- UI'da tick'ler var (sent ✓, received ✓✓)
- Ama gerçek status güncellenmiyor

### Gerekli
- Edge function: `mark-as-read` güncelle
- Realtime: read status broadcast
- UI: Mavi tick'ler (okundu)

### Flow
1. Mesaj görüntülendiğinde `mark-as-read` çağır
2. Edge function status'u `read` yap
3. Realtime ile gönderene bildir
4. UI'da mavi tick göster

### Dosyalar
- `supabase/functions/mark-as-read/index.ts`
- `hooks/useMessages.ts` - useMarkAsRead güncelle
- `components/ChatBubble.tsx` - Mavi tick ekle

---

## 5. Image/Video Messages (Orta - 3-4 saat)

### Gerekli
- `expo-image-picker`
- Supabase Storage upload
- Custom render components

### Flow
1. + butonuna bas → Media picker aç
2. Resim/video seç
3. Supabase Storage'a yükle
4. Mesaj olarak gönder (content_type: image/video)

### Dosyalar
- `components/ChatMediaPicker.tsx` - Picker modal
- `components/ChatMessageImage.tsx` - Image render
- `components/ChatMessageVideo.tsx` - Video render
- `hooks/useMediaUpload.ts` - Upload logic
- Edge function: `send-message` - media_url destekle

---

## 6. Audio Messages (Zor - 4-5 saat)

### Gerekli
- `expo-av` - Recording & playback
- Waveform visualization
- Upload to storage

### UI
```
┌─────────────────────────────┐
│ ▶️ ═══════════════ 0:15     │
└─────────────────────────────┘
```

### Dosyalar
- `components/ChatAudioRecorder.tsx` - Recording UI
- `components/ChatMessageAudio.tsx` - Playback UI
- `hooks/useAudioRecording.ts` - Recording logic

---

## 7. Message Reactions (Zor - 4-5 saat)

### Gerekli
- Emoji picker
- Database: `message_reactions` table
- Realtime sync

### UI
```
┌─────────────────────────────┐
│ Mesaj içeriği               │
│ 👍 2  ❤️ 1  😂 3            │
└─────────────────────────────┘
```

### Dosyalar
- `components/ChatReactionPicker.tsx` - Emoji picker
- `components/ChatReactionBadges.tsx` - Reaction gösterimi
- `hooks/useMessageReactions.ts` - CRUD operations
- Database migration: `message_reactions` table

---

## Öncelik Sırası

1. **Typing Indicator Debug** - Şu an
2. **Long Press Actions** - Hızlı kazanım
3. **Read Receipts** - Önemli UX
4. **Reply to Message** - Önemli özellik
5. **Image/Video Messages** - Orta öncelik
6. **Audio Messages** - Düşük öncelik
7. **Message Reactions** - Düşük öncelik

---

## Edge Functions Durumu

| Function         | Durum           | Güncelleme                  |
| ---------------- | --------------- | --------------------------- |
| `send-message`   | ✅ Çalışıyor     | reply_to_id, media_url ekle |
| `get-messages`   | ✅ Çalışıyor     | reply_to message join ekle  |
| `edit-message`   | ✅ Çalışıyor     | -                           |
| `delete-message` | ✅ Çalışıyor     | -                           |
| `mark-as-read`   | ⚠️ Güncellenmeli | Realtime broadcast ekle     |
| `upload-media`   | 🔧 Yapılacak     | Yeni function               |
