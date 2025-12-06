# 🔴 Kritik Sorunlar

Bu dokümanda acil çözülmesi gereken sorunlar ve çözüm önerileri yer almaktadır.

---

## 1. ActivityIndicator Kullanımı (Skeleton Kuralı İhlali)

### Problem
62 dosyada 117 yerde `ActivityIndicator` kullanılıyor. Proje kurallarına göre loading state'lerde **Skeleton** kullanılmalı.

### Neden Önemli?
- **UX:** Skeleton, içerik yapısını göstererek perceived performance artırır
- **Modern Standart:** Instagram, Twitter, Facebook gibi uygulamalar skeleton kullanır
- **Tutarlılık:** Proje genelinde tutarlı loading deneyimi

### Etkilenen Dosyalar (Top 20)

| Dosya                                                                     | Kullanım Sayısı |
| ------------------------------------------------------------------------- | --------------- |
| `app/(live)/broadcast/_components/ThumbnailPicker.tsx`                    | 3               |
| `app/(profile)/edit.tsx`                                                  | 3               |
| `app/(profile)/shadow-edit.tsx`                                           | 3               |
| `app/(profile)/vibe-preferences.tsx`                                      | 3               |
| `src/components/home-feed/CommentSheet/components/CommentLikersSheet.tsx` | 3               |
| `src/components/home-feed/CreatePostModal/index.tsx`                      | 3               |
| `src/components/home-feed/ShareMenu/index.tsx`                            | 3               |
| `src/components/profile-view/sections/SubscriptionSheet.tsx`              | 3               |
| `app/(auth)/login.tsx`                                                    | 2               |
| `app/(auth)/register.tsx`                                                 | 2               |
| `app/(creator)/kyc/index.tsx`                                             | 2               |
| `app/(notifications)/index.tsx`                                           | 2               |
| `app/(profile)/blocked-users.tsx`                                         | 2               |
| `app/(settings)/notifications.tsx`                                        | 2               |
| `app/index.tsx`                                                           | 2               |
| `src/components/ShadowPinModal.tsx`                                       | 2               |
| `src/components/ShadowToggle.tsx`                                         | 2               |
| `src/components/broadcast/BroadcastChannelScreen/index.tsx`               | 2               |
| `src/components/home-feed/FeedList/index.tsx`                             | 2               |
| `src/components/messaging/ChatScreen/GiftedChatScreen.tsx`                | 2               |

### Çözüm

#### 1. Skeleton Component Oluştur

```typescript
// src/components/ui/Skeleton.tsx
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          opacity
        },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden"
  }
});
```

#### 2. Skeleton Variants

```typescript
// src/components/ui/SkeletonVariants.tsx
import { View, StyleSheet } from "react-native";
import { Skeleton } from "./Skeleton";

// Avatar skeleton
export function AvatarSkeleton({ size = 48 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

// Text line skeleton
export function TextSkeleton({ width = "100%", height = 16 }: { width?: number | string; height?: number }) {
  return <Skeleton width={width} height={height} borderRadius={4} />;
}

// Card skeleton
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AvatarSkeleton />
        <View style={styles.cardHeaderText}>
          <TextSkeleton width={120} />
          <TextSkeleton width={80} height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={200} borderRadius={12} />
      <View style={styles.cardFooter}>
        <TextSkeleton width="80%" />
        <TextSkeleton width="60%" />
      </View>
    </View>
  );
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <AvatarSkeleton />
      <View style={styles.listItemContent}>
        <TextSkeleton width="70%" />
        <TextSkeleton width="40%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 16 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardHeaderText: { gap: 4, flex: 1 },
  cardFooter: { gap: 8 },
  listItem: { flexDirection: "row", gap: 12, alignItems: "center", padding: 12 },
  listItemContent: { flex: 1, gap: 4 }
});
```

#### 3. Migration Örneği

```typescript
// ❌ Önce
import { ActivityIndicator } from "react-native";

if (loading) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#f472b6" />
    </View>
  );
}

// ✅ Sonra
import { CardSkeleton } from "@/components/ui/SkeletonVariants";

if (loading) {
  return (
    <View style={styles.loader}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}
```

### Migration Script

```bash
# Etkilenen dosyaları listele
grep -r "ActivityIndicator" apps/mobile/src --include="*.tsx" -l

# Her dosyayı manuel olarak güncelle
# Skeleton tipini içeriğe göre seç
```

---

## 2. Aşırı Console Log Kullanımı

### Problem
961 console statement 172 dosyada bulunuyor. Production build'de:
- **Performans:** Her log işlem maliyeti
- **Güvenlik:** Hassas bilgi sızıntısı riski
- **Bundle Size:** String'ler bundle'a dahil

### En Çok Etkilenen Dosyalar

| Dosya                     | Log Sayısı |
| ------------------------- | ---------- |
| `VisionCamera.tsx`        | 45         |
| `useOpsRealtime.ts`       | 35         |
| `useLiveKitRoom.ts`       | 32         |
| `useShadowMode.ts`        | 26         |
| `useKYCVerification.ts`   | 25         |
| `useOfflineQueue.ts`      | 23         |
| `useAuthActions.ts`       | 20         |
| `oauth.service.ts`        | 20         |
| `useMessageRealtime.ts`   | 19         |
| `useFollowersRealtime.ts` | 19         |

### Çözüm

#### 1. Logger Utility Oluştur

```typescript
// src/utils/logger.ts
import * as Sentry from "@sentry/react-native";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  tag?: string;
  data?: Record<string, unknown>;
}

class Logger {
  private isDev = __DEV__;

  private formatMessage(level: LogLevel, message: string, tag?: string): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = tag ? `[${tag}]` : "";
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  debug(message: string, options?: LoggerOptions): void {
    if (this.isDev) {
      console.log(this.formatMessage("debug", message, options?.tag), options?.data ?? "");
    }
  }

  info(message: string, options?: LoggerOptions): void {
    if (this.isDev) {
      console.info(this.formatMessage("info", message, options?.tag), options?.data ?? "");
    }
  }

  warn(message: string, options?: LoggerOptions): void {
    if (this.isDev) {
      console.warn(this.formatMessage("warn", message, options?.tag), options?.data ?? "");
    }
    // Production'da da Sentry'ye gönder
    Sentry.addBreadcrumb({
      category: options?.tag ?? "warning",
      message,
      level: "warning",
      data: options?.data
    });
  }

  error(message: string, error?: Error, options?: LoggerOptions): void {
    if (this.isDev) {
      console.error(this.formatMessage("error", message, options?.tag), error, options?.data ?? "");
    }
    // Production'da Sentry'ye gönder
    if (error) {
      Sentry.captureException(error, {
        tags: { component: options?.tag },
        extra: options?.data
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        tags: { component: options?.tag },
        extra: options?.data
      });
    }
  }
}

export const logger = new Logger();

// Kısa yollar
export const log = {
  d: (msg: string, tag?: string) => logger.debug(msg, { tag }),
  i: (msg: string, tag?: string) => logger.info(msg, { tag }),
  w: (msg: string, tag?: string) => logger.warn(msg, { tag }),
  e: (msg: string, err?: Error, tag?: string) => logger.error(msg, err, { tag })
};
```

#### 2. Babel Plugin ile Otomatik Temizleme

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  
  const plugins = [
    // ... diğer pluginler
  ];

  // Production'da console'ları kaldır
  if (process.env.NODE_ENV === "production") {
    plugins.push(["transform-remove-console", { exclude: ["error", "warn"] }]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins
  };
};
```

#### 3. Migration Örneği

```typescript
// ❌ Önce
console.log("[Realtime] Subscribing to channel:", channelId);
console.error("Failed to subscribe:", error);

// ✅ Sonra
import { logger } from "@/utils/logger";

logger.debug("Subscribing to channel", { tag: "Realtime", data: { channelId } });
logger.error("Failed to subscribe", error, { tag: "Realtime" });
```

### Migration Script

```bash
# Console kullanımlarını bul
grep -rn "console\.\(log\|error\|warn\|info\)" apps/mobile/src --include="*.ts" --include="*.tsx"

# Dosya bazlı sayım
grep -r "console\." apps/mobile/src --include="*.ts" --include="*.tsx" -c | sort -t: -k2 -nr | head -20
```

---

## 3. Duplicate Auth Store

### Problem
İki farklı auth yönetimi mevcut:

**1. `src/store/auth.store.ts`**
```typescript
type AuthState = {
  sessionToken: string | null;
  isHydrated: boolean;
  setSession: (token: string | null) => void;
  markHydrated: () => void;
  clearSession: () => void;
};
```

**2. `src/hooks/useAuth.ts`**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}
```

### Neden Sorun?
- **Tutarsızlık:** Bazı component'ler `useAuthStore`, bazıları `useAuth` kullanıyor
- **Senkronizasyon:** İki store senkron değil
- **Karmaşıklık:** Yeni geliştiriciler için kafa karıştırıcı

### Çözüm

#### Birleştirilmiş Auth Store

```typescript
// src/store/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isHydrated: boolean;
  
  // Computed
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  markHydrated: () => void;
  clearAuth: () => void;
  
  // Async Actions
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      session: null,
      isLoading: true,
      isHydrated: false,
      isAuthenticated: false,

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ 
        session, 
        user: session?.user ?? null,
        isAuthenticated: !!session 
      }),
      setLoading: (isLoading) => set({ isLoading }),
      markHydrated: () => set({ isHydrated: true }),
      clearAuth: () => set({ 
        user: null, 
        session: null, 
        isAuthenticated: false 
      }),

      // Initialize auth state
      initialize: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("[Auth] Session error:", error);
            await supabase.auth.signOut();
            set({ user: null, session: null, isAuthenticated: false });
          } else if (session) {
            set({ 
              user: session.user, 
              session, 
              isAuthenticated: true 
            });
          }
        } catch (err) {
          console.error("[Auth] Initialize error:", err);
        } finally {
          set({ isLoading: false, isHydrated: true });
        }
      },

      // Sign out
      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, session: null, isAuthenticated: false });
        } catch (err) {
          console.error("[Auth] Sign out error:", err);
        }
      }
    }),
    {
      name: "ipelya-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        // Sadece gerekli state'leri persist et
        isHydrated: state.isHydrated 
      })
    }
  )
);

// Auth listener'ı başlat (bir kez)
let listenerInitialized = false;

export function initAuthListener() {
  if (listenerInitialized) return;
  listenerInitialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
}
```

#### Yeni useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect } from "react";
import { useAuthStore, initAuthListener } from "@/store/auth.store";

export function useAuth() {
  const { 
    user, 
    session,
    isLoading, 
    isAuthenticated,
    initialize 
  } = useAuthStore();

  useEffect(() => {
    initAuthListener();
    initialize();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    userId: user?.id ?? null
  };
}

// Sadece user ID için (performans)
export function useUserId(): string | null {
  return useAuthStore((state) => state.user?.id ?? null);
}

// Sadece auth durumu için
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}
```

### Migration Adımları

1. Yeni birleşik store'u oluştur
2. `useAuth` hook'u güncelle
3. Tüm `useAuthStore` kullanımlarını kontrol et
4. Eski `auth.store.ts`'i sil
5. Test et

---

## Özet Checklist

- [ ] Skeleton component oluştur
- [ ] ActivityIndicator → Skeleton migration (62 dosya)
- [ ] Logger utility oluştur
- [ ] Console log temizliği (172 dosya)
- [ ] Auth store birleştir
- [ ] useAuth hook güncelle
- [ ] Testler yaz

---

**Sonraki:** [PERFORMANS-ONERILERI.md](./PERFORMANS-ONERILERI.md)
