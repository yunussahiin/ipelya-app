# İpelya Home Feed - Web Ops Documentation

## 📚 Genel Bakış

Bu klasör, İpelya Home Feed sisteminin **Web Ops (Next.js) tarafında** kullanılacak yönetim paneli dökümanlarını içerir. Ops paneli, feed içeriklerini moderasyon, kullanıcı yönetimi, analytics ve sistem ayarlarını yönetmek için kullanılır.

---

## 🎯 Web Ops Özellikleri

### 1. Content Moderation (İçerik Moderasyonu)
- **Feed içeriklerini görüntüleme** - Posts, mini posts, voice moments, polls
- **Moderasyon queue** - AI flagged content review
- **User reports** - Spam/abuse raporlarını inceleme
- **Bulk actions** - Toplu hide/delete/approve
- **User ban/shadowban** - Kullanıcı yasaklama işlemleri

### 2. Analytics Dashboard (Analitik Paneli)
- **Feed metrics** - Engagement, dwell time, session length
- **Content performance** - Trending posts, viral content
- **User behavior** - Activity patterns, content preferences
- **Algorithm metrics** - Vibe Match success, Intent Match conversion
- **Real-time stats** - Active users, live feed activity

### 3. Algorithm Management (Algoritma Yönetimi)
- **Scoring weights** - Base, vibe, intent, social graph weights
- **Vibe parameters** - Mood compatibility matrix
- **Intent parameters** - Intent-content type matrix
- **Diversity settings** - Content type distribution
- **A/B testing** - Experiment management

### 4. Notification Management (Bildirim Yönetimi)
- **Bulk notifications** - Toplu bildirim gönderme
- **Scheduled notifications** - Zamanlanmış bildirimler
- **Templates** - Bildirim şablonları
- **Campaigns** - Kampanya yönetimi
- **Analytics** - Delivery, open, click rates

### 5. User Management (Kullanıcı Yönetimi)
- **User profiles** - Profil görüntüleme ve düzenleme
- **Shadow monitoring** - Shadow profile tracking
- **Session tracking** - Active sessions, device info
- **Lock/unlock** - Kullanıcı kilitleme işlemleri
- **Rate limiting** - Rate limit configuration

---

## 📖 Döküman İndeksi

### 1. [01-WEB-OPS-ARCHITECTURE.md](./01-WEB-OPS-ARCHITECTURE.md)
**Web Ops sistem mimarisi**
- Next.js app structure
- API routes
- Component hierarchy
- State management
- Authentication & authorization

### 2. [02-WEB-OPS-PAGES.md](./02-WEB-OPS-PAGES.md)
**Ops panel sayfaları ve UI**
- Dashboard (overview)
- Content Moderation
- Analytics
- Algorithm Settings
- Notifications
- Users
- Settings

### 3. [03-WEB-OPS-COMPONENTS.md](./03-WEB-OPS-COMPONENTS.md)
**Reusable components**
- Layout components
- Data tables
- Charts & graphs
- Modals & dialogs
- Forms & inputs

### 4. [04-WEB-OPS-API-ROUTES.md](./04-WEB-OPS-API-ROUTES.md)
**Next.js API routes**
- Content endpoints
- Analytics endpoints
- Algorithm endpoints
- Notification endpoints
- User endpoints

### 5. [05-WEB-OPS-DATABASE.md](./05-WEB-OPS-DATABASE.md)
**Ops-specific database tables**
- notification_campaigns
- notification_templates
- notification_logs
- algorithm_configs
- moderation_queue
- audit_logs

### 6. [06-WEB-OPS-EDGE-FUNCTIONS.md](./06-WEB-OPS-EDGE-FUNCTIONS.md)
**Supabase Edge Functions**
- bulk-notification
- scheduled-notification
- cleanup-notifications
- moderate-content-batch
- generate-analytics

### 7. [07-WEB-OPS-INTEGRATION.md](./07-WEB-OPS-INTEGRATION.md)
**Mevcut sistemlerle entegrasyon**
- Notification system integration
- Shadow profile integration
- Session tracking integration
- Analytics integration

---

## 🏗️ Klasör Yapısı

```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (ops)/
│   │   ├── layout.tsx                    # Ops layout
│   │   ├── page.tsx                      # Dashboard
│   │   ├── content/
│   │   │   ├── page.tsx                  # Content moderation
│   │   │   ├── posts/
│   │   │   ├── mini-posts/
│   │   │   ├── voice-moments/
│   │   │   └── polls/
│   │   ├── analytics/
│   │   │   ├── page.tsx                  # Analytics dashboard
│   │   │   ├── feed/
│   │   │   ├── users/
│   │   │   └── content/
│   │   ├── algorithm/
│   │   │   ├── page.tsx                  # Algorithm settings
│   │   │   ├── weights/
│   │   │   ├── vibe/
│   │   │   └── intent/
│   │   ├── notifications/
│   │   │   ├── page.tsx                  # Notification management
│   │   │   ├── send/
│   │   │   ├── scheduled/
│   │   │   ├── templates/
│   │   │   └── campaigns/
│   │   ├── users/
│   │   │   ├── page.tsx                  # User management
│   │   │   ├── [userId]/
│   │   │   └── sessions/
│   │   └── settings/
│   │       └── page.tsx                  # System settings
│   └── api/
│       └── ops/
│           ├── content/
│           ├── analytics/
│           ├── algorithm/
│           ├── notifications/
│           └── users/
├── components/
│   └── ops/
│       ├── layout/
│       ├── content/
│       ├── analytics/
│       ├── algorithm/
│       ├── notifications/
│       └── users/
└── lib/
    └── ops/
        ├── api.ts
        ├── types.ts
        └── utils.ts
```

---

## 🎨 Design System (Web Ops)

### Renk Paleti

**Light Mode:**
```typescript
const opsColors = {
  // Primary (Ops specific)
  primary: '#3B82F6',        // Blue
  primaryLight: '#93C5FD',   // Light blue
  primaryDark: '#1E40AF',    // Dark blue
  
  // Status
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Orange
  error: '#EF4444',          // Red
  info: '#3B82F6',           // Blue
  
  // Neutral
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};
```

**Dark Mode:**
```typescript
const opsDarkColors = {
  // Primary
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral
  background: '#111827',
  surface: '#1F2937',
  border: '#374151',
  
  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
};
```

---

## 🔐 Authentication & Authorization

### Admin Roles
```typescript
type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst';

const permissions = {
  super_admin: ['*'], // All permissions
  admin: [
    'content:read',
    'content:moderate',
    'users:read',
    'users:manage',
    'analytics:read',
    'algorithm:read',
    'algorithm:update',
    'notifications:send',
  ],
  moderator: [
    'content:read',
    'content:moderate',
    'users:read',
  ],
  analyst: [
    'content:read',
    'users:read',
    'analytics:read',
  ],
};
```

### RLS Policies
```sql
-- Admin profiles can only be accessed by admins
CREATE POLICY "Admins can view admin profiles"
ON admin_profiles FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM admin_profiles WHERE is_active = true
  )
);

-- Content moderation access
CREATE POLICY "Moderators can view all content"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND is_active = true
  )
);
```

---

## 📊 Component Standards

### Türkçe Comment Zorunluluğu

**✅ DOĞRU:**
```typescript
/**
 * PostModerationCard Component
 * 
 * Amaç: Feed'deki post'ları moderasyon için görüntüler
 * 
 * Özellikler:
 * - Post preview (görsel, caption, user info)
 * - Moderasyon butonları (approve, reject, hide)
 * - AI moderation score gösterimi
 * - User report sayısı
 * 
 * Props:
 * - post: Post objesi (id, user, content, stats)
 * - onApprove: Approve callback
 * - onReject: Reject callback
 * - onHide: Hide callback
 * 
 * Kullanım:
 * <PostModerationCard
 *   post={post}
 *   onApprove={handleApprove}
 *   onReject={handleReject}
 * />
 */
export const PostModerationCard = ({ post, onApprove, onReject, onHide }: Props) => {
  // Post approval işlemi
  // AI moderation score'u kontrol et, eğer > 0.8 ise otomatik approve
  const handleApprove = async () => {
    // ...
  };
  
  return (
    <Card>
      {/* Post preview */}
      <PostPreview post={post} />
      
      {/* Moderation actions */}
      <div className="flex gap-2">
        <Button onClick={handleApprove}>Onayla</Button>
        <Button onClick={handleReject} variant="destructive">Reddet</Button>
      </div>
    </Card>
  );
};
```

**❌ YANLIŞ:**
```typescript
// No comments
export const PostModerationCard = ({ post, onApprove }: Props) => {
  const handleApprove = async () => {
    // ...
  };
  
  return <Card>...</Card>;
};
```

---

## 🚀 Hızlı Başlangıç

### 1. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

### 2. Install Dependencies
```bash
cd apps/web
pnpm install
```

### 3. Run Development Server
```bash
pnpm dev
```

### 4. Access Ops Panel
```
http://localhost:3000/ops
```

---

## 📝 Development Guidelines

### 1. Component Structure
- Her component kendi klasöründe
- index.tsx + types.ts + styles (if needed)
- Türkçe comment zorunlu
- Props interface tanımla

### 2. API Routes
- `/app/api/ops/` altında organize et
- Error handling ekle
- Rate limiting uygula
- Admin auth check yap

### 3. Database Operations
- Supabase client kullan
- RLS policies'e uy
- Transaction kullan (gerekirse)
- Error handling ekle

### 4. Edge Functions
- Supabase MCP server kullan
- Deno runtime
- Type-safe
- Error handling

---

## 🔗 Bağlantılar

- [Main Feed Docs](../)
- [Notification System Docs](../../bildirim-sistemi/)
- [Shadow Profile Docs](../../shadow-profile/)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**© 2025 İpelya - Web Ops Documentation**
