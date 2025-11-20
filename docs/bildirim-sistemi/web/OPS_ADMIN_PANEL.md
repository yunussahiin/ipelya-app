# /ops Admin Panel - Bildirim Yönetimi 🎛️

## Genel Bakış

`/ops` admin paneli, yöneticilerin **toplu**, **zamanlanmış** ve **kişiye özel** bildirimler göndermesini sağlar.

## 1. Admin Panel Yapısı

```
/ops/
├── /notifications
│   ├── page.tsx (Ana sayfa)
│   ├── /send
│   │   ├── page.tsx (Bildirim gönder)
│   │   ├── components/
│   │   │   ├── SingleNotification.tsx
│   │   │   ├── BulkNotification.tsx
│   │   │   ├── ScheduledNotification.tsx
│   │   │   └── NotificationPreview.tsx
│   │   └── hooks/
│   │       └── useSendNotification.ts
│   ├── /history
│   │   ├── page.tsx (Gönderilen bildirimler)
│   │   └── components/
│   │       └── NotificationHistory.tsx
│   └── /templates
│       ├── page.tsx (Şablonlar)
│       └── components/
│           ├── TemplateList.tsx
│           └── TemplateEditor.tsx
```

## 2. Bildirim Gönderme Tipleri

### 2.1 Kişiye Özel Bildirim (Single)

```typescript
// Tek bir kullanıcıya bildirim

{
  type: "single",
  recipient_id: "user_id",
  title: "Özel Bildirim",
  body: "Bu sadece sana özel",
  data: {
    action: "profile_visit",
    user_id: "admin_id"
  }
}
```

**Use Case:**
- Kullanıcıya özel mesaj
- Account activity
- Security alerts

### 2.2 Toplu Bildirim (Bulk)

```typescript
// Segmente göre toplu bildirim

{
  type: "bulk",
  recipient_segment: "all", // all | creators | premium | inactive
  title: "Duyuru",
  body: "Tüm kullanıcılara gönderilen bildirim",
  data: {
    announcement_id: "ann_123"
  },
  filter: {
    created_after: "2025-01-01",
    is_creator: true,
    is_active: true
  }
}
```

**Segmentler:**
- `all` - Tüm kullanıcılar
- `creators` - Creator'lar
- `premium` - Premium üyeler
- `inactive` - İnaktif kullanıcılar (30+ gün)
- `custom` - Custom filter

### 2.3 Zamanlanmış Bildirim (Scheduled)

```typescript
// Belirli bir zamanda gönderilecek bildirim

{
  type: "scheduled",
  recipient_segment: "all",
  title: "Bakım Bildirimi",
  body: "Sistem bakımı başlıyor",
  data: {
    maintenance_start: "2025-11-20T22:00:00Z",
    maintenance_end: "2025-11-20T23:00:00Z"
  },
  scheduled_at: "2025-11-20T21:30:00Z" // 30 dakika önceden
}
```

## 3. Database Schema (Admin)

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

## 4. Admin Components

### SingleNotification Component

```typescript
// app/ops/notifications/send/components/SingleNotification.tsx

'use client';

import { useState } from 'react';
import { useSendNotification } from '@/hooks/useSendNotification';

export function SingleNotification() {
  const [formData, setFormData] = useState({
    recipient_id: '',
    title: '',
    body: '',
    data: {},
  });

  const { sendNotification, loading, error } = useSendNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendNotification({
        type: 'single',
        recipient_ids: [formData.recipient_id],
        title: formData.title,
        body: formData.body,
        data: formData.data,
      });

      alert('✅ Bildirim gönderildi');
      setFormData({ recipient_id: '', title: '', body: '', data: {} });
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Kullanıcı ID</label>
        <input
          type="text"
          value={formData.recipient_id}
          onChange={(e) =>
            setFormData({ ...formData, recipient_id: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>Başlık</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>İçerik</label>
        <textarea
          value={formData.body}
          onChange={(e) =>
            setFormData({ ...formData, body: e.target.value })
          }
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
```

### BulkNotification Component

```typescript
// app/ops/notifications/send/components/BulkNotification.tsx

'use client';

import { useState } from 'react';
import { useSendNotification } from '@/hooks/useSendNotification';

export function BulkNotification() {
  const [formData, setFormData] = useState({
    recipient_segment: 'all',
    title: '',
    body: '',
    filter: {
      is_creator: false,
      is_active: true,
      created_after: '',
    },
  });

  const { sendNotification, loading, error } = useSendNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendNotification({
        type: 'bulk',
        recipient_segment: formData.recipient_segment,
        title: formData.title,
        body: formData.body,
        data: { bulk_campaign: true },
      });

      alert('✅ Toplu bildirim gönderildi');
      setFormData({
        recipient_segment: 'all',
        title: '',
        body: '',
        filter: { is_creator: false, is_active: true, created_after: '' },
      });
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Segment</label>
        <select
          value={formData.recipient_segment}
          onChange={(e) =>
            setFormData({ ...formData, recipient_segment: e.target.value })
          }
        >
          <option value="all">Tüm Kullanıcılar</option>
          <option value="creators">Creator'lar</option>
          <option value="premium">Premium Üyeler</option>
          <option value="inactive">İnaktif Kullanıcılar</option>
        </select>
      </div>

      <div>
        <label>Başlık</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>İçerik</label>
        <textarea
          value={formData.body}
          onChange={(e) =>
            setFormData({ ...formData, body: e.target.value })
          }
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Gönderiliyor...' : 'Toplu Gönder'}
      </button>
    </form>
  );
}
```

### ScheduledNotification Component

```typescript
// app/ops/notifications/send/components/ScheduledNotification.tsx

'use client';

import { useState } from 'react';
import { useSendNotification } from '@/hooks/useSendNotification';

export function ScheduledNotification() {
  const [formData, setFormData] = useState({
    recipient_segment: 'all',
    title: '',
    body: '',
    scheduled_at: '',
  });

  const { sendNotification, loading, error } = useSendNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendNotification({
        type: 'scheduled',
        recipient_segment: formData.recipient_segment,
        title: formData.title,
        body: formData.body,
        scheduled_at: formData.scheduled_at,
      });

      alert('✅ Zamanlanmış bildirim oluşturuldu');
      setFormData({
        recipient_segment: 'all',
        title: '',
        body: '',
        scheduled_at: '',
      });
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Segment</label>
        <select
          value={formData.recipient_segment}
          onChange={(e) =>
            setFormData({ ...formData, recipient_segment: e.target.value })
          }
        >
          <option value="all">Tüm Kullanıcılar</option>
          <option value="creators">Creator'lar</option>
          <option value="premium">Premium Üyeler</option>
        </select>
      </div>

      <div>
        <label>Başlık</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>İçerik</label>
        <textarea
          value={formData.body}
          onChange={(e) =>
            setFormData({ ...formData, body: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label>Gönderim Zamanı</label>
        <input
          type="datetime-local"
          value={formData.scheduled_at}
          onChange={(e) =>
            setFormData({ ...formData, scheduled_at: e.target.value })
          }
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Zamanlanıyor...' : 'Zamanla'}
      </button>
    </form>
  );
}
```

## 5. Ana Sayfa

```typescript
// app/ops/notifications/page.tsx

'use client';

import { useState } from 'react';
import { SingleNotification } from './send/components/SingleNotification';
import { BulkNotification } from './send/components/BulkNotification';
import { ScheduledNotification } from './send/components/ScheduledNotification';
import { NotificationHistory } from './history/components/NotificationHistory';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [sendType, setSendType] = useState<'single' | 'bulk' | 'scheduled'>('single');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📬 Bildirim Yönetimi</h1>

      <div className="tabs mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={activeTab === 'send' ? 'active' : ''}
        >
          Bildirim Gönder
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={activeTab === 'history' ? 'active' : ''}
        >
          Geçmiş
        </button>
      </div>

      {activeTab === 'send' && (
        <div>
          <div className="send-type-selector mb-6">
            <button
              onClick={() => setSendType('single')}
              className={sendType === 'single' ? 'active' : ''}
            >
              👤 Kişiye Özel
            </button>
            <button
              onClick={() => setSendType('bulk')}
              className={sendType === 'bulk' ? 'active' : ''}
            >
              👥 Toplu
            </button>
            <button
              onClick={() => setSendType('scheduled')}
              className={sendType === 'scheduled' ? 'active' : ''}
            >
              ⏰ Zamanlanmış
            </button>
          </div>

          <div className="form-container">
            {sendType === 'single' && <SingleNotification />}
            {sendType === 'bulk' && <BulkNotification />}
            {sendType === 'scheduled' && <ScheduledNotification />}
          </div>
        </div>
      )}

      {activeTab === 'history' && <NotificationHistory />}
    </div>
  );
}
```

## 6. Edge Function (Gönderme)

```typescript
// supabase/functions/send-bulk-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  try {
    const payload = await req.json();

    // 1. Segment'e göre kullanıcıları bul
    let query = supabase.from('profiles').select('user_id');

    if (payload.recipient_segment === 'creators') {
      query = query.eq('is_creator', true);
    } else if (payload.recipient_segment === 'inactive') {
      query = query.lt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    // 2. Bildirim kaydı oluştur
    const campaign = await supabase
      .from('notification_campaigns')
      .insert({
        admin_id: payload.admin_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        recipient_segment: payload.recipient_segment,
        total_recipients: users?.length || 0,
        status: 'sent',
      })
      .select()
      .single();

    if (campaign.error) throw campaign.error;

    // 3. Tüm kullanıcılara bildirim gönder
    const notifications = (users || []).map((user) => ({
      recipient_id: user.user_id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.data.id,
        sent_count: users?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## 7. RLS Policies (Admin)

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

## 8. Cron Job (Zamanlanmış Bildirimler)

```typescript
// supabase/functions/process-scheduled-notifications/index.ts

// Her dakika çalışan cron job
// Zamanlanmış bildirimler gönder

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  try {
    // 1. Zamanı gelmiş bildirimler bul
    const { data: campaigns, error } = await supabase
      .from('notification_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;

    // 2. Her campaign'i gönder
    for (const campaign of campaigns || []) {
      // Segment'e göre kullanıcıları bul
      let query = supabase.from('profiles').select('user_id');

      if (campaign.recipient_segment === 'creators') {
        query = query.eq('is_creator', true);
      }

      const { data: users } = await query;

      // Bildirimler oluştur
      const notifications = (users || []).map((user) => ({
        recipient_id: user.user_id,
        type: campaign.type,
        title: campaign.title,
        body: campaign.body,
        data: campaign.data,
      }));

      await supabase.from('notifications').insert(notifications);

      // Campaign'i sent olarak işaretle
      await supabase
        .from('notification_campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaign.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: campaigns?.length || 0 }),
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

## Sonraki Adımlar

1. ✅ Database schema oluştur
2. ✅ Admin components oluştur
3. ✅ Edge Functions deploy et
4. ✅ Cron job setup et
5. ✅ Notification history oluştur
6. ✅ Analytics dashboard oluştur
