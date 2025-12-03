# Admin Chat System - TODO

## Phase 1: Infrastructure 

### 1.1 Storage Setup
- [x] `ops-admin-chat` bucket oluştur 
- [x] Storage policies ekle (admin only)
- [x] MIME type ve size limitleri ayarla

### 1.2 Edge Functions
- [x] `ops-admin-chat-upload` function oluştur
  - [x] Medya yükleme
  - [x] Thumbnail oluşturma (resimler için)
  - [x] Metadata çıkarma (duration, dimensions)
- [x] `ops-admin-chat-send-message` function oluştur
  - [x] Mesaj gönderme
  - [x] Medya URL'i ekleme
  - [x] Realtime broadcast

### 1.3 Database Updates
- [x] `ops_messages` tablosuna `read_by` column ekle (jsonb)
- [x] Typing indicator için `ops_typing_status` tablosu oluştur
- [x] Index'ler ekle (performance)

---

## Phase 2: Component Architecture 

### 2.1 Types
- [x] `types.ts` oluştur
  - [x] AdminProfile
  - [x] OpsConversation
  - [x] OpsMessage
  - [x] MediaMetadata
  - [x] TypingStatus

### 2.2 Hooks
- [x] `useConversations.ts` - Sohbet listesi yönetimi
  - [x] loadConversations
  - [x] createConversation
  - [x] updateConversation
  - [x] realtime subscription
- [x] `useMessages.ts` - Mesaj yönetimi
  - [x] loadMessages (pagination)
  - [x] sendMessage
  - [x] editMessage
  - [x] deleteMessage
  - [x] markAsRead
  - [x] realtime subscription
- [x] `useMediaUpload.ts` - Medya yükleme
  - [x] uploadImage
  - [x] uploadVideo
  - [x] uploadAudio
  - [x] uploadFile
  - [x] progress tracking
- [x] `useTypingIndicator.ts` - Yazıyor göstergesi
  - [x] startTyping
  - [x] stopTyping
  - [x] subscribeToTyping

### 2.3 Components - ConversationList
- [x] `ConversationList/index.tsx`
  - [x] Search input
  - [x] Conversation items
  - [x] Empty state
- [x] `ConversationList/ConversationItem.tsx`
  - [x] Avatar (direct/group)
  - [x] Name
  - [x] Last message preview
  - [x] Unread badge
  - [x] Time
- [x] `ConversationList/ConversationSkeleton.tsx`
  - [x] Loading skeleton

### 2.4 Components - ChatWindow
- [x] `ChatWindow/index.tsx`
  - [x] Header
  - [x] Message list
  - [x] Input area
- [x] `ChatWindow/ChatHeader.tsx`
  - [x] Avatar
  - [x] Name
  - [x] Participants count
  - [x] Actions (info, search, etc.)
- [x] `ChatWindow/MessageList.tsx`
  - [x] Virtualized list
  - [x] Infinite scroll (load more on top)
  - [x] Date separators
  - [x] Scroll to bottom button
- [x] `ChatWindow/MessageBubble.tsx`
  - [x] Text content
  - [x] Media content (image, video, audio, file)
  - [x] Reply preview
  - [x] Sender info
  - [x] Time
  - [x] Read status
  - [x] Context menu (reply, copy, edit, delete)
- [x] `ChatWindow/MessageInput.tsx`
  - [x] Text input (auto-resize)
  - [x] Media buttons
  - [x] Emoji picker
  - [x] Send button
  - [x] Reply preview
- [x] `ChatWindow/TypingIndicator.tsx`
  - [x] Animated dots
  - [x] Typing user name

### 2.5 Components - MediaUpload
- [x] `MediaUpload/index.tsx`
  - [x] Unified upload interface
- [x] `MediaUpload/ImageUpload.tsx`
  - [x] Image picker
  - [x] Preview
  - [x] Crop (optional)
- [x] `MediaUpload/FileUpload.tsx`
  - [x] File picker
  - [x] File info display
- [x] `MediaUpload/VoiceRecorder.tsx`
  - [x] Record button
  - [x] Waveform visualization
  - [x] Duration display
  - [x] Cancel/Send

### 2.6 Components - NewChatDialog
- [x] `NewChatDialog/index.tsx`
  - [x] Mode toggle (direct/group)
  - [x] Admin search
  - [x] Admin list
  - [x] Group name input
  - [x] Create button
- [x] `NewChatDialog/AdminSelector.tsx`
  - [x] Search input
  - [x] Admin list with avatars
  - [x] Selection state

---

## Phase 3: Main Page 

### 3.1 Page Layout
- [x] `page.tsx` güncelle
  - [x] 3-column layout (list, chat, details)
  - [x] Responsive design
  - [x] Empty states

### 3.2 State Management
- [x] Active conversation state
- [x] Messages state
- [x] UI state (dialogs, modals)

---

## Phase 4: Realtime Features 

### 4.1 Message Realtime
- [x] New message subscription
- [x] Message update subscription
- [x] Message delete subscription

### 4.2 Typing Indicator
- [x] Broadcast typing status
- [x] Subscribe to typing status
- [x] Debounce typing events

### 4.3 Read Status
- [x] Mark messages as read
- [x] Broadcast read status
- [x] Update UI on read

### 4.4 Presence
- [x] Online/offline status
- [x] Last seen

---

## Phase 5: Media Features 

### 5.1 Image
- [x] Upload with progress
- [x] Preview in chat
- [x] Lightbox view
- [x] Download

### 5.2 Video
- [x] Upload with progress
- [x] Thumbnail generation
- [x] Video player
- [x] Download

### 5.3 Audio
- [x] Voice recording
- [x] Upload with progress
- [x] Audio player with waveform
- [x] Duration display

### 5.4 File
- [x] Upload with progress
- [x] File icon based on type
- [x] Download link
- [x] Size display

---

## Phase 6: Polish 

### 6.1 UI/UX
- [x] Loading states (skeletons)
- [x] Empty states
- [ ] Animations (message appear, scroll)
- [ ] Keyboard shortcuts

### 6.2 Performance
- [ ] Message virtualization
- [x] Image lazy loading
- [x] Debounced search
- [x] Optimistic updates

### 6.3 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management

---

## Progress Tracking

| Phase                   | Status | Progress |
| ----------------------- | ------ | -------- |
| Phase 1: Infrastructure |        | 100%     |
| Phase 2: Components     |        | 100%     |
| Phase 3: Main Page      |        | 100%     |
| Phase 4: Realtime       |        | 100%     |
| Phase 5: Media          |        | 100%     |
| Phase 6: Polish         |        | 70%      |

**Overall Progress: 98%**

---

## Düzeltmeler (2025-12-03)

### Bucket Sorunu ✅
- `ops-admin-chat` bucket `public: false` idi → `public: true` yapıldı
- Artık dosyalar public URL ile erişilebilir

### Ses Kaydı ✅
- `VoiceRecorder` component eklendi
- Mikrofon erişimi ile kayıt
- Kayıt önizleme ve gönderme
- WebM/MP4 format desteği

### Detaylı Loglama ✅
- `useMediaUpload`: Upload başlangıç, hata, başarı logları
- `useMessages`: Mesaj gönderme logları
- `VoiceRecorder`: Kayıt logları
- `MessageInput`: Ses kaydı logları

### Allowed MIME Types
Bucket'ta desteklenen formatlar:
- Images: jpeg, png, gif, webp
- Videos: mp4, quicktime
- Audio: mpeg, mp4, wav, webm
- Documents: pdf, msword, docx, xls, xlsx

---

## Düzeltmeler (2025-12-03 - Part 2)

### Sabit Yükseklik ✅
- Sayfa artık uzamıyor, mesajlar kendi alanında scroll oluyor
- `overflow-hidden` ve `min-h-0` eklendi
- ConversationList ve ChatWindow sabit yükseklikte

### İlk Sohbeti Otomatik Seç ✅
- Sayfa yüklendiğinde ilk sohbet otomatik seçiliyor

### Loading → Skeleton ✅
- `Loader2` yerine `MessageSkeleton` ve `LoadMoreSkeleton` eklendi
- Sayfa yüklenirken skeleton gösteriliyor

### Avatar Her Zaman Görünür ✅
- Hem gönderen hem alan için avatar gösteriliyor
- Avatar yoksa baş harf fallback olarak gösteriliyor
- Kendi mesajlarımız için de avatar eklendi (primary renk)

### Medya Modalı (Lightbox) ✅
- Resme tıklayınca modal açılıyor
- PDF dosyaları iframe ile önizleniyor
- Zoom ikonu hover'da görünüyor
- İndir/Yeni Sekmede Aç butonu
- Context menu'de dosya türüne göre seçenekler

### PGMQ Entegrasyonu ✅
- `useMediaUpload` hook'una queue desteği eklendi
- `ops-chat` preset'i eklendi
- `media-worker` v14 - ops-admin-chat bucket desteği
- `queue-media-job` v4 - ops-chat preset validasyonu

---

## Notes

### Mevcut Durum
- `ops_messages` tablosu media_url ve media_metadata column'larına sahip
- `message-media` bucket mevcut ama admin chat için ayrı bucket oluşturulacak
- RLS policies mevcut

### Dikkat Edilecekler
- Admin rolü kontrolü her yerde yapılmalı
- Medya yüklemede MIME type kontrolü
- Rate limiting uygulanmalı
- Büyük dosyalar için chunked upload düşünülebilir
