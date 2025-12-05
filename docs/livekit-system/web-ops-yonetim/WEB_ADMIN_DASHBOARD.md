# LiveKit Web Admin Dashboard

> Web ekibi için Canlı Yayın Yönetim Paneli dokümantasyonu

**Son Güncelleme:** 2025-12-05  
**Referans:** TODO.md → Faz 5: Ops Dashboard

---

## 📚 İlgili Dökümanlar

| Döküman                                                        | Açıklama                              |
| -------------------------------------------------------------- | ------------------------------------- |
| [LIVEKIT_REACT_INTEGRATION.md](./LIVEKIT_REACT_INTEGRATION.md) | LiveKit React SDK ile canlı izleme    |
| [WEB_ADMIN_DASHBOARD.md](./WEB_ADMIN_DASHBOARD.md)             | Bu döküman - Genel dashboard tasarımı |

---

## 📋 Genel Bakış

Web admin dashboard, İpelya uygulamasındaki tüm canlı yayın, sesli oda ve 1-1 çağrıları yönetmek, izlemek ve denetlemek için kullanılacak web panelidir.

### Temel Özellikler

| Özellik                | Açıklama                                     |
| ---------------------- | -------------------------------------------- |
| **Live Monitoring**    | Aktif oturumları gerçek zamanlı izleme       |
| **Live Preview**       | 🆕 Yayınları canlı izleme (LiveKit React SDK) |
| **Session Management** | Oturumları görüntüleme, detay, zorla kapatma |
| **User Management**    | Katılımcıları görme, kick/ban işlemleri      |
| **Moderation**         | Şikayet kuyruğu, ban yönetimi                |
| **Analytics**          | Kullanım istatistikleri, grafikler           |
| **Logs**               | Edge function ve sistem logları              |
| **Alerts**             | Kota ve hata alarmları                       |

### Tech Stack

| Kategori      | Teknoloji                                      |
| ------------- | ---------------------------------------------- |
| **Framework** | Next.js 14+ (App Router)                       |
| **UI**        | shadcn/ui + Tailwind CSS                       |
| **LiveKit**   | `@livekit/components-react` + `livekit-client` |
| **Charts**    | Recharts                                       |
| **Real-time** | Supabase Realtime                              |
| **Auth**      | Supabase Auth (admin_profiles)                 |
| **State**     | React Query / TanStack Query                   |

---

## 🏗️ Dashboard Sayfaları

### 1. Live Overview (Ana Sayfa)

Tüm aktif oturumların özet görünümü.

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Live Overview                                [Refresh: 10s] │
├─────────────────┬─────────────────┬───────────────┬─────────────┤
│ Active Sessions │ Total Viewers   │ Audio Rooms   │ Active Calls│
│      12         │      847        │      5        │      3      │
├─────────────────┴─────────────────┴───────────────┴─────────────┤
│                                                                 │
│  🔴 Active Video Sessions                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID      │ Creator   │ Title     │ Viewers │ Duration │ ⚙️ │  │
│  │ abc123  │ @creator1 │ Merhaba   │ 234     │ 45 min   │[⋮]│  │
│  │ def456  │ @creator2 │ Sohbet    │ 89      │ 1h 20m   │[⋮]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🎙️ Active Audio Rooms                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID      │ Host      │ Title     │ Speakers│ Listeners│ ⚙️ │  │
│  │ ghi789  │ @host1    │ Podcast   │ 3       │ 45       │[⋮]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📞 Active Calls                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID      │ Caller    │ Callee    │ Type  │ Duration   │ ⚙️ │  │
│  │ jkl012  │ @user1    │ @user2    │ video │ 12 min     │[⋮]│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Aksiyonlar (⋮ menüsü):**
- 👁️ View Details - Detay sayfasına git
- 👥 View Participants - Katılımcıları gör
- 🔴 Force End - Zorla sonlandır
- 📋 Copy Room ID - LiveKit room ID kopyala

**Gerekli Veriler:**
```sql
-- Aktif video sessions
SELECT 
  ls.id,
  ls.title,
  ls.session_type,
  ls.livekit_room_name,
  ls.started_at,
  ls.peak_viewers,
  p.username as creator_username,
  p.display_name as creator_name,
  p.avatar_url as creator_avatar,
  COUNT(lp.id) FILTER (WHERE lp.is_active = true) as current_viewers,
  EXTRACT(EPOCH FROM (NOW() - ls.started_at)) as duration_seconds
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
LEFT JOIN live_participants lp ON ls.id = lp.session_id
WHERE ls.status = 'live'
GROUP BY ls.id, p.id
ORDER BY ls.started_at DESC;

-- Aktif calls
SELECT 
  c.id,
  c.call_type,
  c.livekit_room_name,
  c.initiated_at,
  c.answered_at,
  caller.username as caller_username,
  callee.username as callee_username,
  EXTRACT(EPOCH FROM (NOW() - COALESCE(c.answered_at, c.initiated_at))) as duration_seconds
FROM calls c
JOIN profiles caller ON c.caller_id = caller.user_id AND caller.type = 'real'
JOIN profiles callee ON c.callee_id = callee.user_id AND callee.type = 'real'
WHERE c.status IN ('ringing', 'accepted')
ORDER BY c.initiated_at DESC;
```

---

### 2. Session Detail

Tek bir oturumun detaylı görünümü.

```
┌─────────────────────────────────────────────────────────────────┐
│  📺 Session Detail: "Gece Sohbeti"              [← Back to List]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Session Info                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID:           abc123-def456-...                          │  │
│  │ Type:         video_live                                 │  │
│  │ Access:       subscribers_only                           │  │
│  │ Started:      2025-12-05 22:30:00 (2h 15m ago)          │  │
│  │ LiveKit Room: live_video_abc123_1701812400              │  │
│  │ LiveKit SID:  RM_xxxxxxxx                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Creator                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Avatar] @creator_username                               │  │
│  │          Creator Name                                    │  │
│  │          [View Profile] [Send Notification]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Statistics                                                     │
│  ┌────────────┬────────────┬────────────┬────────────────────┐ │
│  │ Current    │ Peak       │ Total      │ Messages │ Gifts   │ │
│  │ Viewers    │ Viewers    │ Join       │          │         │ │
│  │ 234        │ 456        │ 1,203      │ 2,341    │ 89      │ │
│  └────────────┴────────────┴────────────┴────────────────────┘ │
│                                                                 │
│  👥 Participants (234 active)                    [Export CSV]   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User        │ Role     │ Joined    │ Watch Time │ Actions │  │
│  │ @viewer1    │ viewer   │ 1h ago    │ 58 min     │ [Kick]  │  │
│  │ @speaker1   │ speaker  │ 2h ago    │ 2h 10m     │ [Kick]  │  │
│  │ @mod1       │ moderator│ 2h ago    │ 2h 15m     │ [Demote]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💬 Recent Chat (Last 50)                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [22:45] @user1: Merhaba!                          [🗑️]    │  │
│  │ [22:46] @user2: Selam                             [🗑️]    │  │
│  │ [22:47] 🎁 @user3 sent 5x Heart (50 coins)       [🗑️]    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Actions                                                        │
│  [🔴 Force End Session] [📢 Send Announcement] [⚠️ Warn Creator]│
└─────────────────────────────────────────────────────────────────┘
```

**Gerekli Veriler:**
```sql
-- Session detail
SELECT 
  ls.*,
  p.username as creator_username,
  p.display_name as creator_name,
  p.avatar_url as creator_avatar,
  p.user_id as creator_user_id
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
WHERE ls.id = $1;

-- Participants
SELECT 
  lp.*,
  p.username,
  p.display_name,
  p.avatar_url,
  EXTRACT(EPOCH FROM (NOW() - lp.joined_at)) as watch_time_seconds
FROM live_participants lp
JOIN profiles p ON lp.profile_id = p.id
WHERE lp.session_id = $1
ORDER BY lp.role, lp.joined_at;

-- Recent messages
SELECT 
  lm.*,
  p.username as sender_username,
  p.avatar_url as sender_avatar,
  g.name as gift_name,
  g.icon_url as gift_icon
FROM live_messages lm
JOIN profiles p ON lm.sender_profile_id = p.id
LEFT JOIN gifts g ON lm.gift_id = g.id
WHERE lm.session_id = $1 AND lm.is_deleted = false
ORDER BY lm.created_at DESC
LIMIT 50;
```

---

### 3. Moderation Panel

Şikayetler ve ban yönetimi.

```
┌─────────────────────────────────────────────────────────────────┐
│  🛡️ Moderation Panel                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Overview                                                    │
│  ┌────────────┬────────────┬────────────┬────────────────────┐ │
│  │ Pending    │ Reviewed   │ Active     │ Total Bans         │ │
│  │ Reports    │ Today      │ Session    │ (This Month)       │ │
│  │ 8          │ 23         │ Bans: 12   │ 156                │ │
│  └────────────┴────────────┴────────────┴────────────────────┘ │
│                                                                 │
│  🚨 Pending Reports                              [Filter ▼]     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ID     │ Reporter │ Reported │ Reason    │ Time  │ Actions│  │
│  │ rpt001 │ @user1   │ @baduser │ Harassment│ 2h ago│ [View] │  │
│  │ rpt002 │ @user2   │ @baduser │ Spam      │ 3h ago│ [View] │  │
│  │ rpt003 │ @user3   │ @other   │ Nudity    │ 5h ago│ [View] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🚫 Active Bans                                  [Search...]    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ User      │ Type     │ Reason    │ Expires   │ Actions   │  │
│  │ @baduser  │ Global   │ Harassment│ 7 days    │ [Lift]    │  │
│  │ @spammer  │ Creator  │ Spam      │ Permanent │ [Lift]    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Report Detail Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 Report Detail                                    [× Close]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Reporter: @user1 (User Name)                                   │
│  Reported: @baduser (Bad User)                                  │
│  Session:  abc123 - "Gece Sohbeti"                             │
│  Time:     2025-12-05 20:30:00                                 │
│  Reason:   Harassment                                           │
│                                                                 │
│  Description:                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Bu kullanıcı sürekli rahatsız edici mesajlar atıyor...   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Evidence:                                                      │
│  [Screenshot 1] [Screenshot 2]                                  │
│                                                                 │
│  User History (@baduser):                                       │
│  - Previous reports: 3                                          │
│  - Previous bans: 1                                             │
│  - Account age: 45 days                                         │
│                                                                 │
│  Actions:                                                       │
│  [❌ Dismiss] [⚠️ Warn User] [🚫 Ban 24h] [🚫 Ban 7d] [🚫 Permanent]│
└─────────────────────────────────────────────────────────────────┘
```

**Gerekli Veriler:**
```sql
-- Pending reports
SELECT 
  lr.*,
  reporter.username as reporter_username,
  reported.username as reported_username,
  ls.title as session_title
FROM live_reports lr
JOIN profiles reporter ON lr.reporter_id = reporter.user_id AND reporter.type = 'real'
JOIN profiles reported ON lr.reported_user_id = reported.user_id AND reported.type = 'real'
LEFT JOIN live_sessions ls ON lr.session_id = ls.id
WHERE lr.status = 'pending'
ORDER BY lr.created_at DESC;

-- Active bans (all types)
SELECT 
  'session' as ban_type,
  lsb.id,
  p.username,
  lsb.reason,
  lsb.expires_at,
  lsb.created_at,
  ls.title as context
FROM live_session_bans lsb
JOIN profiles p ON lsb.banned_user_id = p.user_id AND p.type = 'real'
LEFT JOIN live_sessions ls ON lsb.session_id = ls.id
WHERE lsb.expires_at IS NULL OR lsb.expires_at > NOW()

UNION ALL

SELECT 
  'creator' as ban_type,
  cb.id,
  p.username,
  cb.reason,
  cb.expires_at,
  cb.created_at,
  creator.username as context
FROM creator_bans cb
JOIN profiles p ON cb.banned_user_id = p.user_id AND p.type = 'real'
JOIN profiles creator ON cb.creator_id = creator.user_id AND creator.type = 'real'
WHERE cb.expires_at IS NULL OR cb.expires_at > NOW()

UNION ALL

SELECT 
  'global' as ban_type,
  p.id,
  p.username,
  'Platform ban' as reason,
  p.banned_until as expires_at,
  NULL as created_at,
  NULL as context
FROM profiles p
WHERE p.banned_until IS NOT NULL AND p.banned_until > NOW()

ORDER BY created_at DESC;
```

---

### 4. Analytics

Kullanım istatistikleri ve grafikler.

```
┌─────────────────────────────────────────────────────────────────┐
│  📈 Analytics                          [Date Range: Last 7 Days]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Daily Sessions                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     ▃                                                     │  │
│  │   ▅ █ ▃                                                   │  │
│  │ ▂ █ █ █ ▅ ▃ ▅                                             │  │
│  │ Mon Tue Wed Thu Fri Sat Sun                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Summary                                                        │
│  ┌────────────┬────────────┬────────────┬────────────────────┐ │
│  │ Total      │ Total      │ Avg        │ Total              │ │
│  │ Sessions   │ Watch Hrs  │ Duration   │ Participants       │ │
│  │ 156        │ 892h       │ 45 min     │ 12,450             │ │
│  └────────────┴────────────┴────────────┴────────────────────┘ │
│                                                                 │
│  Top Creators                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rank │ Creator   │ Sessions │ Total Hours │ Avg Viewers  │  │
│  │ 1    │ @creator1 │ 23       │ 89h         │ 234          │  │
│  │ 2    │ @creator2 │ 18       │ 67h         │ 189          │  │
│  │ 3    │ @creator3 │ 15       │ 45h         │ 156          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Session Types Distribution                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ████████████████ Video Live (68%)                        │  │
│  │ ██████████ Audio Rooms (25%)                             │  │
│  │ ███ Video Calls (5%)                                     │  │
│  │ ██ Audio Calls (2%)                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Gerekli Veriler:**
```sql
-- Daily summary
SELECT 
  DATE(started_at) as date,
  COUNT(*) as session_count,
  SUM(total_duration_seconds) / 3600.0 as total_hours,
  AVG(total_duration_seconds) / 60.0 as avg_duration_minutes,
  SUM(total_viewers) as total_viewers,
  SUM(peak_viewers) as total_peak_viewers,
  SUM(total_messages) as total_messages,
  SUM(total_gifts_received) as total_gifts
FROM live_sessions
WHERE started_at >= NOW() - INTERVAL '7 days'
  AND status = 'ended'
GROUP BY DATE(started_at)
ORDER BY date;

-- Top creators
SELECT 
  p.username,
  p.display_name,
  p.avatar_url,
  COUNT(ls.id) as session_count,
  SUM(ls.total_duration_seconds) / 3600.0 as total_hours,
  AVG(ls.peak_viewers) as avg_viewers,
  SUM(ls.total_gifts_received) as total_gifts
FROM live_sessions ls
JOIN profiles p ON ls.creator_profile_id = p.id
WHERE ls.started_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY session_count DESC
LIMIT 20;

-- Session type distribution
SELECT 
  session_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM live_sessions
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY session_type;
```

---

### 5. System Logs

Edge function ve sistem logları.

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 System Logs                              [Auto-refresh: ON] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filters:                                                       │
│  [Function ▼] [Level ▼] [Date Range] [User ID...] [Search...]   │
│                                                                 │
│  Logs                                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Time       │ Level │ Function          │ Message         │  │
│  │ 22:45:30   │ ERROR │ get-livekit-token │ Rate limited... │  │
│  │ 22:45:28   │ INFO  │ join-live-session │ User joined...  │  │
│  │ 22:45:25   │ WARN  │ livekit-webhook   │ Retry attempt...│  │
│  │ 22:45:20   │ INFO  │ create-live-sess..│ Session created │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Error Summary (Last 24h)                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Function              │ Errors │ Rate │ Last Error       │  │
│  │ get-livekit-token     │ 23     │ 0.5% │ 10 min ago       │  │
│  │ join-live-session     │ 5      │ 0.1% │ 2h ago           │  │
│  │ livekit-webhook       │ 2      │ 0.0% │ 6h ago           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Quota & Alerts

LiveKit kota kullanımı ve alarmlar.

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Quota & Alerts                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LiveKit Cloud Usage (This Month)                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │ Participant Minutes                                       │  │
│  │ [████████████████░░░░] 3,421 / 5,000 (68%)               │  │
│  │ Projected: 4,800 ✅                                       │  │
│  │                                                           │  │
│  │ Egress Minutes                                            │  │
│  │ [██████░░░░░░░░░░░░░░] 42 / 60 (70%)                     │  │
│  │                                                           │  │
│  │ Peak Concurrent Participants                              │  │
│  │ [██████████████████░░] 89 / 100 (89%) ⚠️                  │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Alert Configuration                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Metric                  │ Warning │ Critical │ Status    │  │
│  │ Participant Minutes     │ 75%     │ 90%      │ ✅ OK      │  │
│  │ Concurrent Participants │ 80%     │ 95%      │ ⚠️ Warning │  │
│  │ Edge Function Errors    │ 1%      │ 5%       │ ✅ OK      │  │
│  │ Orphaned Sessions       │ 5       │ 10       │ ✅ OK      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Recent Alerts                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Time       │ Level    │ Message                          │  │
│  │ 22:30      │ WARNING  │ Concurrent participants at 89%   │  │
│  │ 20:15      │ INFO     │ Daily usage report generated     │  │
│  │ 18:00      │ WARNING  │ 3 orphaned sessions cleaned up   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Notification Channels                                          │
│  [✅ Slack] [✅ Discord] [✅ Email] [Configure...]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

Web dashboard için gerekli API endpoint'leri.

### Session Management

| Method | Endpoint                               | Açıklama                         |
| ------ | -------------------------------------- | -------------------------------- |
| `GET`  | `/api/admin/sessions`                  | Tüm aktif/son oturumları listele |
| `GET`  | `/api/admin/sessions/:id`              | Oturum detayı                    |
| `GET`  | `/api/admin/sessions/:id/participants` | Katılımcı listesi                |
| `GET`  | `/api/admin/sessions/:id/messages`     | Chat mesajları                   |
| `POST` | `/api/admin/sessions/:id/terminate`    | Oturumu zorla kapat              |
| `POST` | `/api/admin/sessions/:id/announce`     | Duyuru gönder                    |

### Participant Management

| Method | Endpoint                              | Açıklama          |
| ------ | ------------------------------------- | ----------------- |
| `POST` | `/api/admin/participants/:id/kick`    | Katılımcıyı çıkar |
| `POST` | `/api/admin/participants/:id/ban`     | Katılımcıyı banla |
| `POST` | `/api/admin/participants/:id/promote` | Rol yükselt       |
| `POST` | `/api/admin/participants/:id/demote`  | Rol düşür         |

### Moderation

| Method   | Endpoint                        | Açıklama                      |
| -------- | ------------------------------- | ----------------------------- |
| `GET`    | `/api/admin/reports`            | Şikayet listesi               |
| `GET`    | `/api/admin/reports/:id`        | Şikayet detayı                |
| `POST`   | `/api/admin/reports/:id/action` | Aksiyon al (dismiss/warn/ban) |
| `GET`    | `/api/admin/bans`               | Ban listesi                   |
| `DELETE` | `/api/admin/bans/:id`           | Ban kaldır                    |

### Analytics

| Method | Endpoint                        | Açıklama               |
| ------ | ------------------------------- | ---------------------- |
| `GET`  | `/api/admin/analytics/overview` | Özet istatistikler     |
| `GET`  | `/api/admin/analytics/daily`    | Günlük veriler         |
| `GET`  | `/api/admin/analytics/creators` | Creator istatistikleri |
| `GET`  | `/api/admin/analytics/sessions` | Session istatistikleri |

### System

| Method | Endpoint                   | Açıklama             |
| ------ | -------------------------- | -------------------- |
| `GET`  | `/api/admin/logs`          | Sistem logları       |
| `GET`  | `/api/admin/quota`         | Kota kullanımı       |
| `GET`  | `/api/admin/alerts`        | Alarm listesi        |
| `POST` | `/api/admin/alerts/config` | Alarm yapılandırması |

---

## ⚡ Gerekli Edge Functions

Dashboard için yeni edge function'lar:

| Function                  | Açıklama                | Öncelik  |
| ------------------------- | ----------------------- | -------- |
| `admin-terminate-session` | Oturumu zorla sonlandır | 🔴 Kritik |
| `admin-kick-participant`  | Katılımcıyı çıkar       | 🔴 Kritik |
| `admin-ban-user`          | Kullanıcıyı banla       | 🔴 Kritik |
| `admin-unban-user`        | Ban kaldır              | 🟡 Yüksek |
| `admin-get-logs`          | Logları getir           | 🟡 Yüksek |
| `admin-get-quota`         | LiveKit kota bilgisi    | 🟡 Yüksek |
| `admin-handle-report`     | Şikayet işle            | 🟡 Yüksek |

### admin-terminate-session Örneği

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';

serve(async (req) => {
  // Admin auth kontrolü
  const user = await verifyAdminAuth(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { sessionId, reason } = await req.json();

  // Session bilgisini al
  const { data: session } = await supabase
    .from('live_sessions')
    .select('livekit_room_name')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
  }

  // LiveKit'te odayı kapat
  const roomService = new RoomServiceClient(
    Deno.env.get('LIVEKIT_URL'),
    Deno.env.get('LIVEKIT_API_KEY'),
    Deno.env.get('LIVEKIT_API_SECRET')
  );

  await roomService.deleteRoom(session.livekit_room_name);

  // DB güncelle
  await supabase.from('live_sessions').update({
    status: 'ended',
    ended_at: new Date().toISOString(),
    end_reason: `admin_terminated: ${reason}`,
  }).eq('id', sessionId);

  // Log kaydet
  await supabase.from('admin_livekit_logs').insert({
    admin_id: user.id,
    action: 'terminate_session',
    target_id: sessionId,
    reason,
  });

  return new Response(JSON.stringify({ success: true }));
});
```

---

## 🗄️ Ek Veritabanı Tabloları

Dashboard için gerekli ek tablolar:

### admin_logs > admin_livekit_logs olarak değiştirdik içeriğe dikkat et

```sql
CREATE TABLE public.admin_livekit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,  -- 'terminate_session', 'kick_user', 'ban_user', etc.
  target_type text,      -- 'session', 'user', 'report'
  target_id text,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
```

### live_reports (Şikayetler) - ⚠️ OLUŞTURULMALI

```sql
CREATE TABLE public.live_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_sessions(id),
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  reported_user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  description text,
  evidence_urls text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  action_taken text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX idx_live_reports_status ON live_reports(status);
CREATE INDEX idx_live_reports_reported_user ON live_reports(reported_user_id);

ALTER TABLE live_reports ENABLE ROW LEVEL SECURITY;
```

### creator_bans - ✅ ZATEN MEVCUT

> **Not:** `creator_bans` için ayrı tablo oluşturmaya gerek yok. Mevcut `live_session_bans` tablosunda `ban_type = 'permanent'` kullanılarak creator bazlı kalıcı ban yapılabiliyor.

**Mevcut `live_session_bans` yapısı:**
```sql
-- Mevcut tablo yapısı:
- ban_type: 'session' (sadece bu oturum) | 'permanent' (creator yayınlarından kalıcı)
- is_active: boolean (ban aktif mi?)
- lifted_at: timestamp (ban kaldırılma zamanı)
- lifted_by: uuid (kim kaldırdı)
```

---

## 🔐 Yetkilendirme

Dashboard erişimi için rol bazlı yetkilendirme.

> **Not:** `admin_profiles` tablosu zaten mevcut ve web admin auth için kullanılabilir. Bu tablo `is_super_admin` alanı içeriyor.

| Rol             | Yetkiler                                              |
| --------------- | ----------------------------------------------------- |
| **super_admin** | Tüm yetkiler (`admin_profiles.is_super_admin = true`) |
| **admin**       | Moderasyon, session yönetimi, analytics               |
| **moderator**   | Şikayet inceleme, kick/ban                            |
| **viewer**      | Sadece görüntüleme (analytics, logs)                  |

### Mevcut `admin_profiles` yapısı

```sql
-- Veritabanında zaten mevcut:
admin_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  is_active boolean DEFAULT true,
  is_super_admin boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Admin kontrolü örneği

```typescript
async function verifyAdminAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  // Admin profili kontrolü
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id, full_name, is_active, is_super_admin')
    .eq('id', user.id)
    .single();

  // Admin değilse veya aktif değilse reddet
  if (!adminProfile || !adminProfile.is_active) {
    return null;
  }

  return { 
    ...user, 
    adminProfile,
    isSuperAdmin: adminProfile.is_super_admin 
  };
}
```

---

## ✅ Checklist

### Database

**Mevcut tablolar (zaten var):**
- [x] `live_sessions` tablosu ✅
- [x] `live_participants` tablosu ✅
- [x] `live_messages` tablosu ✅
- [x] `live_gifts` tablosu ✅
- [x] `calls` tablosu ✅
- [x] `live_session_bans` tablosu ✅ (ban_type ile creator ban desteği var)
- [x] `live_guest_requests` tablosu ✅
- [x] `admin_profiles` tablosu ✅ (web admin auth için)

**Oluşturulması gereken:**
- [ ] `live_reports` tablosu (şikayet sistemi için)
- [ ] `admin_logs` tablosu (admin işlem logları için) bunu admin_livekit_docs yapabiliriz, ama diğer yerleri de check etmek lazım admin_logs geçebilir.
- [ ] Admin RLS policies eklendi

### Edge Functions
- [ ] `admin-terminate-session` deploy edildi
- [ ] `admin-kick-participant` deploy edildi
- [ ] `admin-ban-user` deploy edildi
- [ ] `admin-unban-user` deploy edildi
- [ ] `admin-handle-report` deploy edildi
- [ ] `admin-get-logs` deploy edildi
- [ ] `admin-get-quota` deploy edildi

### Frontend
- [ ] Live Overview sayfası
- [ ] Session Detail sayfası
- [ ] Moderation Panel
- [ ] Analytics sayfası
- [ ] System Logs sayfası
- [ ] Quota & Alerts sayfası
- [ ] Real-time updates (Supabase Realtime)
- [ ] Export functionality (CSV)

### Integration
- [ ] LiveKit API entegrasyonu (quota bilgisi) livekit mcp ile api bilgilerini alıp hangilerini kullanacağımıza karar verelim
- [ ] Slack/Discord webhook entegrasyonu (düşüneceğiz.)
- [ ] Sentry error tracking

---

## 📚 Referanslar

- [MONITORING.md](./MONITORING.md) - Metrikler ve alert yapılandırması
- [MODERATION.md](./MODERATION.md) - Moderasyon politikası
- [RUNBOOK.md](./RUNBOOK.md) - Operasyonel prosedürler
- [DATABASE.md](./DATABASE.md) - Veritabanı şeması
- [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md) - Edge function detayları
