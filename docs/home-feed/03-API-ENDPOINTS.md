# İpelya Home Feed - API Endpoints

## 📡 Genel Bakış

Bu döküman, İpelya Home Feed sisteminin tüm API endpoint'lerini, request/response formatlarını ve kullanım örneklerini içerir.

**Base URL:** `https://[project-ref].supabase.co/functions/v1`

---

## 🔐 Authentication

Tüm endpoint'ler Supabase Auth token gerektirir.

**Header:**
```
Authorization: Bearer <access_token>
```

---

## 📱 Feed Endpoints

### GET /feed

Ana feed'i getirir (algorithmic).

**Query Parameters:**
- `cursor` (string, optional) - Pagination cursor
- `limit` (number, optional, default: 20) - Items per page
- `vibe` (string, optional) - Filter by vibe (energetic, chill, social, creative, adventurous)
- `intent` (string, optional) - Filter by intent (meet_new, activity_partner, flirt, serious_relationship)
- `content_types` (string[], optional) - Filter by content types

**Request:**
```typescript
GET /feed?cursor=post_123&limit=20&vibe=energetic&intent=activity_partner
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "feed_item_123",
        "content_type": "post",
        "content": {
          "id": "post_123",
          "user": {
            "id": "user_456",
            "name": "Elif",
            "age": 25,
            "avatar": "https://...",
            "verified": true
          },
          "caption": "Bugün sahilde yürüyüş yaptım 🌊",
          "media": [
            {
              "type": "image",
              "url": "https://...",
              "width": 1080,
              "height": 1350
            }
          ],
          "location": "Kadıköy, İstanbul",
          "interests": ["Doğa", "Kitap", "Müzik"],
          "stats": {
            "likes": 120,
            "comments": 14,
            "shares": 3,
            "views": 450
          },
          "is_liked": false,
          "created_at": "2025-11-24T10:30:00Z"
        },
        "relevance_score": 0.95,
        "vibe_match_score": 0.88,
        "intent_match_score": 0.75
      },
      {
        "id": "feed_item_124",
        "content_type": "mini_post",
        "content": {
          "id": "mini_123",
          "user": {
            "id": "user_789",
            "name": "Anon",
            "is_anon": true
          },
          "content": "Bugün harika bir gün! ☀️",
          "stats": {
            "likes": 45,
            "replies": 8
          },
          "is_liked": false,
          "created_at": "2025-11-24T11:00:00Z"
        },
        "relevance_score": 0.82
      },
      {
        "id": "feed_item_125",
        "content_type": "suggestions",
        "content": {
          "profiles": [
            {
              "id": "user_321",
              "name": "Ahmet",
              "age": 28,
              "avatar": "https://...",
              "common_interests": 5,
              "distance": "2.3 km",
              "vibe_match": 0.92
            }
          ]
        }
      },
      {
        "id": "feed_item_126",
        "content_type": "poll",
        "content": {
          "id": "poll_456",
          "user": {
            "id": "user_654",
            "name": "Zeynep",
            "age": 24,
            "avatar": "https://..."
          },
          "question": "Bugün hangi enerjiye sahipsin?",
          "options": [
            {
              "id": "opt_1",
              "text": "Enerjik",
              "votes": 120,
              "percentage": 45
            },
            {
              "id": "opt_2",
              "text": "Sakin",
              "votes": 80,
              "percentage": 30
            },
            {
              "id": "opt_3",
              "text": "Sosyal",
              "votes": 67,
              "percentage": 25
            }
          ],
          "total_votes": 267,
          "has_voted": false,
          "expires_at": "2025-11-25T10:30:00Z"
        }
      }
    ],
    "next_cursor": "post_456",
    "has_more": true
  }
}
```

---

### GET /feed/trending

Trend olan içerikleri getirir.

**Query Parameters:**
- `limit` (number, optional, default: 20)
- `time_range` (string, optional, default: "24h") - 1h, 6h, 24h, 7d

**Response:**
```typescript
{
  "success": true,
  "data": {
    "items": [...], // Same format as /feed
    "trending_score": 0.95
  }
}
```

---

### GET /feed/following

Takip edilen kullanıcıların içerikleri.

**Query Parameters:**
- `cursor` (string, optional)
- `limit` (number, optional, default: 20)

**Response:** Same format as `/feed`

---

## 📝 Post Endpoints

### POST /posts

Yeni post oluşturur.

**Request Body:**
```typescript
{
  "caption": "Bugün harika bir gün! 🌟",
  "location": "Kadıköy, İstanbul",
  "media": [
    {
      "type": "image",
      "url": "https://...", // Pre-uploaded to Supabase Storage
      "width": 1080,
      "height": 1350
    }
  ],
  "visibility": "public", // public, friends, private
  "post_type": "standard", // standard, time_capsule, anon
  "expires_at": "2025-11-25T10:30:00Z", // For time_capsule
  "mentions": ["user_123", "user_456"]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "post_789",
    "user_id": "user_123",
    "caption": "Bugün harika bir gün! 🌟",
    "location": "Kadıköy, İstanbul",
    "media": [...],
    "visibility": "public",
    "post_type": "standard",
    "stats": {
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "views": 0
    },
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

### GET /posts/:id

Post detaylarını getirir.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "post_123",
    "user": {...},
    "caption": "...",
    "media": [...],
    "location": "...",
    "interests": [...],
    "stats": {...},
    "is_liked": false,
    "is_bookmarked": false,
    "created_at": "...",
    "comments": [
      {
        "id": "comment_123",
        "user": {...},
        "content": "Harika görünüyor!",
        "likes_count": 5,
        "is_liked": false,
        "replies": [
          {
            "id": "comment_456",
            "user": {...},
            "content": "Teşekkürler!",
            "likes_count": 2,
            "is_liked": false,
            "created_at": "..."
          }
        ],
        "created_at": "..."
      }
    ]
  }
}
```

---

### PUT /posts/:id

Post'u günceller.

**Request Body:**
```typescript
{
  "caption": "Güncellenmiş açıklama",
  "location": "Yeni konum"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "post_123",
    "caption": "Güncellenmiş açıklama",
    "updated_at": "2025-11-24T12:30:00Z"
  }
}
```

---

### DELETE /posts/:id

Post'u siler.

**Response:**
```typescript
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 💬 Mini Post Endpoints

### POST /mini-posts

Kısa metin paylaşımı oluşturur.

**Request Body:**
```typescript
{
  "content": "Bugün harika bir gün! ☀️",
  "is_anon": false,
  "mentions": ["user_123"]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "mini_123",
    "user_id": "user_456",
    "content": "Bugün harika bir gün! ☀️",
    "is_anon": false,
    "stats": {
      "likes": 0,
      "replies": 0
    },
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

## 🎙️ Voice Moment Endpoints

### POST /voice-moments

Ses paylaşımı oluşturur.

**Request Body:**
```typescript
{
  "audio_url": "https://...", // Pre-uploaded to Supabase Storage
  "duration": 15, // seconds
  "waveform_data": [...], // Array of amplitude values
  "caption": "Bugünkü düşüncelerim"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "voice_123",
    "user_id": "user_456",
    "audio_url": "https://...",
    "duration": 15,
    "waveform_data": [...],
    "caption": "Bugünkü düşüncelerim",
    "stats": {
      "likes": 0,
      "replies": 0,
      "plays": 0
    },
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

## 📊 Poll Endpoints

### POST /polls

Anket oluşturur.

**Request Body:**
```typescript
{
  "question": "Bugün hangi enerjiye sahipsin?",
  "options": [
    "Enerjik",
    "Sakin",
    "Sosyal"
  ],
  "multiple_choice": false,
  "expires_at": "2025-11-25T10:30:00Z"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "poll_456",
    "user_id": "user_123",
    "question": "Bugün hangi enerjiye sahipsin?",
    "options": [
      {
        "id": "opt_1",
        "text": "Enerjik",
        "votes": 0,
        "percentage": 0
      },
      {
        "id": "opt_2",
        "text": "Sakin",
        "votes": 0,
        "percentage": 0
      },
      {
        "id": "opt_3",
        "text": "Sosyal",
        "votes": 0,
        "percentage": 0
      }
    ],
    "total_votes": 0,
    "multiple_choice": false,
    "expires_at": "2025-11-25T10:30:00Z",
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

### POST /polls/:id/vote

Ankete oy verir.

**Request Body:**
```typescript
{
  "option_ids": ["opt_1"] // Array for multiple choice
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "poll_id": "poll_456",
    "voted_options": ["opt_1"],
    "updated_results": {
      "options": [
        {
          "id": "opt_1",
          "text": "Enerjik",
          "votes": 121,
          "percentage": 46
        },
        {
          "id": "opt_2",
          "text": "Sakin",
          "votes": 80,
          "percentage": 30
        },
        {
          "id": "opt_3",
          "text": "Sosyal",
          "votes": 67,
          "percentage": 24
        }
      ],
      "total_votes": 268
    }
  }
}
```

---

## ❤️ Interaction Endpoints

### POST /posts/:id/like

Post'u beğenir.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "post_id": "post_123",
    "likes_count": 121,
    "is_liked": true
  }
}
```

---

### DELETE /posts/:id/like

Post beğenisini kaldırır.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "post_id": "post_123",
    "likes_count": 120,
    "is_liked": false
  }
}
```

---

### POST /posts/:id/comment

Post'a yorum yapar.

**Request Body:**
```typescript
{
  "content": "Harika görünüyor!",
  "parent_comment_id": "comment_456" // Optional, for replies
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "comment_789",
    "post_id": "post_123",
    "user_id": "user_456",
    "content": "Harika görünüyor!",
    "parent_comment_id": null,
    "likes_count": 0,
    "replies_count": 0,
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

### POST /posts/:id/share

Post'u paylaşır.

**Request Body:**
```typescript
{
  "share_type": "dm", // dm, external, story
  "recipient_id": "user_789" // For DM shares
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "share_123",
    "post_id": "post_123",
    "share_type": "dm",
    "recipient_id": "user_789",
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

## 🔍 Search & Discovery Endpoints

### GET /search/mentions

Mention autocomplete için kullanıcı arar.

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (number, optional, default: 10)

**Request:**
```typescript
GET /search/mentions?q=eli&limit=10
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "username": "elif_25",
        "name": "Elif",
        "avatar": "https://...",
        "verified": true
      },
      {
        "id": "user_456",
        "username": "elifnur",
        "name": "Elif Nur",
        "avatar": "https://...",
        "verified": false
      }
    ]
  }
}
```

---

### GET /suggestions

Profil önerileri getirir.

**Query Parameters:**
- `limit` (number, optional, default: 10)
- `vibe` (string, optional)
- `intent` (string, optional)

**Response:**
```typescript
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "user_321",
        "name": "Ahmet",
        "age": 28,
        "avatar": "https://...",
        "bio": "Kitap ve müzik seviyorum",
        "common_interests": 5,
        "distance": "2.3 km",
        "vibe_match": 0.92,
        "intent_match": 0.85,
        "social_graph_score": 0.78
      }
    ]
  }
}
```

---

## 🎯 User Preference Endpoints

### POST /vibes

Kullanıcı mood'unu günceller.

**Request Body:**
```typescript
{
  "vibe_type": "energetic", // energetic, chill, social, creative, adventurous
  "intensity": 4 // 1-5
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "vibe_123",
    "user_id": "user_456",
    "vibe_type": "energetic",
    "intensity": 4,
    "created_at": "2025-11-24T12:00:00Z",
    "expires_at": "2025-11-25T12:00:00Z"
  }
}
```

---

### GET /vibes/current

Mevcut mood'u getirir.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "vibe_type": "energetic",
    "intensity": 4,
    "expires_at": "2025-11-25T12:00:00Z"
  }
}
```

---

### POST /intents

Dating intent'i günceller.

**Request Body:**
```typescript
{
  "intents": [
    {
      "intent_type": "activity_partner",
      "priority": 5
    },
    {
      "intent_type": "meet_new",
      "priority": 3
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "intents": [
      {
        "id": "intent_123",
        "intent_type": "activity_partner",
        "priority": 5
      },
      {
        "id": "intent_456",
        "intent_type": "meet_new",
        "priority": 3
      }
    ]
  }
}
```

---

## 🎁 Crystal Gift Endpoints

### POST /crystal-gifts

Dijital hediye gönderir.

**Request Body:**
```typescript
{
  "recipient_id": "user_789",
  "gift_type": "energy_crystal", // energy_crystal, coffee, motivation_card, flower, star
  "message": "Harika bir gün geçirmen dileğiyle! ✨"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "gift_123",
    "sender_id": "user_456",
    "recipient_id": "user_789",
    "gift_type": "energy_crystal",
    "message": "Harika bir gün geçirmen dileğiyle! ✨",
    "is_opened": false,
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

### GET /crystal-gifts/received

Alınan hediyeleri getirir.

**Query Parameters:**
- `is_opened` (boolean, optional)

**Response:**
```typescript
{
  "success": true,
  "data": {
    "gifts": [
      {
        "id": "gift_123",
        "sender": {
          "id": "user_456",
          "name": "Elif",
          "avatar": "https://..."
        },
        "gift_type": "energy_crystal",
        "message": "Harika bir gün geçirmen dileğiyle! ✨",
        "is_opened": false,
        "created_at": "2025-11-24T12:00:00Z"
      }
    ]
  }
}
```

---

### POST /crystal-gifts/:id/open

Hediyeyi açar.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "gift_123",
    "is_opened": true,
    "opened_at": "2025-11-24T13:00:00Z"
  }
}
```

---

## 💬 Instant Chemistry Endpoints

### POST /instant-chemistry

Post üzerinden chat başlatır.

**Request Body:**
```typescript
{
  "post_id": "post_123",
  "message": "Harika bir paylaşım! Ben de sahilde yürüyüş yapmayı seviyorum."
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "chat_id": "chat_789",
    "post_preview": {
      "id": "post_123",
      "caption": "Bugün sahilde yürüyüş yaptım 🌊",
      "media": [...]
    },
    "message_id": "msg_456",
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

## 🌐 Social Graph Endpoints

### GET /social-graph

Kullanıcının sosyal bağlantı haritasını getirir.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "connections": [
      {
        "user": {
          "id": "user_321",
          "name": "Ahmet",
          "avatar": "https://..."
        },
        "connection_type": "friend",
        "common_interests": 5,
        "interaction_score": 0.85,
        "mutual_friends": 3
      }
    ],
    "stats": {
      "total_connections": 45,
      "friends": 20,
      "followers": 25
    }
  }
}
```

---

## 🏙️ IRL Events Endpoints

### GET /irl-events

Şehir etkinliklerini getirir.

**Query Parameters:**
- `city` (string, optional)
- `category` (string, optional) - concert, sports, meetup, etc.
- `date` (string, optional) - YYYY-MM-DD

**Response:**
```typescript
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123",
        "title": "Canlı Müzik Gecesi",
        "description": "Beyoğlu'nda canlı müzik etkinliği",
        "location": "Beyoğlu, İstanbul",
        "date": "2025-11-25T20:00:00Z",
        "category": "concert",
        "interested_users_count": 8,
        "is_interested": false
      }
    ]
  }
}
```

---

## 👥 Micro Groups Endpoints

### POST /micro-groups

Mini topluluk oluşturur.

**Request Body:**
```typescript
{
  "name": "Kitap Sevenler",
  "description": "Kitap okumayı seven insanlar için",
  "category": "books",
  "is_private": false,
  "max_members": 50
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "id": "group_123",
    "creator_id": "user_456",
    "name": "Kitap Sevenler",
    "description": "Kitap okumayı seven insanlar için",
    "category": "books",
    "is_private": false,
    "max_members": 50,
    "members_count": 1,
    "created_at": "2025-11-24T12:00:00Z"
  }
}
```

---

### POST /micro-groups/:id/join

Gruba katılır.

**Response:**
```typescript
{
  "success": true,
  "data": {
    "group_id": "group_123",
    "user_id": "user_789",
    "role": "member",
    "joined_at": "2025-11-24T12:00:00Z"
  }
}
```

---

## 🛡️ Moderation Endpoints

### POST /moderate-content

İçeriği AI ile moderate eder.

**Request Body:**
```typescript
{
  "content_type": "post", // post, mini_post, comment
  "content_id": "post_123"
}
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "content_id": "post_123",
    "moderation_status": "approved", // approved, rejected, flagged
    "toxicity_score": 0.05,
    "nsfw_score": 0.02,
    "spam_score": 0.01,
    "reasons": []
  }
}
```

---

## 📊 Analytics Endpoints

### POST /analytics/view

İçerik görüntüleme kaydeder.

**Request Body:**
```typescript
{
  "content_type": "post",
  "content_id": "post_123",
  "duration": 5.2 // seconds
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "View recorded"
}
```

---

## ⚠️ Error Responses

Tüm endpoint'ler hata durumunda aşağıdaki formatı kullanır:

```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Caption is required",
    "details": {
      "field": "caption",
      "constraint": "required"
    }
  }
}
```

**Error Codes:**
- `INVALID_REQUEST` - Geçersiz request
- `UNAUTHORIZED` - Authentication gerekli
- `FORBIDDEN` - Yetki yok
- `NOT_FOUND` - İçerik bulunamadı
- `RATE_LIMIT_EXCEEDED` - Rate limit aşıldı
- `INTERNAL_ERROR` - Server hatası

---

## 🔄 Rate Limiting

**Limits:**
- Feed endpoints: 100 req/min
- Post creation: 10 req/min
- Like/unlike: 60 req/min
- Comment: 30 req/min

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1732449600
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
