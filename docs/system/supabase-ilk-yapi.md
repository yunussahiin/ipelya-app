---
title: Supabase İlk Yapı
description: Next.js web + Expo mobil istemcileri için Supabase anahtar yapısı, ortam değişkenleri ve JWT imzalama rehberi
---

# Supabase Başlangıç Rehberi

## 1. Anahtar Tipleri ve Kullanım Yerleri
| Anahtar                                                                                                                | Nerede Kullanılır                                  | Not                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Publishable Key** `sb_publishable_cz_MqTpk-aRDtVWkhKcR9g_wJW1xh2s`                                                   | Browser, Expo, Desktop istemciler                  | RLS aktif tablolar için güvenli, anon key yerine bunu tercih et.                                        |
| **Anon Key (Legacy)**                                                                                                  | Eski JS SDK örnekleri                              | Publishable key geldikten sonra anon key’i sadece geriye dönük durumlarda kullan.                       |
| **Secret Key** `sb_secret_mfxfml155gPLzWD07C_qvg_8pBtGFqU`                                                             | Edge Functions, Next.js server actions, script’ler | Hiçbir zaman istemciye sızdırma. `.env` içinde sadece sunucu tarafında kullan.                          |
| **JWT Signing Keys** (Standby `a3b53128-f98c-42df-bf49-e0c422d8675b` / Current `4dde6218-d4ed-4a6b-8a9b-3c3b9e1968ce`) | Custom token üretimi, backend doğrulama            | ES256 standby anahtarını aktif etmeden önce tüm servislerin JWKS endpoint’ini okuyabildiğinden emin ol. |

> Not: Publishable key’i almak için Supabase Project Settings → API → “Publishable key” alanını kullan. Secret key (service_role) aynı ekranda “Reveal” ile görüntülenir. JWKS için `https://ojkyisyjsbgbfytrmmlz.supabase.co/auth/v1/.well-known/jwks.json` endpoint’ini izle.

## 2. Next.js (apps/web) Kurulumu

### 2.1 Ortam Değişkenleri (`apps/web/.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ojkyisyjsbgbfytrmmlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_cz_MqTpk-aRDtVWkhKcR9g_wJW1xh2s
SUPABASE_SERVICE_ROLE_KEY=sb_secret_mfxfml155gPLzWD07C_qvg_8pBtGFqU
SUPABASE_JWT_SECRET=<legacy HS256 secret, sadece doğrulama gerekiyorsa>
```
> ✅ Bu dosya depo içinde oluşturuldu: `apps/web/.env.local`.

### 2.2 Server Component Client (`apps/web/lib/supabase/server.ts`)
```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabaseClient(cookieStore = cookies()) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component context; middleware token yenilemesi devreye girer.
        }
      }
    }
  });
}
```

> ✅ Dosya eklendi: `apps/web/lib/supabase/server.ts`.

### 2.3 Browser Client (`apps/web/lib/supabase/browser.ts`)
```ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createBrowserSupabaseClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
```

> ✅ Dosya eklendi: `apps/web/lib/supabase/browser.ts`.

### 2.4 Middleware (`apps/web/middleware.ts`)
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      }
    }
  });

  return res;
}
```

### 2.5 Server Actions / Edge Functions
- Secret key sadece Node ortamında (`process.env.SUPABASE_SERVICE_ROLE_KEY`) kullanılmalı.
- Örn. `apps/web/app/api/stripe/webhook/route.ts` içinde Supabase Admin client oluştururken service key’i kullan.

## 3. Expo Mobil Kurulumu (apps/mobile)

### 3.1 Ortam Değişkenleri (`apps/mobile/.env` veya `app.config.ts`)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://ojkyisyjsbgbfytrmmlz.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_cz_MqTpk-aRDtVWkhKcR9g_wJW1xh2s
```
- Expo, `EXPO_PUBLIC_` prefix’i ile başlayan değişkenleri Metro bundle’a dahil eder.
- Publishable key RLS sayesinde güvenli; secret key asla Expo tarafına eklenmemeli.
> ✅ `apps/mobile/.env` oluşturuldu ve publishable key yazıldı.

### 3.2 Supabase Client (`apps/mobile/src/lib/supabaseClient.ts`)
```ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock
  }
});
```
> ✅ `@react-native-async-storage/async-storage` bağımlılığı `pnpm add` ile kuruldu ve client dosyası güncellendi.

### 3.3 SecureStore Senaryosu
- Shadow PIN, refresh token gibi gizli veriler `expo-secure-store` ile tutulacak.
- Supabase SDK zaten AsyncStorage bazlı session saklıyor; ek gizli alanlar için SecureStore kullanılır.

## 4. JWT Signing Key'leri
1. **Standby ES256 anahtarı** (P-256 curve) → Supabase panelinden aktif edildiğinde yeni JWT’ler ES256 ile imzalanacak.
2. **Legacy HS256 secret** hala mevcut; custom backend’ler bu secret’e göre verify ediyorsa, JWKS endpoint’inden yeni public key’leri okuyacak şekilde güncelle.
3. Kendi backend’inde token üretmen gerekiyorsa (örneğin service-to-service):
   ```json
   Header: { "alg": "ES256", "kid": "a3b53128-f98c-42df-bf49-e0c422d8675b", "typ": "JWT" }
   ```
4. JWKS cache süresi ~20 dk olduğundan kritik rota değişikliklerinde cache busting yap.

## 5. Güvenlik ve Deploy Notları
- Publishable key + RLS → istemcide güvenli kullanım.
- Secret key sadece backend/Edge Function katmanlarında.
- Supabase CLI ile `supabase secrets set --env-file .env` kullanarak prod edge fonksiyonlarına anahtarları aktar.
- .gitignore içinde `.env*` dosyalarının olduğundan emin ol.

---
Bu doküman Supabase’den alınan yeni anahtar yapısını Next.js ve Expo istemcileri üzerinde nasıl uygulayacağımızı özetler; değişiklik yaptıkça `docs/todo.md` üzerindeki ilgili maddeleri işaretlemeyi unutma.
