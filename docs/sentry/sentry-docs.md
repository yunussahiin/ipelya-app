# Sentry Kurulum Rehberi - İPELYA Monorepo

Bu döküman, İPELYA monorepo projesi için Sentry error tracking kurulumunu açıklar.

## Proje Yapısı

```
ipelya-app/
├── apps/
│   ├── mobile/          # React Native Expo (iOS/Android)
│   └── web/             # Next.js (Web Admin Panel)
└── packages/            # Shared packages
```

## Ön Gereksinimler

1. **Sentry Hesabı**: [sentry.io](https://sentry.io) üzerinde hesap oluşturun
2. **Organizasyon**: `ipelya` adında organizasyon oluşturun
3. **Projeler**: İki ayrı proje oluşturun:
   - `ipelya-mobile` (React Native)
   - `ipelya-web` (Next.js)

## Adım 1: Sentry Projelerini Oluşturma

### 1.1 Sentry Dashboard'da:
1. [sentry.io](https://sentry.io) → Settings → Projects → Create Project
2. **Mobile Proje:**
   - Platform: React Native
   - Project Name: `ipelya-mobile`
3. **Web Proje:**
   - Platform: Next.js
   - Project Name: `ipelya-web`

### 1.2 DSN'leri Kaydedin:
Her proje için DSN (Data Source Name) alın:
- Settings → Projects → [Proje] → Client Keys (DSN)

---

## Adım 2: React Native Expo Kurulumu (apps/mobile)

### 2.1 Paket Kurulumu

```bash
cd apps/mobile
npx expo install @sentry/react-native
```

### 2.2 Metro Config Oluşturma

`apps/mobile/metro.config.js` dosyası oluşturun:

```javascript
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = config;
```

### 2.3 app.json Güncelleme

`apps/mobile/app.json` dosyasına Sentry plugin ekleyin:

```json
{
  "expo": {
    "plugins": [
      // ... mevcut pluginler
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "ipelya-mobile",
          "organization": "ipelya"
        }
      ]
    ]
  }
}
```

### 2.4 Environment Variables

`apps/mobile/.env` dosyasına ekleyin:

```env
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
```

`apps/mobile/.env.example` dosyasına ekleyin:

```env
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### 2.5 Sentry Initialization

`apps/mobile/app/_layout.tsx` dosyasını güncelleyin:

```typescript
import { useEffect } from "react";
import { Stack, useNavigationContainerRef } from "expo-router";
import { isRunningInExpoGo } from "expo";
import * as Sentry from "@sentry/react-native";
// ... diğer importlar

// Sentry Navigation Integration
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

// Sentry Initialization
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: __DEV__ ? "development" : "production",
  
  // Tracing
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  
  // Session Replay (Mobile)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.1,
  
  // Integrations
  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration(),
  ],
  
  // Native frames tracking
  enableNativeFramesTracking: !isRunningInExpoGo(),
  
  // Debug mode (only in development)
  debug: __DEV__,
  
  // Disable in Expo Go
  enabled: !isRunningInExpoGo(),
});

function AppStack() {
  const ref = useNavigationContainerRef();
  
  useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);
  
  // ... mevcut kod
}

// Sentry.wrap ile export
export default Sentry.wrap(Layout);
```

### 2.6 User Context Ayarlama

Auth hook'unuzda kullanıcı bilgilerini Sentry'ye gönderin:

```typescript
// useAuth.ts veya auth işlemlerinde
import * as Sentry from "@sentry/react-native";

// Login sonrası
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Logout sonrası
Sentry.setUser(null);
```

---

## Adım 3: Next.js Kurulumu (apps/web)

### 3.1 Wizard ile Otomatik Kurulum (Önerilen)

```bash
cd apps/web
npx @sentry/wizard@latest -i nextjs
```

### 3.2 Manuel Kurulum

#### Paket Kurulumu:

```bash
cd apps/web
pnpm add @sentry/nextjs
```

#### sentry.client.config.ts:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration(),
  ],
  
  // Debug
  debug: process.env.NODE_ENV === "development",
});
```

#### sentry.server.config.ts:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Debug
  debug: process.env.NODE_ENV === "development",
});
```

#### sentry.edge.config.ts:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Debug
  debug: process.env.NODE_ENV === "development",
});
```

#### next.config.ts Güncelleme:

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ... mevcut config
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project
  org: "ipelya",
  project: "ipelya-web",
  
  // Auth token (environment variable)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Source maps
  widenClientFileUpload: true,
  
  // Tunneling (ad-blocker bypass)
  tunnelRoute: "/monitoring",
  
  // Hide source maps from client
  hideSourceMaps: true,
  
  // Disable logger
  disableLogger: true,
  
  // React component names
  reactComponentAnnotation: {
    enabled: true,
  },
});
```

#### instrumentation.ts:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

#### global-error.tsx (App Router):

```typescript
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Bir şeyler yanlış gitti!</h2>
        <button onClick={() => reset()}>Tekrar dene</button>
      </body>
    </html>
  );
}
```

### 3.3 Environment Variables

`apps/web/.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/654321
SENTRY_AUTH_TOKEN=sntrys_xxxxx
```

---

## Adım 4: Source Maps Yapılandırması

### 4.1 Sentry Auth Token Oluşturma

1. Sentry Dashboard → Settings → Auth Tokens
2. "Create New Token" → Scope: `project:releases`, `org:read`
3. Token'ı kaydedin

### 4.2 CI/CD Environment Variables

#### GitHub Actions:

```yaml
env:
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  SENTRY_ORG: ipelya
  SENTRY_PROJECT_MOBILE: ipelya-mobile
  SENTRY_PROJECT_WEB: ipelya-web
```

#### EAS Build (Expo):

```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_xxxxx"
```

---

## Adım 5: Test Etme

### Mobile Test:

```typescript
// Herhangi bir component'te
import * as Sentry from "@sentry/react-native";

<Button
  title="Test Sentry"
  onPress={() => {
    Sentry.captureException(new Error("Test error from mobile"));
  }}
/>
```

### Web Test:

```typescript
// Herhangi bir component'te
import * as Sentry from "@sentry/nextjs";

<button
  onClick={() => {
    throw new Error("Test error from web");
  }}
>
  Test Sentry
</button>
```

---

## Adım 6: Gelişmiş Özellikler

### 6.1 Custom Context

```typescript
Sentry.setContext("subscription", {
  plan: "premium",
  tier: "gold",
});
```

### 6.2 Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: "user-action",
  message: "User clicked purchase button",
  level: "info",
});
```

### 6.3 Performance Monitoring

```typescript
const transaction = Sentry.startTransaction({
  name: "process-payment",
  op: "payment",
});

// ... işlem
transaction.finish();
```

### 6.4 User Feedback

```typescript
// Mobile
Sentry.showReportDialog();

// Web
Sentry.showReportDialog({
  eventId: Sentry.lastEventId(),
});
```

---

## Checklist

### Mobile (apps/mobile):
- [ ] `@sentry/react-native` paketi kuruldu
- [ ] `metro.config.js` oluşturuldu
- [ ] `app.json`'a Sentry plugin eklendi
- [ ] `.env` dosyasına DSN eklendi
- [ ] `_layout.tsx`'te Sentry initialize edildi
- [ ] `Sentry.wrap()` ile root component sarıldı
- [ ] Navigation integration eklendi
- [ ] User context ayarlandı
- [ ] Test error gönderildi ve Sentry'de görüldü

### Web (apps/web):
- [ ] `@sentry/nextjs` paketi kuruldu
- [ ] `sentry.client.config.ts` oluşturuldu
- [ ] `sentry.server.config.ts` oluşturuldu
- [ ] `sentry.edge.config.ts` oluşturuldu
- [ ] `next.config.ts` güncellendi
- [ ] `instrumentation.ts` oluşturuldu
- [ ] `global-error.tsx` oluşturuldu
- [ ] `.env.local` dosyasına DSN ve auth token eklendi
- [ ] Test error gönderildi ve Sentry'de görüldü

### CI/CD:
- [ ] `SENTRY_AUTH_TOKEN` secret olarak eklendi
- [ ] Source maps upload yapılandırıldı
- [ ] Release tracking aktif

---

## Kaynaklar

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Expo Setup](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
