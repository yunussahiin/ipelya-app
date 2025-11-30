# 📖 İPELYA Stories System - Implementation TODO

> Instagram/Snapchat tarzı 24 saatlik hikaye sistemi

## 📊 Genel Bakış

Stories sistemi kullanıcıların 24 saat sonra kaybolan fotoğraf ve video içerikleri paylaşmasını sağlar.

### Temel Özellikler
- 24 saat sonra otomatik silinen içerikler (soft delete → 7 gün sonra hard delete)
- Fotoğraf ve video desteği (max 15 saniye)
- Filtre ve efekt desteği (VisionCamera ile)
- Görüntülenme takibi (metadata ile bot analizi)
- Tepki sistemi (enum-based reactions)
- Highlight'lara kaydetme (expire olmaz)
- Visibility kontrolü (public, followers, close_friends, subscribers, private)
- Shadow profil desteği
- Story muting (kullanıcı bazlı)
- Report/moderation sistemi

---

## 🗄️ Phase 1: Database Schema

### 1.1 Reaction Type Enum
```sql
-- Emoji reactions için stabil enum
CREATE TYPE story_reaction_type AS ENUM ('heart', 'laugh', 'wow', 'sad', 'angry', 'fire');
```

**Status:** [x] ✅ Completed

### 1.2 Stories Table
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  
  -- Media
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  duration INTEGER, -- Video için saniye cinsinden
  
  -- Processing (video transcoding için)
  processing_status TEXT NOT NULL DEFAULT 'processed' 
    CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
  
  -- Metadata
  caption TEXT,
  location TEXT,
  music_id UUID, -- Gelecekte müzik entegrasyonu için
  
  -- Filter/Effect bilgisi
  filter_id TEXT,
  filter_settings JSONB DEFAULT '{}',
  
  -- Visibility & Privacy
  visibility TEXT NOT NULL DEFAULT 'public' 
    CHECK (visibility IN ('public', 'followers', 'close_friends', 'subscribers', 'private')),
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  
  -- Soft Delete & Archiving
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Highlights (expire olmaz)
  is_highlighted BOOLEAN DEFAULT false,
  
  -- Moderation
  is_hidden BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  -- Idempotency (duplicate upload prevention)
  client_request_id UUID UNIQUE
);

-- Indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_user_profile ON stories(user_id, profile_type);
CREATE INDEX idx_stories_expires_at ON stories(expires_at) 
  WHERE expires_at > now() AND is_deleted = false;
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_processing ON stories(processing_status) 
  WHERE processing_status != 'processed';
```

**Status:** [x] ✅ Completed

### 1.3 Story Views Table
```sql
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Analytics metadata (bot detection, device info)
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at DESC);
```

**Status:** [x] ✅ Completed

### 1.4 Story Reactions Table
```sql
CREATE TABLE story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type story_reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(story_id, user_id)
);

CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX idx_story_reactions_user_id ON story_reactions(user_id);
```

**Status:** [x] ✅ Completed

### 1.5 Story Mutes Table (Kullanıcı bazlı sessize alma)
```sql
CREATE TABLE story_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, muted_user_id)
);

CREATE INDEX idx_story_mutes_user_id ON story_mutes(user_id);
```

**Status:** [x] ✅ Completed

### 1.6 Story Reports Table (Moderation)
```sql
CREATE TABLE story_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'nudity', 'violence', 'harassment', 'hate_speech', 
    'false_info', 'scam', 'self_harm', 'other'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(story_id, reporter_id)
);

CREATE INDEX idx_story_reports_story_id ON story_reports(story_id);
CREATE INDEX idx_story_reports_status ON story_reports(status) WHERE status = 'pending';
```

**Status:** [x] ✅ Completed

### 1.7 Close Friends Table (Yakın arkadaşlar)
```sql
CREATE TABLE close_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_close_friends_user_id ON close_friends(user_id);
CREATE INDEX idx_close_friends_friend_id ON close_friends(friend_id);
```

**Status:** [x] ✅ Completed

### 1.8 Story Highlights Tables
```sql
CREATE TABLE story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'real' CHECK (profile_type IN ('real', 'shadow')),
  title TEXT NOT NULL,
  cover_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE SET NULL,
  -- Archived story data (story silinse bile highlight'ta kalsın)
  archived_media_url TEXT,
  archived_media_type TEXT,
  archived_thumbnail_url TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(highlight_id, story_id)
);

CREATE INDEX idx_story_highlights_user_id ON story_highlights(user_id);
CREATE INDEX idx_story_highlight_items_highlight_id ON story_highlight_items(highlight_id);
```

**Status:** [x] ✅ Completed

### 1.9 RLS Policies
```sql
-- =============================================
-- STORIES RLS
-- =============================================
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- SELECT: Visibility kontrolü + block kontrolü
CREATE POLICY "stories_select_policy" ON stories
  FOR SELECT USING (
    -- Aktif ve onaylı story'ler
    (expires_at > now() OR is_highlighted = true) AND 
    is_deleted = false AND
    is_hidden = false AND 
    moderation_status = 'approved' AND
    processing_status = 'processed' AND
    (
      -- Public: herkes görebilir
      visibility = 'public' OR
      -- Kendi story'leri
      user_id = auth.uid() OR
      -- Followers: takipçiler görebilir
      (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = stories.user_id
      )) OR
      -- Close Friends: yakın arkadaşlar görebilir
      (visibility = 'close_friends' AND EXISTS (
        SELECT 1 FROM close_friends WHERE user_id = stories.user_id AND friend_id = auth.uid()
      )) OR
      -- Subscribers: aboneler görebilir
      (visibility = 'subscribers' AND EXISTS (
        SELECT 1 FROM creator_subscriptions 
        WHERE creator_id = stories.user_id AND subscriber_id = auth.uid() AND status = 'active'
      ))
    ) AND
    -- Block kontrolü
    NOT EXISTS (
      SELECT 1 FROM blocks 
      WHERE (blocker_id = stories.user_id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = stories.user_id)
    )
  );

CREATE POLICY "stories_insert_policy" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_policy" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "stories_delete_policy" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORY VIEWS RLS
-- =============================================
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_views_select_policy" ON story_views
  FOR SELECT USING (
    -- Story sahibi tüm view'ları görebilir
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid()) OR
    -- Kendi view'ını görebilir
    viewer_id = auth.uid()
  );

CREATE POLICY "story_views_insert_policy" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =============================================
-- STORY REACTIONS RLS
-- =============================================
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_reactions_select_policy" ON story_reactions
  FOR SELECT USING (true);

CREATE POLICY "story_reactions_insert_policy" ON story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_reactions_delete_policy" ON story_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORY MUTES RLS
-- =============================================
ALTER TABLE story_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_mutes_select_policy" ON story_mutes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "story_mutes_insert_policy" ON story_mutes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_mutes_delete_policy" ON story_mutes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORY REPORTS RLS
-- =============================================
ALTER TABLE story_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_reports_insert_policy" ON story_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =============================================
-- CLOSE FRIENDS RLS
-- =============================================
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "close_friends_select_policy" ON close_friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "close_friends_insert_policy" ON close_friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "close_friends_delete_policy" ON close_friends
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORY HIGHLIGHTS RLS
-- =============================================
ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_highlights_select_policy" ON story_highlights
  FOR SELECT USING (true);

CREATE POLICY "story_highlights_insert_policy" ON story_highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_highlights_update_policy" ON story_highlights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "story_highlights_delete_policy" ON story_highlights
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE story_highlight_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_highlight_items_select_policy" ON story_highlight_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM story_highlights WHERE id = highlight_id)
  );

CREATE POLICY "story_highlight_items_insert_policy" ON story_highlight_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM story_highlights WHERE id = highlight_id AND user_id = auth.uid())
  );

CREATE POLICY "story_highlight_items_delete_policy" ON story_highlight_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM story_highlights WHERE id = highlight_id AND user_id = auth.uid())
  );
```

**Status:** [x] ✅ Completed

---

## ⚡ Phase 2: Edge Functions

### 2.1 create-story ✅
- [x] Media URL ve metadata al
- [x] Story kaydı oluştur
- [x] Idempotency (client_request_id) desteği
- [ ] Takipçilere bildirim gönder (opsiyonel - sonra eklenecek)

### 2.2 get-stories ✅
- [x] Takip edilen kullanıcıların aktif hikayelerini getir
- [x] Kullanıcı bazlı gruplama
- [x] Görüntülenme durumu (viewed/unviewed)
- [x] Sıralama: Görüntülenmemiş önce, sonra en yeni
- [x] Muted kullanıcıları filtrele

### 2.3 get-user-stories ✅
- [x] Belirli kullanıcının aktif hikayelerini getir
- [x] Profil sayfası için
- [x] Kullanıcının tepkisi dahil

### 2.4 view-story ✅
- [x] Story görüntülenme kaydı
- [x] ON CONFLICT DO NOTHING (idempotent)
- [x] views_count increment
- [x] Kendi story'yi saymama

### 2.5 react-to-story ✅
- [x] Tepki ekle/kaldır (toggle)
- [x] reactions_count güncelle
- [x] Aynı tepki = kaldır, farklı tepki = güncelle
- [ ] Story sahibine bildirim gönder (sonra eklenecek)

### 2.6 delete-story ✅
- [x] Soft delete (is_deleted = true)
- [x] Highlight'ta olanlar korunur

### 2.7 cleanup-expired-stories (Cron Job)
- [ ] expires_at < now() AND is_highlighted = false olanları soft delete
- [ ] 7 gün sonra hard delete
- [ ] Storage'dan media dosyalarını sil
- [ ] Her saat çalışacak

**Status:** [x] ✅ 6/7 Completed (Cron job pending)

---

## 📱 Phase 3: Mobile Components

### 3.1 StoriesRow (Feed Header) ✅
**Dosya:** `/components/home-feed/StoriesRow/index.tsx`

- [x] Horizontal ScrollView
- [x] İlk item: "Hikaye Ekle" butonu (kendi avatarı + plus icon)
- [x] StoryCircle component'leri
- [x] Görüntülenmemiş hikayeler: Gradient ring
- [x] Görüntülenmiş hikayeler: Gray ring
- [x] Skeleton loading state
- [x] useStories hook entegrasyonu
- [x] Tema renkleri (light/dark) desteği

### 3.2 StoryCircle ✅
**Dosya:** `/components/home-feed/StoriesRow/components/StoryCircle.tsx`

- [x] Avatar image (expo-image)
- [x] Gradient ring (unviewed) - LinearGradient
- [x] Gray ring (viewed)
- [x] Username (truncated)
- [x] onPress handler

### 3.2.1 AddStoryCircle ✅
**Dosya:** `/components/home-feed/StoriesRow/components/AddStoryCircle.tsx`

- [x] Dashed border ring
- [x] Avatar + Plus icon
- [x] Gradient plus badge

### 3.2.2 StoriesRowSkeleton ✅
**Dosya:** `/components/home-feed/StoriesRow/components/StoriesRowSkeleton.tsx`

- [x] Animated pulse skeleton
- [x] Tema renklerine uyumlu

### 3.2.3 FeedList Entegrasyonu ✅
**Dosya:** `/components/home-feed/FeedList/index.tsx`

- [x] StoriesRow import
- [x] FlashList ListHeaderComponent olarak eklendi
- [x] Sadece "feed" tab'ında gösterilir (trending/following'de yok)

### 3.2.4 Profile Loading ✅
**Dosya:** `/hooks/useLoadProfile.ts` + `/app/_layout.tsx`

- [x] useLoadProfile hook oluşturuldu
- [x] App başlangıcında profile yükleniyor
- [x] Avatar URL'i profile store'a kaydediliyor
- [x] AddStoryCircle'da profil resmi gösteriliyor

### 3.2.5 StoryMediaPicker ✅
**Dosya:** `/components/home-feed/ContentCreator/StoryMediaPicker.tsx`

- [x] Instagram tarzı galeri picker
- [x] Header: X butonu, "Hikayeye ekle" başlık, ayarlar
- [x] Albüm seçici dropdown
- [x] Galeri grid (ilk item kamera butonu)
- [x] Tek medya seçimi (hikaye için)
- [x] Kamera butonuna tıklayınca VisionCamera açılır

### 3.3 StoryViewer (Tam Ekran)
**Dosya:** `/components/home-feed/StoryViewer/index.tsx`

- [ ] Tam ekran modal
- [ ] Swipe left/right: Sonraki/önceki hikaye
- [ ] Tap left/right: Sonraki/önceki hikaye
- [ ] Long press: Duraklat
- [ ] Progress bar (üstte)
- [ ] User info (avatar, username, time)
- [ ] Close button
- [ ] Reply input (DM gönder)
- [ ] Reaction picker
- [ ] Video için auto-play

### 3.4 StoryProgressBar
**Dosya:** `/components/home-feed/StoryViewer/StoryProgressBar.tsx`

- [ ] Segment'li progress bar
- [ ] Her hikaye için bir segment
- [ ] Aktif segment animasyonlu dolum
- [ ] Tamamlanan segmentler dolu

### 3.5 StoryReactionPicker
**Dosya:** `/components/home-feed/StoryViewer/StoryReactionPicker.tsx`

- [ ] Emoji seçici (❤️ 😂 😮 😢 😡 🔥)
- [ ] Haptic feedback
- [ ] Animasyonlu seçim

### 3.6 StoryCreator Güncellemesi
**Dosya:** `/components/home-feed/ContentCreator/StoryCreator.tsx`

- [x] VisionCamera entegrasyonu
- [x] Fotoğraf çekimi
- [x] Video çekimi (15 saniye max)
- [x] Filtre ve efekt desteği
- [ ] Story API'ye kaydetme
- [ ] Başarılı kayıt sonrası modal kapatma

**Status:** [ ] Pending

---

## 🪝 Phase 4: Hooks & State

### 4.1 useStories Hook
**Dosya:** `/hooks/home-feed/useStories.ts`

- [ ] Takip edilen kullanıcıların hikayelerini fetch
- [ ] React Query ile caching
- [ ] Infinite scroll (opsiyonel)
- [ ] Refetch on focus

### 4.2 useStoryViewer Hook
**Dosya:** `/hooks/home-feed/useStoryViewer.ts`

- [ ] Aktif hikaye state
- [ ] Navigation (next/prev)
- [ ] Progress tracking
- [ ] Auto-advance timer
- [ ] Pause/resume

### 4.3 useCreateStory Hook
**Dosya:** `/hooks/home-feed/useCreateStory.ts`

- [ ] Media upload
- [ ] Story oluşturma API çağrısı
- [ ] Loading/error state
- [ ] Cache invalidation

**Status:** [ ] Pending

---

## 🔔 Phase 5: Notifications

### 5.1 Story Bildirimleri
- [ ] "X hikaye paylaştı" bildirimi (takipçilere)
- [ ] "X hikayene tepki verdi" bildirimi
- [ ] "X hikayeni görüntüledi" bildirimi (opsiyonel, ayarlanabilir)

**Status:** [ ] Pending

---


1️⃣ Fikirlere bazı ekler

1.1 Story Visibility & Privacy

Şu an herkes görebilir gibi tasarlamışsın. İleride lazım olabilir:
ALTER TABLE stories
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'followers', 'close_friends', 'private'));

  	public: herkese açık (şu anki davranış)
	•	followers: sadece takipçiler
	•	close_friends: ayrı bir tablo ile ilişkilendirirsin (close_friends(user_id, friend_id))
	•	private: sadece sahibi görebilir (draft / test amaçlı bile işine yarar)
  ayrıca creatorler kendi abonelerine görede gösterim sağlayabilir. ücretli abonelerden, 
  ayrıca shadow profiliyle de shadow da gözükecek story atabilir.

  1.2 Soft Delete & Archiving

Cron job her şeyi hard delete yapıyor. Analitik vs için ileride pişman olabilirsin.

ALTER TABLE stories
ADD COLUMN is_deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_at TIMESTAMPTZ;

	•	Cron’da önce is_deleted = true yapıp deleted_at set edip,
	•	Asıl fiziksel silme işini daha geç (örneğin 7 gün sonra ayrı bir cron) yapabilirsin.

  1.3 Highlights & Expiration Çakışması

Highlight’a alınan story’nin expires_at mantıksal olarak bitse bile:
	•	Storage’daki dosyayı silmemelisin veya
	•	Story’yi başka bir storage'a tabloya archive edip highlights oraya bağlanmalı.

  En azından:

ALTER TABLE stories
ADD COLUMN is_highlighted BOOLEAN DEFAULT false;

Cron’da:

WHERE expires_at < now() AND is_highlighted = false

diye filtrelersin.


1.4 Reactions / Views Data Quality
	•	story_reactions.reaction_type için enum daha güvenli:
  CREATE TYPE story_reaction_type AS ENUM ('heart', 'laugh', 'wow', 'sad', 'angry', 'fire');

ALTER TABLE story_reactions
ADD COLUMN reaction story_reaction_type;

moji’yi frontende maplersin. DB tarafında stabil bir enum olur.
	•	story_views için IP / device fingerprint gibi şeyleri (çok ileri seviye için) bir metadata JSONB alanına atabilirsin:
  ALTER TABLE story_views
ADD COLUMN metadata JSONB DEFAULT '{}';

Bot / sahte trafik analizi için hoş olur.



2.1 Idempotency & Rate Limiting
	•	create-story için:
	•	Aynı dosyanın iki kere gönderilmesini önlemek için isteğe client_request_id koyup (UUID) bunu DB’de unique tutabilirsin.
	•	view-story:
	•	Zaten UNIQUE(story_id, viewer_id) var ama function tarafında conflict handling yap: ON CONFLICT DO NOTHING + views_count increment için transaction.

2.2 Transactions

Özellikle:
	•	view-story
	•	react-to-story

iki tabloyu update ediyor (views/reactions + stories counters). Supabase function içinde:

BEGIN;
  -- insert / delete
  -- update counter
COMMIT;

şeklinde transactional gitmek önemli, yoksa count boşa çıkar.

⸻

2.3 Media Upload / Transcoding Flow

Şu an plan media_url hazır geliyor gibi:

Ek düşünce:
	•	status kolonları:
  ALTER TABLE stories
ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (processing_status IN ('pending', 'processed', 'failed'));

  	Özellikle video için: önce yükle → transcoding (edge function / external service) → hazır olunca processed yap. get-stories sadece processed olanları döner.

⸻

3️⃣ Mobile UI / UX Ekleri

3.1 Story Muting & Management
	•	Kullanıcı birini sessize alma:
	•	muted_stories(user_id, muted_user_id).
	•	get-stories’de bu listeye göre filtrele.
	•	StoriesRow’da:
	•	Long press ile “Hikayelerini sessize al” / “Sessizden çıkar”.

3.2 Error States & Empty States
	•	StoriesRow:
	•	Hiç hikaye yoksa: “Takip ettiğin kişilerin şu an aktif hikayesi yok.” gibi bir empty component.
	•	StoryViewer:
	•	Story yüklenemediğinde (404 media, expired vs): “Bu hikaye artık mevcut değil” ekranı.

3.3 Accessibility / UX detayları
	•	StoryProgressBar: tik tik ilerlemek yerine smooth animasyon + pause’da animasyonu durdurma.
	•	Video’da:
	•	Ses aç/kapat butonu
	•	Mute default (Instagram gibi)

⸻

4️⃣ Hooks / State Tarafında Küçük Ekler

4.1 useStories
	•	Prefetch next user’s stories: Kullanıcı son story’ye yaklaşınca bir sonraki kullanıcının stories’ini önceden fetch et.
	•	staleTime ve cacheTime değerlerini iyi ayarla (örneğin 30–60sn) ki her focus’ta patlayıp yeniden çekmesin.

4.2 useStoryViewer
	•	Analytics için mini callback’ler:
	•	onStoryStart, onStoryComplete
	•	Bunlarla ileride “completion rate” vs hesaplayabilirsin.

4.3 useCreateStory
	•	Upload fail durumunda retry mekanizması (max 3 retry).
	•	Başarılı olunca:
	•	stories query’sini invalidate et
	•	Lokal olarak optimistic story ekleyip progress barı direkt göster.

⸻

5️⃣ Notifications & Privacy

Bildirimler tarafına ek düşünebileceğin ayarlar:
	•	Story views bildirimi varsayılan kapalı olsun; kullanıcı ayarlardan açsın. ya ad o kişinin profilidne bildirim almak isteyecek.

6️⃣ Moderation & Safety
	•	Story’e “report” özelliği ekleyebilirsin:
	•	story_reports (id, story_id, reporter_id, reason, created_at, status)
	•	stories.moderation_status = 'pending' default yapıp,
	•	İlerde otomatik / manuel moderation pipeline’ına bağlayabilirsin.
	•	RLS’de şu an herkes approved story’leri görebiliyor, mantıklı; ama ileride:
	•	Engellenen kullanıcılar (blocks tablosu) birbirinin story’sini göremesin (SELECT policy’ye subquery ile ek koşul).

⸻

7️⃣ Testing Ekleri
	•	Cron job testleri:
	•	Expired story silinince gerçekten storage’dan da gidiyor mu (mock / integration).
	•	Load test:
	•	Aynı anda çok sayıda view + reaction geldiğinde counter’lar tutarlı kalıyor mu (transaction + ON CONFLICT testleri).

⸻




## 🧪 Phase 6: Testing

### 6.1 Unit Tests
- [ ] useStories hook tests
- [ ] useStoryViewer hook tests
- [ ] useCreateStory hook tests

### 6.2 Component Tests
- [ ] StoriesRow rendering
- [ ] StoryCircle states (viewed/unviewed)
- [ ] StoryViewer navigation

### 6.3 Integration Tests
- [ ] Story oluşturma flow
- [ ] Story görüntüleme flow
- [ ] Tepki ekleme flow

### 6.4 E2E Tests
- [ ] Full story creation flow
- [ ] Story viewing flow
- [ ] Story expiration

**Status:** [ ] Pending

---

## 📊 İlerleme Özeti

| Phase   | Açıklama          | Durum     |
| ------- | ----------------- | --------- |
| Phase 1 | Database Schema   | ⏳ Pending |
| Phase 2 | Edge Functions    | ⏳ Pending |
| Phase 3 | Mobile Components | ⏳ Pending |
| Phase 4 | Hooks & State     | ⏳ Pending |
| Phase 5 | Notifications     | ⏳ Pending |
| Phase 6 | Testing           | ⏳ Pending |

---

## 🚀 Başlangıç Sırası

1. **Database Migration** - Tabloları oluştur
2. **Edge Functions** - API'leri deploy et
3. **useCreateStory** - StoryCreator'ı bağla
4. **StoriesRow** - Feed'e ekle
5. **StoryViewer** - Görüntüleme ekranı
6. **Notifications** - Bildirim entegrasyonu
7. **Testing** - Test coverage

---

## 📝 Notlar

- Storage bucket `stories` zaten mevcut
- VisionCamera ile çekim altyapısı hazır
- 24 saat expiration için cron job gerekli
- Highlight sistemi Phase 2'de eklenecek
