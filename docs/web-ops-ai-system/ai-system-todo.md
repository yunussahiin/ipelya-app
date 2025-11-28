# Web Ops AI System - Implementation TODO

> **Oluşturulma:** 2025-11-28
> **Son Güncelleme:** 2025-11-28
> **Durum:** Aktif Geliştirme

---

## Phase 1: Foundation (MVP)

### 1.1 Database Migration
- [x] `ai_settings` tablosu tasarımı
- [x] `ai_chat_logs` tablosu tasarımı
- [ ] Migration dosyası oluştur
- [ ] Varsayılan ayarları ekle
- [ ] RLS policies ekle

**Dosyalar:**
- `supabase/migrations/YYYYMMDD_ai_system_tables.sql`

### 1.2 Package Installation
- [ ] `ai` (Vercel AI SDK) kurulumu
- [ ] `@ai-sdk/react` kurulumu
- [ ] `@openrouter/ai-sdk-provider` kurulumu
- [ ] `zod` (zaten mevcut, kontrol et)

**Komut:**
```bash
cd apps/web && pnpm add ai @ai-sdk/react @openrouter/ai-sdk-provider
```

### 1.3 OpenRouter Client Setup
- [ ] `lib/ai/openrouter.ts` - OpenRouter client oluştur
- [ ] `lib/ai/prompts.ts` - System prompt presets
- [ ] `lib/ai/tools.ts` - Tool definitions
- [ ] `lib/ai/types.ts` - TypeScript types

**Dosyalar:**
```
apps/web/lib/ai/
├── openrouter.ts
├── prompts.ts
├── tools.ts
└── types.ts
```

### 1.4 Chat API Route
- [ ] `/api/ops/ai/chat/route.ts` - Streaming chat endpoint
- [ ] Admin authentication kontrolü
- [ ] Tool calling entegrasyonu
- [ ] Error handling
- [ ] Logging

**Dosya:** `apps/web/app/api/ops/ai/chat/route.ts`

### 1.5 Basic Chat UI
- [ ] `AIChatContainer.tsx` - Ana container component
- [ ] `AIChatMessages.tsx` - Mesaj listesi
- [ ] `AIChatInput.tsx` - Input component
- [ ] `AIChatMessage.tsx` - Tek mesaj component
- [ ] `AIChatToolResult.tsx` - Tool sonuç gösterimi
- [ ] AI Chat sayfası (`/ops/ai`)

**Dosyalar:**
```
apps/web/components/ops/ai/
├── index.ts
├── AIChatContainer.tsx
├── AIChatMessages.tsx
├── AIChatInput.tsx
├── AIChatMessage.tsx
└── AIChatToolResult.tsx

apps/web/app/ops/(private)/ai/
└── page.tsx
```

### 1.6 Basic Tools
- [ ] `lookupUser` - Kullanıcı sorgulama
- [ ] `getRecentPosts` - Son postları getir
- [ ] `getSystemStats` - Platform istatistikleri

---

## Phase 2: Settings & Logs

### 2.1 Settings API
- [ ] `GET /api/ops/ai/settings` - Ayarları getir
- [ ] `POST /api/ops/ai/settings` - Ayarları güncelle
- [ ] Validation (Zod schema)

**Dosya:** `apps/web/app/api/ops/ai/settings/route.ts`

### 2.2 Settings UI
- [ ] `AISettingsForm.tsx` - Ana form component
- [ ] `AIModelSelector.tsx` - Model seçici
- [ ] `AIPromptEditor.tsx` - System prompt editörü
- [ ] `AIToolPermissions.tsx` - Tool izinleri
- [ ] Settings sayfası (`/ops/ai/settings`)

**Dosyalar:**
```
apps/web/components/ops/ai/settings/
├── index.ts
├── AISettingsForm.tsx
├── AIModelSelector.tsx
├── AIPromptEditor.tsx
└── AIToolPermissions.tsx

apps/web/app/ops/(private)/ai/settings/
└── page.tsx
```

### 2.3 Logs API
- [ ] `GET /api/ops/ai/logs` - Logları getir
- [ ] Pagination desteği
- [ ] Filtreleme (session, tarih, admin)
- [ ] İstatistikler

**Dosya:** `apps/web/app/api/ops/ai/logs/route.ts`

### 2.4 Logs UI
- [ ] `AILogsTable.tsx` - Log tablosu
- [ ] `AILogsStats.tsx` - İstatistik kartları
- [ ] `AILogDetail.tsx` - Log detay modal
- [ ] Logs sayfası (`/ops/ai/logs`)

**Dosyalar:**
```
apps/web/components/ops/ai/logs/
├── index.ts
├── AILogsTable.tsx
├── AILogsStats.tsx
└── AILogDetail.tsx

apps/web/app/ops/(private)/ai/logs/
└── page.tsx
```

---

## Phase 3: Advanced Features

### 3.1 Advanced Tools
- [ ] `searchUsers` - Kullanıcı arama (çoklu sonuç)
- [ ] `getPostDetails` - Post detayları
- [ ] `getModerationQueue` - Moderasyon kuyruğu
- [ ] `getContentStats` - İçerik istatistikleri
- [ ] `getUserActivity` - Kullanıcı aktivite geçmişi

### 3.2 Enhanced UI
- [ ] Code syntax highlighting
- [ ] Markdown rendering
- [ ] Copy to clipboard
- [ ] Export chat history
- [ ] Keyboard shortcuts

### 3.3 Performance & Security
- [ ] Rate limiting implementation
- [ ] Token usage tracking
- [ ] Sensitive data masking
- [ ] Audit logging enhancement

---

## Tamamlanan İşler

### 2025-11-28
- [x] Ana döküman güncellendi (`web-ops-ai-system.md`)
- [x] TODO dosyası oluşturuldu (`ai-system-todo.md`)
- [x] Teknoloji stack belirlendi (Vercel AI SDK + OpenRouter)
- [x] Database şeması tasarlandı

---

## Notlar

### OpenRouter Free Models (Önerilen)
1. `google/gemini-2.0-flash-exp:free` - Hızlı, tool calling destekli
2. `meta-llama/llama-3.3-70b-instruct:free` - Güçlü reasoning
3. `qwen/qwen-2.5-72b-instruct:free` - Çok dilli destek

### Shadcn Components Kullanılacak
- `Card` - Container'lar için
- `Button` - Aksiyonlar
- `Input` / `Textarea` - Form elemanları
- `Select` - Dropdown'lar
- `Switch` - Toggle'lar
- `Table` - Log tablosu
- `Dialog` - Modal'lar
- `Tabs` - Sekme navigasyonu
- `ScrollArea` - Mesaj listesi
- `Skeleton` - Loading states
- `Badge` - Status gösterimi

### CSS Variables (Dark/Light Mode)
```css
/* Kullanılacak renkler */
--background
--foreground
--card
--card-foreground
--muted
--muted-foreground
--primary
--primary-foreground
--border
--input
--ring
```

### API Route Pattern
```typescript
// Standart ops API route pattern
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Admin auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // İşlem...
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Referanslar

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [OpenRouter Provider](https://github.com/openrouterteam/ai-sdk-provider)
- [OpenRouter Models](https://openrouter.ai/models)
- [shadcn/ui](https://ui.shadcn.com)
