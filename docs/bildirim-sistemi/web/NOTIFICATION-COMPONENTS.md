# Web Bildirim Sistemi - Tamamlanan Bileşenler

**Tarih:** Nov 20, 2025  
**Durum:** ✅ Production Ready

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Bileşenler](#bileşenler)
3. [Entegrasyon](#entegrasyon)
4. [Özellikler](#özellikler)
5. [Dark Mode](#dark-mode)
6. [Kullanım Örnekleri](#kullanım-örnekleri)

---

## Genel Bakış

Web bildirim sistemi, kullanıcılara gerçek zamanlı bildirimler göstermek için Supabase Realtime ve shadcn/ui Popover bileşenleri kullanır.

**Teknoloji Stack:**
- React 19 (Hooks)
- TypeScript
- Supabase (Realtime + Database)
- shadcn/ui (Popover, Badge, Button)
- Tailwind CSS
- Lucide React (Icons)

---

## Bileşenler

### 1. NotificationCenter

**Dosya:** `/apps/web/components/notifications/NotificationCenter.tsx`

Ana bildirim dropdown bileşeni. Popover içinde NotificationBell ve NotificationList'i birleştirir.

**Props:**
```typescript
interface NotificationCenterProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onMarkAllAsRead?: () => void;
}
```

**Özellikler:**
- ✅ Popover-based dropdown (Radix UI)
- ✅ Unread count badge
- ✅ Real-time data (useNotifications hook)
- ✅ Mark as read / Mark all as read
- ✅ Delete notification
- ✅ Dark mode uyumlu
- ✅ Loading state
- ✅ Empty state

**Kullanım:**
```tsx
<NotificationCenter notifications={[]} />
```

### 2. NotificationBell

**Dosya:** `/apps/web/components/notifications/NotificationBell.tsx`

Bell icon'u unread count badge ile gösterir.

**Props:**
```typescript
interface NotificationBellProps {
  unreadCount: number;
  isOpen?: boolean;
  onClick?: () => void;
}
```

**Özellikler:**
- ✅ Unread count badge (99+ gösterimi)
- ✅ Hover state
- ✅ Open/closed visual feedback

### 3. NotificationItem

**Dosya:** `/apps/web/components/notifications/NotificationItem.tsx`

Tek bir bildirimi gösterir.

**Props:**
```typescript
interface NotificationItemProps {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}
```

**Özellikler:**
- ✅ Unread dot indicator
- ✅ Relative time formatting (e.g., "5 minutes ago")
- ✅ Mark as read button
- ✅ Delete button
- ✅ Hover effects

### 4. NotificationList

**Dosya:** `/apps/web/components/notifications/NotificationList.tsx`

Bildirimlerin paginated listesi.

**Props:**
```typescript
interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  itemsPerPage?: number;
}
```

**Özellikler:**
- ✅ Pagination (default: 5 items/page)
- ✅ Mark all as read button
- ✅ Empty state
- ✅ Loading state
- ✅ Scroll support

---

## Entegrasyon

### Header'da Kullanım

**Dosya:** `/apps/web/components/site-header.tsx`

```tsx
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header>
      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter notifications={[]} />
        <ThemeSwitcherToggle />
        {user && <NavUser user={user} variant="header" />}
      </div>
    </header>
  );
}
```

### useNotifications Hook

**Dosya:** `/apps/web/hooks/useNotifications.ts`

Gerçek zamanlı bildirim verilerini sağlar.

```typescript
const { 
  notifications,      // Notification[]
  loading,           // boolean
  error,             // Error | null
  unreadCount,       // number
  markAsRead,        // (id: string) => Promise<void>
  markAllAsRead,     // () => Promise<void>
  deleteNotification // (id: string) => Promise<void>
} = useNotifications();
```

**Özellikler:**
- ✅ Supabase Realtime subscription
- ✅ Auto-refresh on changes
- ✅ Error handling
- ✅ Loading states

---

## Özellikler

### 1. Analytics Dashboard

**Dosya:** `/apps/web/app/ops/(private)/notifications/analytics/page.tsx`

**Gösterilen Veriler:**
- 📊 Stats Cards: Total campaigns, notifications, delivery rate, sent campaigns
- 📈 7-day trend chart (campaigns & notifications)
- 🥧 Campaign type distribution (pie chart)
- 📋 Recent campaigns table (last 10)

**Tablo Özellikleri:**
- ✅ shadcn/ui Table component
- ✅ Status badges (sent/scheduled/failed/draft)
- ✅ Type badges (single/bulk/scheduled)
- ✅ Delivery rate percentage
- ✅ Hover effects
- ✅ Dark mode uyumlu

### 2. Cleanup System

**Dosya:** `/apps/web/app/ops/(private)/notifications/cleanup/page.tsx`

**Otomatik Temizlik:**
- ⏰ Her gün 02:00 UTC'de çalışır
- 🗑️ 30+ gün eski bildirimleri siler
- 📦 30+ gün eski gönderilen kampanyaları arşivler

**Manuel İşlemler:**
- ✅ Eski bildirimleri sil
- ✅ Eski kampanyaları arşivle
- ✅ Kampanyaları arşivden çıkar

**Gösterilen İstatistikler:**
- 📊 Total notifications
- 🗑️ Old notifications (30+ days)
- 📊 Total campaigns
- ✅ Sent campaigns
- 📦 Archived campaigns
- ⏱️ Days until next cleanup

---

## Dark Mode

**Otomatik Dark Mode Desteği:**

1. **Theme Persistence** (`/apps/web/app/layout.tsx`)
   - Inline script `<head>`'de çalışır
   - localStorage'dan theme okur
   - React mount olmadan önce class'ı ekler
   - Flash yok ✨

2. **Theme Switcher** (`/apps/web/app/ops/(private)/account/theme-switcher-toggle.tsx`)
   - Light/Dark toggle button
   - localStorage'a kaydeder
   - System preference respekt eder

3. **CSS Variables** (`/apps/web/app/globals.css`)
   - `--background`, `--foreground`
   - `--card`, `--muted`
   - `--primary`, `--border`
   - Otomatik `.dark` class'ında switch

**Styling Standards** (ops directory için):
- ✅ `text-muted-foreground` - secondary text
- ✅ `bg-muted` - secondary backgrounds
- ✅ `border-border` - all borders
- ✅ `text-primary` - accent text
- ❌ Hardcoded colors (text-gray-600, bg-blue-50, etc.)

---

## Kullanım Örnekleri

### Bildirim Gösterme

```tsx
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function MyComponent() {
  const { notifications, markAsRead, deleteNotification } = useNotifications();

  return (
    <NotificationCenter
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onDelete={deleteNotification}
    />
  );
}
```

### Bildirim Oluşturma

```typescript
// Supabase'de notification oluştur
const { data, error } = await supabase
  .from("notifications")
  .insert({
    recipient_id: userId,
    title: "Kampanya Gönderildi",
    body: "Yeni kampanya başarıyla gönderildi",
    type: "campaign_sent",
    read: false
  });
```

### Real-time Subscription

```typescript
// useNotifications hook otomatik olarak handle eder
// Supabase Realtime'dan otomatik güncellemeler alır
const { notifications } = useNotifications();

// notifications array'i gerçek zamanlı güncellenir
```

---

## Database Schema

**notifications table:**
```sql
- id (uuid, primary key)
- recipient_id (uuid, foreign key)
- actor_id (uuid, foreign key)
- type (text)
- title (text)
- body (text)
- data (jsonb)
- read (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**notification_campaigns table:**
```sql
- id (uuid, primary key)
- admin_id (uuid)
- title (text)
- body (text)
- type (single/bulk/scheduled)
- status (draft/scheduled/sent/failed/archived)
- recipient_segment (creators/users/inactive/all)
- total_recipients (integer)
- sent_count (integer)
- failed_count (integer)
- scheduled_at (timestamp)
- sent_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## Edge Functions

**Mevcut Functions:**
- ✅ `send-notification` - Tek bildirim gönder
- ✅ `send-bulk-notification` - Toplu bildirim gönder
- ✅ `process-scheduled-notifications` - Zamanlanmış bildirimleri işle
- ✅ `cleanup-notifications` - Eski bildirimleri temizle

---

## Performance

**Optimizasyonlar:**
- ✅ Pagination (NotificationList)
- ✅ Real-time updates (Supabase Realtime)
- ✅ Lazy loading
- ✅ Memoization (React.memo)
- ✅ Efficient queries

---

## Accessibility

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Semantic HTML

---

## Sonraki Adımlar

- [ ] Notification preferences (user settings)
- [ ] Bulk actions (analytics table)
- [ ] Export/Reports (CSV, PDF)
- [ ] Notification scheduling UI
- [ ] Real-time notification sounds
- [ ] Notification history/archive
- [ ] Performance metrics dashboard

---

**Dokümantasyon Tarihi:** Nov 20, 2025  
**Son Güncelleme:** Bildirim sistemi tamamlandı
