# Web - Push Notifications Setup 🌐

## ⚠️ IMPORTANT: Shared Database with Mobile

Mobile tarafta zaten yapılan işlemler:
- ✅ `notifications` table
- ✅ `device_tokens` table
- ✅ `notification_preferences` table
- ✅ RLS policies
- ✅ Realtime enabled
- ✅ `send-notification` Edge Function

**Web tarafında yapılacak:**
- Admin tables: `notification_campaigns`, `notification_templates`, `notification_logs`
- Admin hooks: `useSendNotification`
- Admin panel components
- Admin Edge Functions

---

## 1. Database Schema (Admin Tables)

### notification_campaigns Tablosu
```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'single' | 'bulk' | 'scheduled'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  recipient_segment TEXT,
  filter JSONB,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  status TEXT DEFAULT 'draft', -- 'draft' | 'scheduled' | 'sent' | 'failed'
  total_recipients INT,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
```

### notification_templates Tablosu
```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  category TEXT, -- 'announcement' | 'maintenance' | 'security' | 'promotional'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
```

### notification_logs Tablosu
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT, -- 'sent' | 'failed' | 'delivered'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (campaign_id) REFERENCES notification_campaigns(id),
  FOREIGN KEY (recipient_id) REFERENCES auth.users(id)
);
```

---

## 2. RLS Policies (Admin-only)

```sql
-- Admin sadece kendi campaign'lerini görebilir
CREATE POLICY "Admins can view own campaigns"
  ON notification_campaigns
  FOR SELECT
  USING (auth.uid() = admin_id);

-- Admin sadece kendi campaign'lerini oluşturabilir
CREATE POLICY "Admins can create campaigns"
  ON notification_campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = admin_id);
```

---

## 3. Environment Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://ojkyisyjsbgbfytrmmlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cz_MqTpk-aRDtVWkhKcR9g_wJW1xh2s
SUPABASE_SERVICE_ROLE_KEY=sb_secret_mfxfml155gPLzWD07C_qvg_8pBtGFqU
```

---

## 4. Hooks Implementasyonu

### useNotifications Hook

**⚠️ NOTE:** Bu hook Mobile'da zaten yapıldı. Web'e copy edilecek.

```typescript
// hooks/useNotifications.ts
// Mobile'dan copy edilecek: /apps/mobile/src/hooks/useNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri yükle
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);

      // Okunmamış sayısını hesapla
      const unread = (data || []).filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('❌ Load notifications error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime listener setup
  useEffect(() => {
    loadNotifications();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Realtime subscription
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            console.log('📬 New notification:', newNotification);

            // Başa ekle
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    });
  }, [loadNotifications]);

  // Bildirim okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Local state update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ Mark as read error:', err);
    }
  }, []);

  // Tümünü okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Local state update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('❌ Mark all as read error:', err);
    }
  }, []);

  // Bildirim sil
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('❌ Delete notification error:', err);
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
```

### useSendNotification Hook (Admin)

```typescript
// hooks/useSendNotification.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SendNotificationPayload {
  type: 'single' | 'bulk' | 'scheduled';
  recipient_ids?: string[]; // single/bulk için
  recipient_segment?: string; // bulk için (all, creators, vb)
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduled_at?: string; // scheduled için
}

export function useSendNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendNotification = useCallback(
    async (payload: SendNotificationPayload) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Edge Function'ı çağır
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send notification');
        }

        const data = await response.json();
        console.log('✅ Notification sent:', data);
        setSuccess(true);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send notification';
        console.error('❌ Send notification error:', message);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { sendNotification, loading, error, success };
}
```

## 5. API Routes

### Send Notification Endpoint

```typescript
// app/api/notifications/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Auth kontrol et (admin olmalı)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    // Payload validasyonu
    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { message: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Notification kaydını oluştur
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: payload.recipient_ids?.[0],
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      data,
    });
  } catch (error) {
    console.error('❌ Send notification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 6. Components

### NotificationCenter Component

```typescript
// components/notifications/NotificationCenter.tsx

'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div className="notification-center">
      {/* Bell Icon with Badge */}
      <div className="relative">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notification List */}
      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
          >
            <div className="flex-1">
              <h4>{notification.title}</h4>
              <p>{notification.body}</p>
              <time>{new Date(notification.created_at).toLocaleString()}</time>
            </div>

            <div className="actions">
              {!notification.read && (
                <button onClick={() => markAsRead(notification.id)}>
                  Mark as read
                </button>
              )}
              <button onClick={() => deleteNotification(notification.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {unreadCount > 0 && (
        <button onClick={markAllAsRead} className="mark-all-btn">
          Mark all as read
        </button>
      )}
    </div>
  );
}
```

## 7. Middleware (Auth Check)

```typescript
// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

## 8. Layout Setup

```typescript
// app/layout.tsx

import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <header>
          <NotificationCenter />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## Sonraki Adımlar

1. ✅ Supabase client setup
2. ✅ Hooks oluştur
3. ✅ API routes oluştur
4. ✅ Components oluştur
5. ✅ /ops admin panel oluştur
