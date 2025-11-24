# Storage Buckets - Media Management

## Bucket Yapısı

### 1. **avatars** (Mevcut) ✅
- **Kullanım:** Kullanıcı profil fotoğrafları
- **Public:** Yes
- **Max Size:** 5MB
- **Allowed Types:** image/jpeg, image/png, image/webp
- **Path:** `{user_id}/avatar.{ext}`

### 2. **post-media** (Yeni) 🆕
- **Kullanım:** Post fotoğrafları ve videoları
- **Public:** Yes
- **Max Size:** 100MB
- **Allowed Types:** 
  - Images: image/jpeg, image/png, image/webp, image/gif
  - Videos: video/mp4, video/quicktime, video/webm
- **Path:** `{user_id}/posts/{post_id}/{filename}.{ext}`
- **Thumbnails:** `{user_id}/posts/{post_id}/thumb_{filename}.{ext}`

### 3. **voice-moments** (Yeni) 🆕
- **Kullanım:** Ses kayıtları
- **Public:** Yes
- **Max Size:** 10MB
- **Allowed Types:** audio/mpeg, audio/mp4, audio/wav, audio/webm
- **Path:** `{user_id}/voice/{voice_id}.{ext}`
- **Duration Limit:** 60 seconds

### 4. **stories** (Yeni) 🆕
- **Kullanım:** 24 saatlik story'ler
- **Public:** Yes
- **Max Size:** 50MB
- **Allowed Types:** image/*, video/*
- **Path:** `{user_id}/stories/{story_id}.{ext}`
- **Auto Delete:** 24 hours (lifecycle policy)

---

## Database Schema

### **post_media** Table
```sql
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- seconds (for video/audio)
  file_size INTEGER, -- bytes
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);
```

---

## Upload Flow

### 1. **Image Upload**
```typescript
1. User selects image
2. Compress/resize (max 1920x1080)
3. Generate thumbnail (320x320)
4. Upload to post-media bucket
5. Create post_media record
6. Create post with media_ids
```

### 2. **Video Upload**
```typescript
1. User selects video
2. Validate duration (max 60s)
3. Generate thumbnail (first frame)
4. Upload to post-media bucket
5. Create post_media record
6. Create post with media_ids
```

### 3. **Voice Upload**
```typescript
1. User records voice
2. Validate duration (max 60s)
3. Compress audio (AAC)
4. Upload to voice-moments bucket
5. Create post with voice_url
```

---

## Security & RLS

### **post-media Bucket Policy**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read
CREATE POLICY "Public can view post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Allow owners to delete
CREATE POLICY "Users can delete own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## File Size Limits

| Type       | Max Size | Recommended |
| ---------- | -------- | ----------- |
| Avatar     | 5MB      | 1MB         |
| Post Image | 10MB     | 2MB         |
| Post Video | 100MB    | 50MB        |
| Voice      | 10MB     | 2MB         |
| Story      | 50MB     | 20MB        |

---

## CDN & Optimization

### **Image Transformations**
```typescript
// Supabase Storage Transformations
const imageUrl = supabase.storage
  .from('post-media')
  .getPublicUrl(path, {
    transform: {
      width: 800,
      height: 800,
      resize: 'contain',
      quality: 80
    }
  });
```

### **Thumbnail Generation**
```typescript
// Server-side (Edge Function)
import sharp from 'sharp';

const thumbnail = await sharp(buffer)
  .resize(320, 320, { fit: 'cover' })
  .jpeg({ quality: 70 })
  .toBuffer();
```

---

## Migration Plan

### Phase 1: Create Buckets ✅
```bash
# Supabase Dashboard → Storage → Create Bucket
1. post-media (public, 100MB)
2. voice-moments (public, 10MB)
3. stories (public, 50MB, lifecycle: 24h)
```

### Phase 2: Database Migration 🆕
```sql
-- Migration: 20251124_post_media_table.sql
CREATE TABLE post_media (...);
ALTER TABLE posts ADD COLUMN has_media BOOLEAN DEFAULT FALSE;
```

### Phase 3: Upload Service 🆕
```typescript
// services/media-upload.service.ts
export async function uploadPostMedia(file, userId, postId) { ... }
```

### Phase 4: UI Components 🆕
```typescript
// components/MediaPicker.tsx
// components/ImagePreview.tsx
// components/VideoPlayer.tsx
```

---

## Next Steps

1. ✅ Create storage buckets (Supabase Dashboard)
2. 🆕 Run database migration (post_media table)
3. 🆕 Implement upload service
4. 🆕 Update CreatePostModal (media picker)
5. 🆕 Update useCreatePost hook (media upload)
6. 🆕 Test end-to-end flow
