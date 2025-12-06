# 🏗️ Proje Analizi

## Teknoloji Stack

### Core Framework
| Teknoloji    | Versiyon | Açıklama         |
| ------------ | -------- | ---------------- |
| Expo         | 54.0.25  | Managed workflow |
| React Native | 0.81.5   | Core framework   |
| React        | 19.1.0   | UI library       |
| TypeScript   | 5.9.3    | Type safety      |

### Navigation & Routing
| Teknoloji            | Versiyon | Açıklama           |
| -------------------- | -------- | ------------------ |
| expo-router          | 6.0.15   | File-based routing |
| react-native-screens | 4.16.0   | Native screens     |

### State Management
| Teknoloji    | Versiyon | Kullanım           |
| ------------ | -------- | ------------------ |
| Zustand      | 5.0.8    | Global state       |
| React Query  | 5.90.9   | Server state       |
| AsyncStorage | 2.2.0    | Persistent storage |

### Backend & Realtime
| Teknoloji      | Versiyon | Kullanım          |
| -------------- | -------- | ----------------- |
| Supabase       | 2.81.1   | Auth, DB, Storage |
| LiveKit        | 2.9.5    | Video/Audio rooms |
| livekit-client | 2.16.0   | Client SDK        |

### UI & Animation
| Teknoloji                    | Versiyon | Kullanım         |
| ---------------------------- | -------- | ---------------- |
| @gorhom/bottom-sheet         | 5.2.6    | Bottom sheets    |
| react-native-reanimated      | 4.1.5    | Animations       |
| react-native-gesture-handler | 2.28.0   | Gestures         |
| expo-blur                    | 15.0.7   | Blur effects     |
| @shopify/flash-list          | 2.0.2    | Performant lists |
| @shopify/react-native-skia   | 2.2.12   | Canvas drawing   |

### Media & Camera
| Teknoloji                  | Versiyon | Kullanım        |
| -------------------------- | -------- | --------------- |
| expo-camera                | 17.0.9   | Camera access   |
| expo-image                 | 3.0.10   | Image display   |
| expo-image-picker          | 17.0.8   | Image selection |
| expo-video                 | 3.0.14   | Video playback  |
| react-native-vision-camera | 4.7.3    | Advanced camera |

### Monitoring & Analytics
| Teknoloji            | Versiyon | Kullanım       |
| -------------------- | -------- | -------------- |
| @sentry/react-native | 7.7.0    | Error tracking |

### Forms & Validation
| Teknoloji       | Versiyon | Kullanım          |
| --------------- | -------- | ----------------- |
| react-hook-form | 7.66.1   | Form management   |
| zod             | 4.1.12   | Schema validation |

---

## Proje Yapısı

```
apps/mobile/
├── app/                          # Route dosyaları (expo-router)
│   ├── (asmr)/                   # ASMR özellikleri
│   ├── (auth)/                   # Giriş/Kayıt
│   ├── (broadcast)/              # Yayın kanalları
│   ├── (creator)/                # İçerik üretici
│   ├── (fantasy)/                # Fantasy özellikleri
│   ├── (feed)/                   # Ana akış
│   ├── (live)/                   # Canlı yayın
│   ├── (messages)/               # Mesajlaşma
│   ├── (notifications)/          # Bildirimler
│   ├── (profile)/                # Profil
│   ├── (settings)/               # Ayarlar
│   ├── (store)/                  # Mağaza
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
│
├── src/
│   ├── components/               # 389 component
│   │   ├── broadcast/            # Yayın component'leri
│   │   ├── camera/               # Kamera component'leri
│   │   ├── creator/              # Creator component'leri
│   │   ├── home-feed/            # Feed component'leri
│   │   ├── layout/               # Layout component'leri
│   │   ├── live/                 # Live component'leri
│   │   ├── messaging/            # Mesaj component'leri
│   │   ├── navigation/           # Navigation component'leri
│   │   ├── notifications/        # Bildirim component'leri
│   │   ├── onboarding/           # Onboarding component'leri
│   │   ├── profile/              # Profil component'leri
│   │   ├── profile-view/         # Profil görüntüleme
│   │   ├── store/                # Mağaza component'leri
│   │   └── ui/                   # Genel UI component'leri
│   │
│   ├── hooks/                    # 92 hook
│   │   ├── creator/              # Creator hooks
│   │   ├── home-feed/            # Feed hooks
│   │   ├── live/                 # Live hooks
│   │   ├── messaging/            # Messaging hooks
│   │   ├── stories/              # Stories hooks
│   │   └── *.ts                  # Genel hooks
│   │
│   ├── store/                    # 17 Zustand store
│   │   ├── home-feed/            # Feed stores
│   │   ├── messaging/            # Messaging stores
│   │   └── *.store.ts            # Genel stores
│   │
│   ├── services/                 # 13 service
│   │   ├── iap/                  # In-app purchase
│   │   └── *.service.ts          # Genel services
│   │
│   ├── theme/                    # Theme sistemi
│   │   ├── ThemeProvider.tsx     # Theme context
│   │   └── layout.ts             # Layout constants
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── queryClient.ts        # React Query client
│   │   └── supabaseClient.ts     # Supabase client
│   │
│   ├── navigation/               # Navigation config
│   │   ├── tabs.ts               # Tab definitions
│   │   └── useTabsNavigation.ts  # Navigation hook
│   │
│   ├── types/                    # TypeScript types
│   ├── utils/                    # Utility functions
│   └── i18n/                     # Internationalization (boş)
│
├── assets/                       # Static assets
│   ├── effects/                  # Effect files
│   ├── glasses/                  # AR glasses
│   ├── sound/                    # Sound files
│   └── wallpapers/               # Wallpaper images
│
├── __tests__/                    # Test dosyaları
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   └── utils/                    # Utility tests
│
├── android/                      # Android native
├── ios/                          # iOS native
└── package.json                  # Dependencies
```

---

## Route Grupları Detayı

### (auth) - Authentication
- `login.tsx` - Giriş ekranı
- `register.tsx` - Kayıt ekranı

### (feed) - Ana Akış
- `index.tsx` - Feed ana sayfa
- `shadow.tsx` - Shadow mode feed

### (live) - Canlı Yayın
- 33 dosya
- Audio room, video room, broadcast özellikleri
- LiveKit entegrasyonu

### (messages) - Mesajlaşma
- 6 dosya
- DM, broadcast channels
- Realtime messaging

### (profile) - Profil
- 7 dosya
- Profil düzenleme
- Shadow profil
- Blocked users

### (settings) - Ayarlar
- 8 dosya
- Bildirim ayarları
- Shadow ayarları
- Güvenlik ayarları

### (creator) - İçerik Üretici
- 16 dosya
- KYC doğrulama
- Earnings dashboard
- Tier yönetimi

### (store) - Mağaza
- 4 dosya
- Coin satın alma
- Premium özellikler

---

## Store Yapısı

### Global Stores
| Store      | Dosya                 | Amaç                   |
| ---------- | --------------------- | ---------------------- |
| Auth       | `auth.store.ts`       | Session token yönetimi |
| Profile    | `profile.store.ts`    | Kullanıcı profili      |
| Settings   | `settings.store.ts`   | Uygulama ayarları      |
| Shadow     | `shadow.store.ts`     | Shadow mode state      |
| Coins      | `coins.store.ts`      | Coin bakiyesi          |
| Economy    | `economy.store.ts`    | Ekonomi sistemi        |
| Live       | `live.store.ts`       | Canlı yayın state      |
| Onboarding | `onboarding.store.ts` | Onboarding durumu      |

### Domain Stores
| Klasör     | Store Sayısı | Amaç                |
| ---------- | ------------ | ------------------- |
| home-feed/ | 4            | Feed state yönetimi |
| messaging/ | 5            | Mesajlaşma state    |

---

## Service Yapısı

| Service           | Dosya                          | Amaç                |
| ----------------- | ------------------------------ | ------------------- |
| Anomaly Detection | `anomaly-detection.service.ts` | Anomali tespiti     |
| Audit             | `audit.service.ts`             | Audit logging       |
| Avatar            | `avatar.service.ts`            | Avatar yönetimi     |
| Followers         | `followers.service.ts`         | Takipçi işlemleri   |
| Media Upload      | `media-upload.service.ts`      | Medya yükleme       |
| Notifications     | `notifications.service.ts`     | Bildirim servisi    |
| OAuth             | `oauth.service.ts`             | OAuth işlemleri     |
| Rate Limit        | `rate-limit.service.ts`        | Rate limiting       |
| Secure Store      | `secure-store.service.ts`      | Güvenli depolama    |
| Session           | `session.service.ts`           | Oturum yönetimi     |
| User Lock         | `user-lock.service.ts`         | Kullanıcı kilitleme |
| IAP               | `iap/`                         | In-app purchase     |

---

## Theme Sistemi

### Renk Paleti (Dark Mode)
```typescript
{
  background: "#050505",
  backgroundRaised: "#0a0a0a",
  surface: "#0f0f12",
  surfaceAlt: "#111111",
  border: "#1f1f20",
  borderMuted: "#262626",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  textMuted: "#6b7280",
  accent: "#ff3b81",
  accentSoft: "#ff63c0",
  highlight: "#a78bfa",
  success: "#22c55e",
  warning: "#fbbf24"
}
```

### Accent Renkleri
- **Magenta:** `#ff3b81` (varsayılan)
- **Aqua:** `#22d3ee`
- **Amber:** `#fbbf24`
- **Custom:** Kullanıcı tanımlı

### Layout Constants
```typescript
{
  screenPaddingHorizontal: 16,
  screenPaddingVertical: 12,
  sectionGap: 24,
  componentGap: 16,
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  touchTargetMin: 44,
  buttonMinHeight: 48,
  navHeight: 80
}
```

---

## Bağımlılık Analizi

### Toplam Bağımlılık
- **Dependencies:** 90+
- **DevDependencies:** 4

### Ağır Bağımlılıklar
1. `@shopify/react-native-skia` - Canvas rendering
2. `@livekit/react-native` - WebRTC
3. `react-native-vision-camera` - Advanced camera
4. `@sentry/react-native` - Error tracking

### Potansiyel Gereksiz Bağımlılıklar
- `react-native-web` - Web desteği kullanılıyor mu?
- `react-dom` - Web için gerekli

---

**Sonraki:** [KRITIK-SORUNLAR.md](./KRITIK-SORUNLAR.md)
