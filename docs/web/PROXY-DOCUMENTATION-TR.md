# Next.js Proxy Dokümantasyonu (Türkçe)

> **Not:** `middleware` dosya kuralı kullanımdan kaldırılmıştır ve `proxy` olarak yeniden adlandırılmıştır.

## Proxy Nedir?

`proxy.ts` (veya `.js`) dosyası, bir istek tamamlanmadan önce sunucu tarafında kod çalıştırmak için kullanılır. Gelen isteğe göre yanıtı değiştirebilir, yeniden yazabilir, yönlendirebilir, başlıkları değiştirebilir veya doğrudan yanıt verebilirsiniz.

**Proxy'nin Avantajları:**
- Rotalar render edilmeden önce çalışır
- Özel sunucu tarafı mantığı uygulamak için idealdir (kimlik doğrulama, günlüğe kaydetme, yönlendirmeler)
- CDN'de deploy edilebilir (hızlı yönlendirme/yeniden yazma işlemi)

---

## Kurulum

Proje kökünde veya `src` klasörü içinde `proxy.ts` dosyası oluşturun (sayfalar veya uygulama klasörü ile aynı seviyede):

```typescript
// proxy.ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL("/home", request.url));
}

export const config = {
  matcher: "/about/:path*",
};
```

---

## Temel Kavramlar

### 1. **Proxy Fonksiyonu**

Dosya, `proxy` adında bir fonksiyon export etmelidir:

```typescript
export function proxy(request: NextRequest) {
  // Proxy mantığı buraya gelir
}
```

Veya varsayılan export olarak:

```typescript
export default function proxy(request: NextRequest) {
  // Proxy mantığı buraya gelir
}
```

### 2. **Config Nesnesi (Opsiyonel)**

Proxy'nin hangi rotalar üzerinde çalışacağını belirtir:

```typescript
export const config = {
  matcher: "/about/:path*",
};
```

---

## Matcher (Rota Eşleştirme)

### Basit Eşleştirme

**Tek rota:**
```typescript
export const config = {
  matcher: "/about",
};
```

**Birden fazla rota:**
```typescript
export const config = {
  matcher: ["/about", "/contact", "/dashboard"],
};
```

### Dinamik Parametreler

```typescript
export const config = {
  matcher: "/blog/:slug",
};
```

- `/blog/hello` → ✅ Eşleşir
- `/blog/hello/world` → ❌ Eşleşmez

### Joker Karakterler

```typescript
export const config = {
  matcher: "/blog/:path*",
};
```

- `*` = Sıfır veya daha fazla
- `?` = Sıfır veya bir
- `+` = Bir veya daha fazla

Örnek:
```typescript
"/blog/:path*"  // /blog, /blog/a, /blog/a/b/c hepsini eşleştirir
"/api/:path+"   // /api/users, /api/users/123 (en az bir segment gerekli)
"/files/:path?" // /files, /files/document hepsini eşleştirir
```

### Regex ile Eşleştirme

API rotalarını hariç tut:
```typescript
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## NextRequest ve NextResponse

### NextRequest

Gelen HTTP isteğini temsil eder:

```typescript
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const headers = request.headers;
  const cookies = request.cookies;
  
  return NextResponse.next();
}
```

### NextResponse

Yanıtı değiştirmek için kullanılır:

```typescript
const response = NextResponse.next();

// Başlık ekle
response.headers.set("X-Custom-Header", "value");

// Cookie ekle
response.cookies.set("name", "value");

// Yönlendir
return NextResponse.redirect(new URL("/new-path", request.url));

// Yeniden yaz
return NextResponse.rewrite(new URL("/internal-path", request.url));
```

---

## Pratik Örnekler

### 1. Koşullu Yönlendirme

```typescript
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Eski rotaları yeni rotalara yönlendir
  if (pathname.startsWith("/old-page")) {
    return NextResponse.redirect(new URL("/new-page", request.url));
  }

  // Dashboard'a gelen istekleri dashboard/overview'e yönlendir
  if (pathname === "/dashboard") {
    return NextResponse.rewrite(new URL("/dashboard/overview", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/old-page/:path*", "/dashboard"],
};
```

### 2. Başlık Yönetimi

```typescript
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  
  // İstek başlıklarına ekle
  requestHeaders.set("x-request-id", crypto.randomUUID());
  requestHeaders.set("x-forwarded-for", request.ip || "");

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Yanıt başlıklarına ekle
  response.headers.set("X-Request-ID", requestHeaders.get("x-request-id")!);
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  return response;
}
```

### 3. Cookie Yönetimi

```typescript
export function proxy(request: NextRequest) {
  // Cookie'yi oku
  const token = request.cookies.get("auth-token");
  
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  
  // Yanıta cookie ekle
  response.cookies.set("session-id", "new-value", {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 gün
  });

  return response;
}
```

### 4. Güvenlik Başlıkları

```typescript
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // XSS koruması
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // İçerik türü değiştirilmesini engelle
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Clickjacking koruması
  response.headers.set("X-Frame-Options", "DENY");
  
  // Referrer politikası
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
```

### 5. Kimlik Doğrulama Kontrolü

```typescript
export function proxy(request: NextRequest) {
  // Sadece /ops rotaları için kontrol et
  if (request.nextUrl.pathname.startsWith("/ops")) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Yetkisiz erişim" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/ops/:path*",
};
```

### 6. CORS Başlıkları

```typescript
const allowedOrigins = [
  "https://example.com",
  "https://app.example.com",
];

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Preflight isteği (OPTIONS)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
        ...corsOptions,
      },
    });
  }

  // Normal istek
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
```

### 7. İstek Günlüğü (Analitik)

```typescript
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const start = Date.now();
  const pathname = req.nextUrl.pathname;

  // Arka planda analitik gönder
  event.waitUntil(
    fetch("https://analytics.example.com", {
      method: "POST",
      body: JSON.stringify({
        pathname,
        method: req.method,
        timestamp: new Date(),
        duration: Date.now() - start,
      }),
    }).catch(() => {}) // Hata olursa sessiz geç
  );

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image).*)",
};
```

### 8. Bakım Modu

```typescript
export function proxy(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

  // API rotaları hariç tut
  if (maintenanceMode && !request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.rewrite(new URL("/maintenance", request.url), {
      status: 503,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image).*)",
};
```

---

## Çalışma Sırası

Proxy aşağıdaki sırada çalışır:

1. `next.config.js` içindeki `headers`
2. `next.config.js` içindeki `redirects`
3. **Proxy** (yeniden yazma, yönlendirme, vb.)
4. `next.config.js` içindeki `beforeFiles` rewrites
5. Dosya sistemi rotaları (`public/`, `_next/static/`, `pages/`, `app/`)
6. `next.config.js` içindeki `afterFiles` rewrites
7. Dinamik rotalar (`/blog/[slug]`)
8. `next.config.js` içindeki `fallback` rewrites

---

## İleri Seviye Özellikler

### waitUntil - Arka Planda İşlem

Proxy'nin ömrünü uzatarak arka planda işlem yapabilirsiniz:

```typescript
export function proxy(req: NextRequest, event: NextFetchEvent) {
  // Yanıtı hemen gönder, arka planda işlem yap
  event.waitUntil(
    fetch("https://logging-service.com", {
      method: "POST",
      body: JSON.stringify({ pathname: req.nextUrl.pathname }),
    })
  );

  return NextResponse.next();
}
```

### Matcher Koşulları

Header, query parametresi veya cookie'ye göre eşleştirme:

```typescript
export const config = {
  matcher: [
    {
      source: "/api/:path*",
      has: [
        { type: "header", key: "Authorization" },
        { type: "query", key: "userId" },
      ],
      missing: [
        { type: "cookie", key: "session" },
      ],
    },
  ],
};
```

---

## Middleware'den Proxy'ye Geçiş

### Eski (Deprecated)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
```

### Yeni (Proxy)
```typescript
// proxy.ts
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

**Otomatik geçiş komutu:**
```bash
npx @next/codemod@canary middleware-to-proxy .
```

---

## Önemli Notlar

⚠️ **Dikkat Edilmesi Gerekenler:**

1. **Matcher değerleri sabit olmalıdır** - Dinamik değişkenler yoksayılır
2. **Shared modules kullanmayın** - Proxy bağımsız çalışır
3. **Büyük başlıklar sorun yaratabilir** - 431 hatası alabilirsiniz
4. **`_next/data` hariç tutulsa bile çalışır** - Güvenlik nedeniyle
5. **Node.js runtime kullanılır** - Edge runtime seçeneği yoktur

---

## Desteklenen Deployment Seçenekleri

| Seçenek          | Destekleniyor      |
| ---------------- | ------------------ |
| Node.js Server   | ✅ Evet             |
| Docker Container | ✅ Evet             |
| Static Export    | ❌ Hayır            |
| Adapters         | 🔄 Platform'a bağlı |

---

## Sürüm Tarihi

| Sürüm   | Değişiklikler                            |
| ------- | ---------------------------------------- |
| v16.0.0 | Middleware deprecated, Proxy adı verildi |
| v15.5.0 | Node.js runtime desteği (stable)         |
| v13.1.0 | İleri seviye Proxy flags                 |
| v13.0.0 | Başlık ve yanıt değiştirme desteği       |
| v12.2.0 | Middleware stable                        |

---

## Kaynaklar

- [NextRequest API Referansı](/docs/app/api-reference/functions/next-request.md)
- [NextResponse API Referansı](/docs/app/api-reference/functions/next-response.md)
- [Next.js Proxy Rehberi](/docs/app/getting-started/proxy.md)
