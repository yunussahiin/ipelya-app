# 🏛️ Mimari Öneriler

## 1. Error Boundary Eksik

### Problem
Global error boundary yok. Uygulama crash olduğunda kullanıcı boş ekran görüyor.

### Çözüm

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Sentry from "@sentry/react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.message}>Uygulama beklenmedik bir hatayla karşılaştı.</Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#050505" },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 8 },
  message: { fontSize: 16, color: "#94a3b8", textAlign: "center", marginBottom: 24 },
  button: { backgroundColor: "#ff3b81", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 }
});
```

### Kullanım (app/_layout.tsx)

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Layout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* ... */}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
```

---

## 2. i18n Yapılandırması

### Mevcut Durum
`src/i18n/` klasörü boş. `react-i18next` ve `i18next` kurulu.

### Çözüm

```typescript
// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

const resources = { tr: { translation: tr }, en: { translation: en } };

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale.split("-")[0],
  fallbackLng: "tr",
  interpolation: { escapeValue: false }
});

export default i18n;
```

```json
// src/i18n/locales/tr.json
{
  "common": {
    "loading": "Yükleniyor...",
    "error": "Bir hata oluştu",
    "retry": "Tekrar Dene",
    "save": "Kaydet",
    "cancel": "İptal",
    "delete": "Sil",
    "edit": "Düzenle"
  },
  "auth": {
    "login": "Giriş Yap",
    "register": "Kayıt Ol",
    "logout": "Çıkış Yap"
  },
  "feed": {
    "empty": "Henüz içerik yok",
    "newPost": "Yeni Gönderi"
  }
}
```

---

## 3. UI Component Library Genişletme

### Mevcut Durum
`src/components/ui/` sadece 4 component içeriyor.

### Önerilen Yapı

```
src/components/ui/
├── index.ts              # Barrel export
├── Button.tsx            # ✅ Mevcut
├── ThemeToggle.tsx       # ✅ Mevcut
├── Toast/                # ✅ Mevcut
├── Skeleton.tsx          # 🆕 Eklenecek
├── Avatar.tsx            # 🆕 Eklenecek
├── Badge.tsx             # 🆕 Eklenecek
├── Card.tsx              # 🆕 Eklenecek
├── Input.tsx             # 🆕 Eklenecek
├── Divider.tsx           # 🆕 Eklenecek
└── EmptyState.tsx        # 🆕 Eklenecek
```

### Örnek: Badge Component

```typescript
// src/components/ui/Badge.tsx
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({ label, variant = "default", size = "md", style }: BadgeProps) {
  const { colors } = useTheme();
  
  const variantColors = {
    default: { bg: colors.surface, text: colors.textSecondary },
    success: { bg: "#22c55e20", text: "#22c55e" },
    warning: { bg: "#fbbf2420", text: "#fbbf24" },
    error: { bg: "#ef444420", text: "#ef4444" },
    info: { bg: "#3b82f620", text: "#3b82f6" }
  };

  const { bg, text } = variantColors[variant];
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm, style]}>
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  label: { fontSize: 13, fontWeight: "600" },
  labelSm: { fontSize: 11 }
});
```

---

## 4. Service Layer Standardizasyonu

### Önerilen Pattern

```typescript
// src/services/base.service.ts
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export abstract class BaseService {
  protected supabase = supabase;
  protected tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }

  protected log(message: string, data?: Record<string, unknown>) {
    logger.debug(message, { tag: this.tag, data });
  }

  protected handleError(error: Error, context?: string): never {
    logger.error(context ?? "Service error", error, { tag: this.tag });
    throw error;
  }
}
```

---

## 5. Duplicate Dosyaları Temizle

### Tespit Edilen Duplicates

| Dosya                       | Boyut | Aksiyon |
| --------------------------- | ----- | ------- |
| `app/home.tsx`              | 41KB  | Koru    |
| `app/home copy.tsx`         | 41KB  | **SİL** |
| `GiftedChatScreen.tsx`      | -     | Koru    |
| `GiftedChatScreen copy.tsx` | -     | **SİL** |

```bash
# Silme komutları
rm apps/mobile/app/"home copy.tsx"
rm apps/mobile/src/components/messaging/ChatScreen/"GiftedChatScreen copy.tsx"
```

---

## Özet Checklist

- [ ] ErrorBoundary component oluştur
- [ ] i18n yapılandır
- [ ] UI component library genişlet (Skeleton, Avatar, Badge, Card, Input)
- [ ] Service base class oluştur
- [ ] Duplicate dosyaları sil
- [ ] Hardcoded renkleri theme'e taşı

---

**Sonraki:** [AKSIYON-PLANI.md](./AKSIYON-PLANI.md)
