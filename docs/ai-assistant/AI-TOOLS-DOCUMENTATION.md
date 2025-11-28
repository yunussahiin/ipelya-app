# AI Assistant Tools Documentation

> Ops Admin AI Asistanı için kapsamlı tool dokümantasyonu

## 📊 Veritabanı Özeti

### Temel Tablolar ve Satır Sayıları

| Kategori         | Tablo                      | Satır | Açıklama                           |
| ---------------- | -------------------------- | ----- | ---------------------------------- |
| **Kullanıcılar** | `profiles`                 | 5     | Kullanıcı profilleri (real/shadow) |
|                  | `admin_profiles`           | 1     | Admin profilleri                   |
|                  | `follows`                  | 2     | Takip ilişkileri                   |
|                  | `blocks`                   | 0     | Engelleme kayıtları                |
|                  | `user_locks`               | 0     | Hesap kilitleme                    |
| **İçerik**       | `posts`                    | 26    | Kullanıcı postları                 |
|                  | `post_media`               | 26    | Post medyaları                     |
|                  | `post_likes`               | 3     | Post beğenileri                    |
|                  | `post_comments`            | 0     | Post yorumları                     |
|                  | `post_shares`              | 0     | Post paylaşımları                  |
|                  | `stories`                  | 0     | Hikayeler                          |
| **Mesajlaşma**   | `conversations`            | 2     | DM sohbetleri                      |
|                  | `messages`                 | 78    | DM mesajları                       |
|                  | `broadcast_channels`       | 0     | Yayın kanalları                    |
|                  | `broadcast_messages`       | 0     | Yayın mesajları                    |
| **Moderasyon**   | `content_reports`          | 0     | İçerik raporları                   |
|                  | `moderation_actions`       | 0     | Moderasyon aksiyonları             |
|                  | `anomaly_alerts`           | 0     | Anomali uyarıları                  |
| **Finans**       | `coin_transactions`        | 0     | Coin işlemleri                     |
|                  | `coin_purchases`           | 0     | Coin satın alımları                |
|                  | `ppv_purchases`            | 0     | PPV satın alımları                 |
|                  | `creator_subscriptions`    | 0     | Abonelikler                        |
| **Bildirimler**  | `notifications`            | 0     | Bildirimler                        |
|                  | `device_tokens`            | 5     | Push token'ları                    |
| **Güvenlik**     | `shadow_mode_logs`         | 0     | Shadow mode logları                |
|                  | `screenshot_logs`          | 0     | Ekran görüntüsü logları            |
|                  | `admin_impersonation_logs` | 0     | Admin taklit logları               |
| **AI**           | `ai_chat_threads`          | 0     | AI sohbet thread'leri              |
|                  | `ai_chat_logs`             | 0     | AI sohbet logları                  |
|                  | `ai_settings`              | 0     | AI ayarları                        |

---

## 🛠️ Mevcut Tool'lar

### 1. lookupUser
Tek bir kullanıcının detaylı bilgilerini getirir.

```typescript
inputSchema: {
  identifier: string,      // User ID, email veya username
  identifierType: 'id' | 'email' | 'username'
}
```

**Dönen Bilgiler:**
- Profil bilgileri (username, display_name, bio, avatar)
- Hesap durumu (is_active, is_verified, is_creator)
- İstatistikler (followers, following, posts)
- Son aktivite

---

### 2. searchUsers
Kullanıcıları arar veya listeler.

```typescript
inputSchema: {
  query?: string,          // Arama terimi (opsiyonel)
  limit: number,           // Max 50
  role: 'all' | 'user' | 'creator' | 'admin'
}
```

**Dönen Bilgiler:**
- Kullanıcı listesi (id, username, email, role)
- Hesap durumu
- Kayıt ve son giriş tarihi

---

### 3. getSystemStats
Platform istatistiklerini getirir.

```typescript
inputSchema: {
  period: 'today' | 'week' | 'month' | 'all'
}
```

**Dönen Bilgiler:**
- Kullanıcı sayıları (total, active, new, creators)
- İçerik sayıları (posts, comments, messages)
- Moderasyon kuyruğu

---

### 4. getRecentPosts
Son postları getirir.

```typescript
inputSchema: {
  limit: number,           // Max 50
  userId?: string,         // Belirli kullanıcının postları
  contentType?: 'all' | 'image' | 'video' | 'text'
}
```

---

### 5. getModerationQueue
Moderasyon kuyruğunu getirir.

```typescript
inputSchema: {
  status: 'pending' | 'approved' | 'rejected' | 'all',
  limit: number,
  reason?: string
}
```

---

### 6. getPostDetails
Belirli bir postun detaylarını getirir.

```typescript
inputSchema: {
  postId: string
}
```

---

## 🆕 Önerilen Yeni Tool'lar

### Kullanıcı Yönetimi

#### 7. getUserActivity
Kullanıcının aktivite geçmişini getirir.

```typescript
inputSchema: {
  userId: string,
  activityType?: 'all' | 'posts' | 'comments' | 'likes' | 'messages' | 'logins',
  limit: number,
  period: 'today' | 'week' | 'month' | 'all'
}
```

**Dönen Bilgiler:**
- Aktivite listesi (tarih, tip, detay)
- Aktivite özeti (toplam post, yorum, beğeni)
- Login geçmişi

---

#### 8. getUserFollowers
Kullanıcının takipçilerini getirir.

```typescript
inputSchema: {
  userId: string,
  limit: number,
  offset: number
}
```

---

#### 9. getUserFollowing
Kullanıcının takip ettiklerini getirir.

```typescript
inputSchema: {
  userId: string,
  limit: number,
  offset: number
}
```

---

#### 10. banUser
Kullanıcıyı banlar.

```typescript
inputSchema: {
  userId: string,
  reason: string,
  duration?: 'permanent' | '1d' | '7d' | '30d',
  notifyUser: boolean
}
```

---

#### 11. unbanUser
Kullanıcının banını kaldırır.

```typescript
inputSchema: {
  userId: string,
  reason: string
}
```

---

#### 12. lockUser
Kullanıcı hesabını kilitler.

```typescript
inputSchema: {
  userId: string,
  reason: string,
  duration?: string  // ISO duration veya 'permanent'
}
```

---

#### 13. unlockUser
Kullanıcı hesabının kilidini açar.

```typescript
inputSchema: {
  userId: string,
  reason: string
}
```

---

### İçerik Yönetimi

#### 14. getPostAnalytics
Post performans metriklerini getirir.

```typescript
inputSchema: {
  postId: string
}
```

**Dönen Bilgiler:**
- Görüntülenme sayısı
- Beğeni, yorum, paylaşım sayıları
- Engagement rate
- Görüntülenme kaynakları (feed, profil, arama)

---

#### 15. hidePost
Postu gizler.

```typescript
inputSchema: {
  postId: string,
  reason: string
}
```

---

#### 16. unhidePost
Postun gizliliğini kaldırır.

```typescript
inputSchema: {
  postId: string,
  reason: string
}
```

---

#### 17. deletePost
Postu siler.

```typescript
inputSchema: {
  postId: string,
  reason: string,
  notifyUser: boolean
}
```

---

#### 18. approvePost
Postu onaylar (moderasyon).

```typescript
inputSchema: {
  postId: string,
  notes?: string
}
```

---

#### 19. rejectPost
Postu reddeder (moderasyon).

```typescript
inputSchema: {
  postId: string,
  reason: string,
  notifyUser: boolean
}
```

---

### Mesajlaşma

#### 20. getConversations
Sohbetleri listeler.

```typescript
inputSchema: {
  userId?: string,         // Belirli kullanıcının sohbetleri
  limit: number,
  includeMessages: boolean
}
```

---

#### 21. getMessages
Sohbet mesajlarını getirir.

```typescript
inputSchema: {
  conversationId: string,
  limit: number,
  before?: string          // Cursor for pagination
}
```

---

#### 22. deleteMessage
Mesajı siler (admin).

```typescript
inputSchema: {
  messageId: string,
  reason: string
}
```

---

### Finansal

#### 23. getUserTransactions
Kullanıcının coin işlemlerini getirir.

```typescript
inputSchema: {
  userId: string,
  transactionType?: 'all' | 'purchase' | 'spend' | 'earn' | 'refund',
  limit: number,
  period: 'today' | 'week' | 'month' | 'all'
}
```

---

#### 24. getUserBalance
Kullanıcının coin bakiyesini getirir.

```typescript
inputSchema: {
  userId: string
}
```

**Dönen Bilgiler:**
- Mevcut bakiye
- Toplam harcama
- Toplam kazanç
- Son işlemler

---

#### 25. refundTransaction
İşlemi iade eder.

```typescript
inputSchema: {
  transactionId: string,
  reason: string,
  amount?: number          // Kısmi iade için
}
```

---

#### 26. getRevenueStats
Gelir istatistiklerini getirir.

```typescript
inputSchema: {
  period: 'today' | 'week' | 'month' | 'year' | 'all',
  groupBy?: 'day' | 'week' | 'month'
}
```

**Dönen Bilgiler:**
- Toplam gelir
- Coin satışları
- PPV satışları
- Abonelik gelirleri
- Trend grafik verileri

---

### Bildirimler

#### 27. sendNotification
Kullanıcıya bildirim gönderir.

```typescript
inputSchema: {
  userId: string,
  title: string,
  body: string,
  type: 'system' | 'warning' | 'info' | 'promotion',
  data?: object
}
```

---

#### 28. sendBulkNotification
Toplu bildirim gönderir.

```typescript
inputSchema: {
  userIds?: string[],      // Belirli kullanıcılar
  role?: 'all' | 'user' | 'creator',
  title: string,
  body: string,
  type: 'system' | 'warning' | 'info' | 'promotion'
}
```

---

### Güvenlik & Audit

#### 29. getSecurityLogs
Güvenlik loglarını getirir.

```typescript
inputSchema: {
  userId?: string,
  logType?: 'all' | 'login' | 'password_change' | 'shadow_mode' | 'screenshot',
  limit: number,
  period: 'today' | 'week' | 'month'
}
```

---

#### 30. getAnomalyAlerts
Anomali uyarılarını getirir.

```typescript
inputSchema: {
  severity?: 'all' | 'critical' | 'high' | 'medium' | 'low',
  status?: 'all' | 'open' | 'resolved',
  limit: number
}
```

---

#### 31. resolveAnomalyAlert
Anomali uyarısını çözümler.

```typescript
inputSchema: {
  alertId: string,
  resolution: string,
  notes?: string
}
```

---

### Raporlar & Moderasyon

#### 32. getContentReports
İçerik raporlarını getirir.

```typescript
inputSchema: {
  status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed',
  reportType?: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other',
  limit: number
}
```

---

#### 33. reviewReport
Raporu inceler ve aksiyon alır.

```typescript
inputSchema: {
  reportId: string,
  action: 'dismiss' | 'warn_user' | 'hide_content' | 'delete_content' | 'ban_user',
  notes: string
}
```

---

### Creator Yönetimi

#### 34. getCreatorStats
Creator istatistiklerini getirir.

```typescript
inputSchema: {
  creatorId: string,
  period: 'today' | 'week' | 'month' | 'all'
}
```

**Dönen Bilgiler:**
- Abone sayısı
- Toplam kazanç
- Post performansları
- Engagement metrikleri

---

#### 35. getCreatorSubscribers
Creator'ın abonelerini getirir.

```typescript
inputSchema: {
  creatorId: string,
  tierFilter?: string,
  limit: number
}
```

---

#### 36. verifyCreator
Creator'ı doğrular.

```typescript
inputSchema: {
  userId: string,
  verificationNotes?: string
}
```

---

#### 37. unverifyCreator
Creator doğrulamasını kaldırır.

```typescript
inputSchema: {
  userId: string,
  reason: string
}
```

---

### Broadcast Kanalları

#### 38. getBroadcastChannels
Yayın kanallarını listeler.

```typescript
inputSchema: {
  creatorId?: string,
  status?: 'active' | 'archived',
  limit: number
}
```

---

#### 39. getBroadcastMessages
Yayın mesajlarını getirir.

```typescript
inputSchema: {
  channelId: string,
  limit: number
}
```

---

### Sistem

#### 40. getSystemHealth
Sistem sağlık durumunu getirir.

```typescript
inputSchema: {}
```

**Dönen Bilgiler:**
- Database bağlantı durumu
- Storage kullanımı
- Aktif kullanıcı sayısı
- API response süreleri
- Error rate

---

#### 41. getDatabaseStats
Veritabanı istatistiklerini getirir.

```typescript
inputSchema: {}
```

**Dönen Bilgiler:**
- Tablo boyutları
- Index kullanımı
- Slow query'ler
- Connection pool durumu

---

#### 42. getAuditLogs
Admin audit loglarını getirir.

```typescript
inputSchema: {
  adminId?: string,
  actionType?: string,
  limit: number,
  period: 'today' | 'week' | 'month'
}
```

---

## 📋 Implementasyon Durumu

### ✅ Tamamlanan Tool'lar (18 adet)

| Tool                  | Kategori   | Durum |
| --------------------- | ---------- | ----- |
| `lookupUser`          | Kullanıcı  | ✅     |
| `searchUsers`         | Kullanıcı  | ✅     |
| `getUserActivity`     | Kullanıcı  | ✅     |
| `banUser`             | Kullanıcı  | ✅     |
| `unbanUser`           | Kullanıcı  | ✅     |
| `getRecentPosts`      | İçerik     | ✅     |
| `getPostDetails`      | İçerik     | ✅     |
| `hidePost`            | İçerik     | ✅     |
| `deletePost`          | İçerik     | ✅     |
| `getModerationQueue`  | Moderasyon | ✅     |
| `getContentReports`   | Moderasyon | ✅     |
| `getSystemStats`      | Sistem     | ✅     |
| `sendNotification`    | Bildirim   | ✅     |
| `getUserTransactions` | Finansal   | ✅     |
| `getUserBalance`      | Finansal   | ✅     |
| `getConversations`    | Mesajlaşma | ✅     |
| `getMessages`         | Mesajlaşma | ✅     |
| `getCreatorStats`     | Creator    | ✅     |
| `getSecurityLogs`     | Güvenlik   | ✅     |

### ⏳ Sonraki Aşama Tool'ları

| Tool                   | Kategori   | Öncelik |
| ---------------------- | ---------- | ------- |
| `reviewReport`         | Moderasyon | Yüksek  |
| `getAnomalyAlerts`     | Güvenlik   | Yüksek  |
| `resolveAnomalyAlert`  | Güvenlik   | Yüksek  |
| `sendBulkNotification` | Bildirim   | Orta    |
| `refundTransaction`    | Finansal   | Orta    |
| `getRevenueStats`      | Finansal   | Orta    |
| `getBroadcastChannels` | Broadcast  | Düşük   |
| `getSystemHealth`      | Sistem     | Düşük   |
| `getDatabaseStats`     | Sistem     | Düşük   |
| `getAuditLogs`         | Audit      | Düşük   |

---

## 🔐 Güvenlik Notları

1. **Tüm tool'lar admin authentication gerektirir**
2. **Hassas veriler (şifre, token) asla döndürülmez**
3. **Her aksiyon audit log'a kaydedilir**
4. **Rate limiting uygulanır**
5. **IP ve user agent loglanır**

---

## 📝 Implementasyon Notları

- Tool'lar `/apps/web/lib/ai/tools.ts` dosyasında tanımlanır
- Her tool için Zod schema gereklidir
- Execute fonksiyonu async olmalıdır
- Hata durumunda `{ success: false, error: string }` döndürülür
- Başarılı durumda `{ success: true, ...data }` döndürülür
