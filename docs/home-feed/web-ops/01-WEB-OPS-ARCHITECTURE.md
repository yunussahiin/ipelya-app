# İpelya Home Feed - Web Ops Architecture

## 🏗️ Genel Mimari

Web Ops paneli, Next.js 15 App Router kullanarak geliştirilmiş, admin kullanıcıların feed sistemini yönetmesini sağlayan bir yönetim panelidir.

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Web Ops)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │  API Routes  │      │
│  │  (App Router)│  │  (Shadcn/ui) │  │  (/api/ops)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Packages                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    @types    │  │     @api     │  │    @hooks    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Edge Functions│  │  PostgreSQL  │  │   Realtime   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Klasör Yapısı

### App Router Structure

```typescript
apps/web/
├── app/
│   ├── (auth)/                         // Auth layout group
│   │   ├── layout.tsx                  // Auth layout (logo, form container)
│   │   └── login/
│   │       └── page.tsx                // Login page
│   │
│   ├── (ops)/                          // Ops layout group
│   │   ├── layout.tsx                  // Ops layout (sidebar, header, breadcrumb)
│   │   │
│   │   ├── page.tsx                    // Dashboard (overview)
│   │   │
│   │   ├── content/                    // Content moderation
│   │   │   ├── page.tsx                // Content overview
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx            // Posts moderation
│   │   │   │   └── [postId]/
│   │   │   │       └── page.tsx        // Post detail
│   │   │   ├── mini-posts/
│   │   │   │   └── page.tsx            // Mini posts moderation
│   │   │   ├── voice-moments/
│   │   │   │   └── page.tsx            // Voice moments moderation
│   │   │   └── polls/
│   │   │       └── page.tsx            // Polls moderation
│   │   │
│   │   ├── analytics/                  // Analytics dashboard
│   │   │   ├── page.tsx                // Analytics overview
│   │   │   ├── feed/
│   │   │   │   └── page.tsx            // Feed analytics
│   │   │   ├── users/
│   │   │   │   └── page.tsx            // User analytics
│   │   │   └── content/
│   │   │       └── page.tsx            // Content analytics
│   │   │
│   │   ├── algorithm/                  // Algorithm settings
│   │   │   ├── page.tsx                // Algorithm overview
│   │   │   ├── weights/
│   │   │   │   └── page.tsx            // Scoring weights
│   │   │   ├── vibe/
│   │   │   │   └── page.tsx            // Vibe parameters
│   │   │   └── intent/
│   │   │       └── page.tsx            // Intent parameters
│   │   │
│   │   ├── notifications/              // Notification management
│   │   │   ├── page.tsx                // Notifications overview
│   │   │   ├── send/
│   │   │   │   └── page.tsx            // Send notification
│   │   │   ├── scheduled/
│   │   │   │   └── page.tsx            // Scheduled notifications
│   │   │   ├── templates/
│   │   │   │   └── page.tsx            // Notification templates
│   │   │   └── campaigns/
│   │   │       └── page.tsx            // Campaigns
│   │   │
│   │   ├── users/                      // User management
│   │   │   ├── page.tsx                // Users list
│   │   │   ├── [userId]/
│   │   │   │   └── page.tsx            // User detail
│   │   │   └── sessions/
│   │   │       └── page.tsx            // Active sessions
│   │   │
│   │   └── settings/                   // System settings
│   │       └── page.tsx                // Settings
│   │
│   └── api/                            // API routes
│       └── ops/
│           ├── content/
│           │   ├── posts/
│           │   │   ├── route.ts        // GET /api/ops/content/posts
│           │   │   └── [postId]/
│           │   │       ├── route.ts    // GET/PUT/DELETE /api/ops/content/posts/:id
│           │   │       ├── approve/
│           │   │       │   └── route.ts // POST /api/ops/content/posts/:id/approve
│           │   │       └── reject/
│           │   │           └── route.ts // POST /api/ops/content/posts/:id/reject
│           │   └── reports/
│           │       └── route.ts        // GET /api/ops/content/reports
│           │
│           ├── analytics/
│           │   ├── feed/
│           │   │   └── route.ts        // GET /api/ops/analytics/feed
│           │   ├── users/
│           │   │   └── route.ts        // GET /api/ops/analytics/users
│           │   └── content/
│           │       └── route.ts        // GET /api/ops/analytics/content
│           │
│           ├── algorithm/
│           │   ├── weights/
│           │   │   └── route.ts        // GET/PUT /api/ops/algorithm/weights
│           │   ├── vibe/
│           │   │   └── route.ts        // GET/PUT /api/ops/algorithm/vibe
│           │   └── intent/
│           │       └── route.ts        // GET/PUT /api/ops/algorithm/intent
│           │
│           ├── notifications/
│           │   ├── send/
│           │   │   └── route.ts        // POST /api/ops/notifications/send
│           │   ├── scheduled/
│           │   │   └── route.ts        // GET/POST /api/ops/notifications/scheduled
│           │   └── templates/
│           │       └── route.ts        // GET/POST /api/ops/notifications/templates
│           │
│           └── users/
│               ├── route.ts            // GET /api/ops/users
│               └── [userId]/
│                   ├── route.ts        // GET/PUT /api/ops/users/:id
│                   ├── lock/
│                   │   └── route.ts    // POST /api/ops/users/:id/lock
│                   └── unlock/
│                       └── route.ts    // POST /api/ops/users/:id/unlock
```

---

## 🎨 Component Structure

```typescript
components/
└── ops/
    ├── layout/                         // Layout components
    │   ├── Sidebar/
    │   │   ├── index.tsx               // Sidebar component
    │   │   ├── types.ts                // Sidebar types
    │   │   └── nav-items.ts            // Navigation items config
    │   ├── Header/
    │   │   ├── index.tsx               // Header component
    │   │   └── types.ts
    │   └── Breadcrumb/
    │       ├── index.tsx               // Breadcrumb component
    │       └── types.ts
    │
    ├── content/                        // Content moderation components
    │   ├── PostCard/
    │   │   ├── index.tsx               // Post card for moderation
    │   │   ├── types.ts
    │   │   └── actions.tsx             // Approve/reject actions
    │   ├── ModerationQueue/
    │   │   ├── index.tsx               // Moderation queue list
    │   │   └── types.ts
    │   └── ReportDialog/
    │       ├── index.tsx               // Report details dialog
    │       └── types.ts
    │
    ├── analytics/                      // Analytics components
    │   ├── MetricCard/
    │   │   ├── index.tsx               // Metric display card
    │   │   └── types.ts
    │   ├── LineChart/
    │   │   ├── index.tsx               // Line chart (recharts)
    │   │   └── types.ts
    │   └── BarChart/
    │       ├── index.tsx               // Bar chart (recharts)
    │       └── types.ts
    │
    ├── algorithm/                      // Algorithm settings components
    │   ├── WeightSlider/
    │   │   ├── index.tsx               // Weight adjustment slider
    │   │   └── types.ts
    │   ├── VibeMatrix/
    │   │   ├── index.tsx               // Vibe compatibility matrix
    │   │   └── types.ts
    │   └── IntentMatrix/
    │       ├── index.tsx               // Intent-content matrix
    │       └── types.ts
    │
    ├── notifications/                  // Notification components
    │   ├── NotificationForm/
    │   │   ├── index.tsx               // Send notification form
    │   │   └── types.ts
    │   ├── TemplateCard/
    │   │   ├── index.tsx               // Template card
    │   │   └── types.ts
    │   └── CampaignCard/
    │       ├── index.tsx               // Campaign card
    │       └── types.ts
    │
    ├── users/                          // User management components
    │   ├── UserCard/
    │   │   ├── index.tsx               // User card
    │   │   └── types.ts
    │   ├── SessionCard/
    │   │   ├── index.tsx               // Session card
    │   │   └── types.ts
    │   └── LockDialog/
    │       ├── index.tsx               // Lock user dialog
    │       └── types.ts
    │
    └── shared/                         // Shared components
        ├── DataTable/
        │   ├── index.tsx               // Reusable data table
        │   └── types.ts
        ├── EmptyState/
        │   ├── index.tsx               // Empty state component
        │   └── types.ts
        └── LoadingSpinner/
            ├── index.tsx               // Loading spinner
            └── types.ts
```

---

## 🔐 Authentication & Authorization

### Admin Auth Flow

```typescript
/**
 * Admin Authentication Middleware
 * 
 * Amaç: Ops panel'e erişimi kontrol eder
 * 
 * Kontroller:
 * - Supabase auth token var mı?
 * - User admin_profiles tablosunda mı?
 * - is_active = true mı?
 * - Role yeterli mi?
 */

// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Supabase client oluştur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Admin check
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();
  
  if (!adminProfile) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/ops/:path*'],
};
```

### Role-Based Access Control (RBAC)

```typescript
/**
 * Permission Check Hook
 * 
 * Amaç: Component seviyesinde permission kontrolü
 * 
 * Kullanım:
 * const { hasPermission } = usePermissions();
 * if (hasPermission('content:moderate')) { ... }
 */

type Permission =
  | 'content:read'
  | 'content:moderate'
  | 'users:read'
  | 'users:manage'
  | 'analytics:read'
  | 'algorithm:read'
  | 'algorithm:update'
  | 'notifications:send';

type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'analyst';

const rolePermissions: Record<AdminRole, Permission[]> = {
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

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    
    const permissions = rolePermissions[user.role as AdminRole];
    
    // Super admin has all permissions
    if (permissions.includes('*')) return true;
    
    return permissions.includes(permission);
  };
  
  return { hasPermission };
};
```

---

## 🔄 State Management

### Zustand Stores

```typescript
/**
 * Ops Store
 * 
 * Amaç: Ops panel global state yönetimi
 * 
 * State:
 * - selectedContent: Seçili içerikler (bulk actions için)
 * - filters: Aktif filtreler
 * - view: Grid/list view
 */

// stores/ops.store.ts
import { create } from 'zustand';

interface OpsState {
  // Content moderation
  selectedContent: string[];
  setSelectedContent: (ids: string[]) => void;
  toggleContentSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Filters
  filters: {
    status?: 'pending' | 'approved' | 'rejected';
    contentType?: 'post' | 'mini_post' | 'voice_moment' | 'poll';
    dateRange?: [Date, Date];
  };
  setFilters: (filters: Partial<OpsState['filters']>) => void;
  clearFilters: () => void;
  
  // View
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
}

export const useOpsStore = create<OpsState>((set) => ({
  selectedContent: [],
  setSelectedContent: (ids) => set({ selectedContent: ids }),
  toggleContentSelection: (id) =>
    set((state) => ({
      selectedContent: state.selectedContent.includes(id)
        ? state.selectedContent.filter((i) => i !== id)
        : [...state.selectedContent, id],
    })),
  clearSelection: () => set({ selectedContent: [] }),
  
  filters: {},
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  
  view: 'grid',
  setView: (view) => set({ view }),
}));
```

---

## 📡 API Client

```typescript
/**
 * Ops API Client
 * 
 * Amaç: Ops API endpoints için type-safe client
 * 
 * Özellikler:
 * - Type-safe requests
 * - Error handling
 * - Loading states
 * - React Query integration
 */

// lib/ops/api.ts
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

class OpsApiClient {
  private supabase = createBrowserSupabaseClient();
  
  // Content endpoints
  async getContent(params: GetContentParams) {
    const response = await fetch('/api/ops/content/posts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) throw new Error('Failed to fetch content');
    
    return response.json();
  }
  
  async approveContent(postId: string) {
    const response = await fetch(`/api/ops/content/posts/${postId}/approve`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to approve content');
    
    return response.json();
  }
  
  // Analytics endpoints
  async getFeedAnalytics(params: AnalyticsParams) {
    const response = await fetch('/api/ops/analytics/feed', {
      method: 'GET',
    });
    
    if (!response.ok) throw new Error('Failed to fetch analytics');
    
    return response.json();
  }
  
  // Algorithm endpoints
  async updateWeights(weights: AlgorithmWeights) {
    const response = await fetch('/api/ops/algorithm/weights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    
    if (!response.ok) throw new Error('Failed to update weights');
    
    return response.json();
  }
  
  // Notification endpoints
  async sendBulkNotification(data: BulkNotificationData) {
    const response = await fetch('/api/ops/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to send notification');
    
    return response.json();
  }
  
  // User endpoints
  async lockUser(userId: string, duration: number) {
    const response = await fetch(`/api/ops/users/${userId}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
    
    if (!response.ok) throw new Error('Failed to lock user');
    
    return response.json();
  }
}

export const opsApi = new OpsApiClient();
```

---

## 🎯 Performance Optimization

### Server Components vs Client Components

```typescript
// Server Component (default)
// - Data fetching
// - No interactivity
// - SEO friendly

// app/(ops)/content/page.tsx
export default async function ContentPage() {
  // Server-side data fetching
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Content Moderation</h1>
      <PostList posts={posts} />
    </div>
  );
}

// Client Component
// - Interactivity
// - State management
// - Event handlers

// components/ops/content/PostList/index.tsx
'use client';

export const PostList = ({ posts }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  
  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          selected={selected.includes(post.id)}
          onSelect={() => setSelected([...selected, post.id])}
        />
      ))}
    </div>
  );
};
```

### React Query Integration

```typescript
/**
 * Ops Queries
 * 
 * Amaç: React Query hooks for ops data
 * 
 * Özellikler:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 */

// hooks/ops/useContent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '@/lib/ops/api';

export const useContent = (params: GetContentParams) => {
  return useQuery({
    queryKey: ['ops', 'content', params],
    queryFn: () => opsApi.getContent(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useApproveContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => opsApi.approveContent(postId),
    onSuccess: () => {
      // Invalidate content queries
      queryClient.invalidateQueries({ queryKey: ['ops', 'content'] });
    },
  });
};
```

---

**Son Güncelleme:** 2025-11-24 04:15 UTC+03:00
**Durum:** Tamamlandı ✅
