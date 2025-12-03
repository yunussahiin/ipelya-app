# Admin Chat System

Admin'ler arası iletişim için gelişmiş mesajlaşma sistemi.

## Özellikler

### Temel Özellikler
- ✅ Direct mesajlaşma (1-1)
- ✅ Grup sohbetleri
- ⏳ Medya paylaşımı (resim, video, dosya, ses)
- ⏳ Sayfalama (10'ar mesaj yükleme)
- ⏳ Okundu durumu (gerçek zamanlı)
- ⏳ Yazıyor... göstergesi
- ⏳ Mesaj arama
- ⏳ Mesaj sabitleme

### Medya Desteği
- Resim: JPEG, PNG, GIF, WebP (max 50MB)
- Video: MP4, QuickTime (max 50MB)
- Ses: MP3, MP4, WAV (max 50MB)
- Dosya: PDF, DOC, DOCX, XLS, XLSX (max 50MB)

## Mimari

```
/apps/web/app/ops/(private)/admin-chat/
├── page.tsx                    # Ana sayfa (container)
├── components/
│   ├── index.ts               # Export barrel
│   ├── ChatLayout.tsx         # Ana layout
│   ├── ConversationList/
│   │   ├── index.tsx          # Sohbet listesi
│   │   ├── ConversationItem.tsx
│   │   └── ConversationSkeleton.tsx
│   ├── ChatWindow/
│   │   ├── index.tsx          # Chat penceresi
│   │   ├── ChatHeader.tsx     # Sohbet başlığı
│   │   ├── MessageList.tsx    # Mesaj listesi (scroll + pagination)
│   │   ├── MessageBubble.tsx  # Tek mesaj
│   │   ├── MessageInput.tsx   # Mesaj giriş alanı
│   │   ├── MediaPreview.tsx   # Medya önizleme
│   │   └── TypingIndicator.tsx
│   ├── NewChatDialog/
│   │   ├── index.tsx          # Yeni sohbet dialog
│   │   └── AdminSelector.tsx  # Admin seçici
│   └── MediaUpload/
│       ├── index.tsx          # Medya yükleme
│       ├── ImageUpload.tsx
│       ├── FileUpload.tsx
│       └── VoiceRecorder.tsx
├── hooks/
│   ├── useAdminChat.ts        # Ana chat hook
│   ├── useMessages.ts         # Mesaj yönetimi
│   ├── useConversations.ts    # Sohbet listesi
│   ├── useMediaUpload.ts      # Medya yükleme
│   └── useTypingIndicator.ts  # Yazıyor göstergesi
└── types.ts                   # TypeScript types
```

## Database Schema

### ops_conversations
| Column          | Type        | Description             |
| --------------- | ----------- | ----------------------- |
| id              | uuid        | Primary key             |
| type            | text        | 'direct' veya 'group'   |
| name            | text        | Grup adı (nullable)     |
| avatar_url      | text        | Grup avatarı (nullable) |
| created_by      | uuid        | Oluşturan admin         |
| last_message_id | uuid        | Son mesaj ID            |
| last_message_at | timestamptz | Son mesaj zamanı        |
| is_archived     | boolean     | Arşivlenmiş mi          |
| created_at      | timestamptz | Oluşturulma zamanı      |

### ops_conversation_participants
| Column               | Type        | Description               |
| -------------------- | ----------- | ------------------------- |
| id                   | uuid        | Primary key               |
| conversation_id      | uuid        | Sohbet ID                 |
| admin_id             | uuid        | Admin ID                  |
| role                 | text        | 'admin' veya 'member'     |
| joined_at            | timestamptz | Katılma zamanı            |
| left_at              | timestamptz | Ayrılma zamanı (nullable) |
| is_muted             | boolean     | Sessize alınmış mı        |
| last_read_at         | timestamptz | Son okuma zamanı          |
| last_read_message_id | uuid        | Son okunan mesaj          |
| unread_count         | integer     | Okunmamış mesaj sayısı    |

### ops_messages
| Column          | Type        | Description                               |
| --------------- | ----------- | ----------------------------------------- |
| id              | uuid        | Primary key                               |
| conversation_id | uuid        | Sohbet ID                                 |
| sender_id       | uuid        | Gönderen admin ID                         |
| content         | text        | Mesaj içeriği                             |
| content_type    | text        | 'text', 'image', 'video', 'audio', 'file' |
| media_url       | text        | Medya URL'i (nullable)                    |
| media_metadata  | jsonb       | Medya bilgileri (size, duration, etc.)    |
| reply_to_id     | uuid        | Yanıtlanan mesaj (nullable)               |
| mentions        | jsonb       | Bahsedilen admin'ler                      |
| is_edited       | boolean     | Düzenlenmiş mi                            |
| is_deleted      | boolean     | Silinmiş mi                               |
| created_at      | timestamptz | Gönderilme zamanı                         |

## Storage

### Bucket: ops-admin-chat
- **Path:** `{conversation_id}/{message_id}/{filename}`
- **Max Size:** 50MB
- **Allowed Types:**
  - Images: image/jpeg, image/png, image/gif, image/webp
  - Videos: video/mp4, video/quicktime
  - Audio: audio/mpeg, audio/mp4, audio/wav
  - Files: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*

## Edge Functions

### ops-admin-chat-upload
Medya yükleme işlemi için edge function.

**Request:**
```typescript
{
  conversation_id: string;
  file: File;
  content_type: 'image' | 'video' | 'audio' | 'file';
}
```

**Response:**
```typescript
{
  success: boolean;
  url: string;
  metadata: {
    size: number;
    mime_type: string;
    width?: number;
    height?: number;
    duration?: number;
  };
}
```

## UI/UX Standartları

### Renk Paleti
- Background: `bg-background`
- Surface: `bg-card`
- Muted: `bg-muted`
- Border: `border-border`
- Primary: `text-primary`
- Muted text: `text-muted-foreground`

### Spacing
- Card padding: 16px
- Gap: 12px
- Border radius: 12px (cards), 16px (bubbles)

### Animasyonlar
- Mesaj geçişleri: fade-in
- Scroll: smooth
- Hover: scale(1.02)

## Realtime

### Channels
- `ops:chat:{conversation_id}` - Mesaj güncellemeleri
- `ops:typing:{conversation_id}` - Yazıyor göstergesi
- `ops:presence:admin-chat` - Online durumu

### Events
- `message:new` - Yeni mesaj
- `message:update` - Mesaj güncelleme
- `message:delete` - Mesaj silme
- `typing:start` - Yazmaya başladı
- `typing:stop` - Yazmayı bıraktı

## API Endpoints

### Messages
- `GET /api/ops/admin-chat/messages?conversation_id=xxx&limit=10&before=xxx`
- `POST /api/ops/admin-chat/messages`
- `PATCH /api/ops/admin-chat/messages/:id`
- `DELETE /api/ops/admin-chat/messages/:id`

### Conversations
- `GET /api/ops/admin-chat/conversations`
- `POST /api/ops/admin-chat/conversations`
- `PATCH /api/ops/admin-chat/conversations/:id`

### Media
- `POST /api/ops/admin-chat/upload`

## Güvenlik

- RLS policies ile erişim kontrolü
- Admin rolü zorunlu
- Medya yüklemede MIME type kontrolü
- Rate limiting
