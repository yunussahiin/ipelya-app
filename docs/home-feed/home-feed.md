# İpelya Home Feed Tasarım Dokümanı

Bu doküman, React Native + Expo kullanılarak geliştirilecek **İpelya Anasayfa / Feed** ekranının kapsamlı ürün ve teknik tasarımını içerir. Bu, LLM'nin doğrudan geliştirmeye başlayabilmesi için net, eksiksiz ve teknik olarak uygulanabilir bir tanımdır.

---

## 🎯 Amaç

Hem **Instagram** hem de **X (Twitter)** tarzı etkileşimli, akış temelli bir anasayfa oluşturmak. Kullanıcılar uygulamaya giriş yaptığında:

* Kullanıcı gönderilerini,
* Yeni katılan profilleri,
* Önerilen eşleşmeleri,
* Etkileşim sorularını,
* Algoritmik içerikleri
  tek bir akışta görebilecekler.

Bu akış, tamamen dinamik ve infinite scroll olacak.

---

## 🧩 Ana Yapı

Feed 4 ana içerik tipinden oluşur:

### 1. **User Posts (Gönderi Kartları)**

Instagram tarzı görsel + açıklama + etkileşim bileşenleri.

**Alanlar:**

* Kullanıcı adı + yaş + doğrulama badge
* Konum (örn: Beşiktaş, İstanbul)
* Fotoğraf (tek veya çoklu - opsiyonel)
* Açıklama metni (caption)
* Etiketler (ilgi alanları)
* Etkileşim: Like, Comment, Share
* Bağlantı/İlgi butonu: "Tanışmak İstiyorum"

### 2. **Moments / Mini Content (X tarzı küçük içerikler)**

Daha kısa metin, soru, düşünce veya statü güncellemesi.

**Alanlar:**

* Kullanıcı avatar
* Kısa metin (140–280 karakter)
* Emoji destekli
* Basit etkileşim butonları (like + reply)

### 3. **Suggested Profiles (Önerilen Profiller)**

Swipe değil; feed içinde yatay scroll.

**Alanlar:**

* Profil foto
* Ad + yaş
* Ortak ilgi alanı sayısı
* "Profili Aç" CTA

### 4. **Interactive Blocks (Etkileşim Kartları)**

Instagram Reels promosyonu veya TikTok keşfet gibi küçük modüller.
Örnek:

* “Bugün hangi enerjiye sahipsin?”, hızlı anket.
* “Yakınında 4 etkinlik var” promosyon kartı.

---

## 🧱 UI Bileşen Hiyerarşisi

```
<FeedScreen>
  <Header />
  <FlatList>
    [
      PostCard,
      MiniPostCard,
      SuggestionsRow,
      PollCard,
      PostCard,
      ...
    ]
  </FlatList>
  <BottomNav />
</FeedScreen>
```

---

## 🧭 Navigation / Header Yapısı

### Header (Üst Bar)

* Sol: Logo (İpelya)
* Orta: "Keşfet"
* Sağ: Notification Bell + Messages Icon

### Bottom Navigation

* Home
* Matches
* New Post (+)
* Messages
* Profile

---

## 🔄 Feed İşleyiş Mantığı (Algorithmic Logic)

Feed, backend tarafından aşağıdaki sırayla karışık halde gelir:

1. **Kişiye özel önerilen gönderiler** (ilgi alanı + konum + davranış)
2. **Yakın çevreden gönderiler**
3. **Yeni katılan kullanıcılar (suggestions)**
4. **Trend olan kısa paylaşımlar**
5. **Etkileşim kartları / anketler**

Her içerik `type` alanıyla birlikte gelir.

---

## 📦 API Örnek Veri Modeli

```json
{
  "id": "post_123",
  "type": "post", // post | mini | suggestions | poll
  "user": {
    "id": "u1",
    "name": "Elif",
    "age": 25,
    "verified": true,
    "avatar": "https://..."
  },
  "content": {
    "text": "Bugün sahilde yürüyüş yaptım 🌊",
    "images": ["https://..."]
  },
  "location": "Kadıköy, İstanbul",
  "interests": ["Doğa", "Kitap", "Müzik"],
  "stats": {
    "likes": 120,
    "comments": 14
  }
}
```

---

## 🎨 Tasarım Prensipleri

### Genel Stil

* Minimal, temiz, beyaz ağırlıklı
* Hafif gölgeli kart yapıları
* Marka renkleri pastel + doğal tonlar
* Typography Apple/Google Human Interface prensiplerine uygun

### Post Card Layout

* Kenarlar 12–16 radius
* Fotoğraf üstte tam genişlik
* Metin alt kısımda 14–16px
* Etkileşim ikonları Apple social apps stilinde

### Mini Card Layout

* Sadece avatar + kısa metin
* Twitter benzeri, sade ve hafif

### Suggestions Row Layout

* Yatay kaydırmalı (horizontal ScrollView)
* Her profil 100–120px genişlik
* Minimal bilgiler

---

## ⚙️ Teknik Ayrıntılar

### React Native + Expo

Kullanılacak ana bileşenler:

* `FlatList` → infinite scroll
* `Image` → gönderi fotoğrafları
* `Expo Image (FastImage alternative)` → performans için
* `Pressable` → etkileşimler
* `expo-router` veya `react-navigation` → screen geçişleri
* Zustand veya Redux Toolkit → feed state yönetimi

### Performans İçin Gerekenler

* Lazy loading
* Image cache
* Skeleton loading
* Pagination (cursor-based)
* Memoized komponentler

---

## 🧪 Ek Özellikler (Opsiyonel)

* Story halkası feed üstünde
* Reels benzeri kısa video alanı
* AI tabanlı içerik önerme
* Kullanıcı içerik güvenlik skoru
* Shadowban / quality rank sistemi

---

## ✉️ DM, Paylaşma ve Mention Özellikleri (Geliştirilmiş)

### Mention Sistemi (@kullanıcı)

* Gönderilerde, mini postlarda ve yorumlarda `@username` mention yapılabilir.
* Mention edilen kullanıcıya anında bildirim gider.
* Mention popup: Yazarken kullanıcı listesi autocomplete olarak çıkar.
* Backend: `mentions: [userId, ...]` şeklinde gönderi meta verisine eklenir.
* Mention’lı gönderiler Explore’da daha yüksek görünürlük alabilir.

### Gönderiyi DM ile Paylaşma

* Her gönderi kartının altında “DM ile Gönder” butonu.
* Basınca kullanıcı listesi açılır.
* Gönderi önizleme olarak sohbet ekranına düşer.
* Gönderi türüne göre farklı preview formatları:

  * Post → foto + caption
  * Mini → kısa metin balonu
  * Poll → anket kartı + oy seçenekleri

### Gönderiyi Profil Dışına Paylaşma (Cross-share)

* Uygulama içinde link oluşturma (dinamik link).
* Uygulama içi embed (Instagram’da olduğu gibi yatay küçük kart).

---

## 🌟 İpelya’ya Özel Benzersiz Yeni Özellikler

### 🔮 1. "Vibe Match Feed™" (AI Destekli Enerji Eşleştirme)

Feed, sadece kronolojik değil, kullanıcının o anki ruh haline göre yeniden şekillenir.

* Kullanıcı 5 saniyelik bir hızlı test yapar: “Bugün nasıl hissediyorsun?”
* AI, feed’i bu moda göre filtreler:

  * Enerjik → Outdoor, aktif kullanıcılar
  * Chill → kitap, kahve, sakin paylaşımlar
  * Sosyal → etkinlik, buluşma önerileri
* Bu özellik tamamen benzersizdir ve rakiplerde yok.

### 🔥 2. "Instant Chemistry" (Gönderi Üzerinden Eşleşme)

Bir kullanıcı gönderide sana hitap eden bir şey paylaşmışsa:

* Gönderinin altında özel bir buton görünür: **“Bu paylaşım üzerinden tanış”**
* Basınca:

  * Gönderiye özel bir DM thread başlar.
  * İlk mesaj otomatik olarak gönderi preview içerir.
  * Bu özellik doğal bir tanışma sebebi yaratır.

### 🎭 3. "Anon Mode Share" (Gizli Düşünceler Modu)

Kullanıcılar bazı kısa metin paylaşımlarını anonim atabilir.

* Mini post türleri için geçerli.
* Profil bilgisi yerine “Anon” görünür.
* Ama sadece yakın çevredeki şehirlerde görünür.
* Amacı: insanların duygularını, düşüncelerini açıkça söylemesine alan sağlamak.

### 👥 4. "Micro-Groups" (İlgi Alanı Odaklı Mini Topluluklar)

Feed içinde yer alan özel bloklarda:

* “Kitap Sevenler İçin Yeni Bir Grup Açıldı → Katıl”
* “Bugün Runners Club 16 kişi aktif”
* Bu gruplar chat + feed + etkinlik bileşimi içerir.

### 🎥 5. "Moment Reactions" (Video ile Tepki Verme)

Kullanıcılar gönderilere video reaction bırakabilir.

* 2 saniyelik mikro video
* Gönderi sahibine özel görünür
* Çok samimi ve modern bir etkileşim tipi

### 🎯 6. "Smart Share" (AI Önerili Paylaşım Destekçisi)

Kullanıcı gönderi paylaşırken yapay zeka öneride bulunur:

* Fotoğraftan duyguyu okur → caption önerir
* Hashtag önerir
* Gönderiyi daha iyi göstermesi için filtre seçer

### ⏰ 7. "Time Capsules" (Anlık Gönderiler, 24 Saat Sonra Kaybolan)

* Instagram story değil, feed içinde yer alan geçici gönderi
* Kartın köşesinde geri sayım
* Tanışmak isteyenler 24 saat içinde DM atabilir

---

## 🏛️ Gelişmiş Teknik Gereksinimler

### Mentions

* Regex ile `@username` yakalama
* Backend:

  * Mention indexleri
  * Notification trigger
* Autocomplete:

  * `onChangeText` → suggestion list

### Share to DM

* Deep linking: `ipelya://post/{postId}`
* Message payload:

  ```json
  {
    "type": "shared_post",
    "postId": "123",
    "sharedAt": "2025-02-02"
  }
  ```

### Vibe Match Feed Engine

* Frontend: `vibeMode` state
* Backend: `vibeScore` parametreli feed endpoint
* AI: mood classification

### Time Capsules

* Feed API’de `expiresAt` alanı
* Client’ta countdown timer

---

## 🗺️ Home Feed Yapı Şeması (Markdown Formatında)

Aşağıda İpelya Home Feed ekranının **tam mimari şeması**, tüm bileşen ilişkileri ve veri akışıyla birlikte markdown formatında açıklanmıştır.

---

# 🧩 İpelya Feed Mimarisi — Markdown Şema

```markdown
İpelyaFeed
├── Header
│   ├── Logo
│   ├── SearchButton
│   ├── NotificationsIcon
│   └── MessagesIcon
│
├── StoryRingSection (Opsiyonel)
│   ├── UserStoryBubble (current user)
│   ├── FriendStoryBubble
│   └── ...
│
├── FeedFlatList
│   ├── FeedItem(type="post")
│   │   ├── PostCard
│   │   │   ├── PostHeader
│   │   │   │   ├── Avatar
│   │   │   │   ├── Name + Age + VerifiedBadge
│   │   │   │   └── Location
│   │   │   ├── PostMedia
│   │   │   ├── PostCaption
│   │   │   │   └── #Tags + @Mentions
│   │   │   ├── PostActions
│   │   │   │   ├── LikeButton
│   │   │   │   ├── CommentButton
│   │   │   │   ├── ShareMenu
│   │   │   │   │   ├── ShareToDM
│   │   │   │   │   └── ShareToExternal
│   │   │   │   └── ConnectButton (Instant Chemistry)
│   │   │   └── CommentPreview
│   │
│   ├── FeedItem(type="mini_post")
│   │   ├── MiniPostCard
│   │   │   ├── Avatar
│   │   │   ├── Text(140–280 chars)
│   │   │   ├── EmojiSupport
│   │   │   └── Actions (Like, Reply)
│   │
│   ├── FeedItem(type="suggestions")
│   │   ├── SuggestionsRow
│   │   │   ├── ProfileCardHorizontal
│   │   │   ├── ProfileCardHorizontal
│   │   │   └── ...
│   │
│   ├── FeedItem(type="poll")
│   │   ├── PollCard
│   │   │   ├── Question
│   │   │   ├── Option A
│   │   │   ├── Option B
│   │   │   └── VoteCTA
│   │
│   ├── FeedItem(type="vibe_match_block")
│   │   ├── VibeBlock
│   │   │   ├── DailyMoodSelector
│   │   │   └── VibeBasedRecommendations
│   │
│   ├── FeedItem(type="time_capsule")
│   │   ├── TimeCapsuleCard
│   │   │   ├── Media
│   │   │   ├── Caption
│   │   │   └── CountdownBadge
│   │
│   └── ... infinite scroll
│
└── BottomNavigation
    ├── Home
    ├── Matches
    ├── Create (+)
    ├── Messages
    └── Profile
```

---

# 📡 Veri Akış Şeması

```markdown
Client (FeedScreen)
│
├─ GET /feed?cursor=xyz
│   ├─ type: post
│   ├─ type: mini_post
│   ├─ type: suggestions
│   ├─ type: poll
│   ├─ type: time_capsule
│   └─ type: vibe_match_block
│
└─ Render → FlatList → ConditionalRenderer(type)
```

---

# 🔄 Mention Sistemi Şeması

```markdown
UserTyping
│
└── Detect @ → AutocompleteQuery
    │
    ├── GET /search/users?q=...
    │
    └── DisplayMentionPopup
        │
        └── InsertSelectedMention (@username)
```

---

# ✉️ DM ile Paylaşma Şeması

```markdown
PostCard
│
└── ShareButton
    │
    ├── OpenUserListModal
    │   ├── GET /user/list
    │   └── SelectUser
    │
    └── POST /messages
        └── type: shared_post
```

---

# 💫 Instant Chemistry Şeması

```markdown
PostCard
│
└── ConnectButton
    │
    └── StartChatWithContext
        ├── POST /chat/start
        └── payload: { postId }
```

---

## 🏁 Sonuç

Bu doküman, LLM’nin React Native Expo ile doğrudan kodlamaya başlayabileceği şekilde İpelya'nın feed/anasayfa ekranını **tam kapsamlı** olarak tanımlar. Eğer istersen:

* Bu dokümana göre **UI komponent kodlarını** oluşturabilirim.
* Tam bir **frontend mimari yapısı** çıkarabilirim.
* Veya **backend API şemasını** da ekleyebilirim.

Hazır olduğunda bir sonraki adımı söylemen yeterli.
