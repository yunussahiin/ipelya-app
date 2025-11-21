# Phase 8.3: Testing & Optimization - Detaylı Rehber

## 📋 Genel Bakış

Bildirim sisteminin güvenilir çalışması için 3 seviye test gerekir:
1. **Unit Tests** - Hooks ve fonksiyonlar
2. **Integration Tests** - Full flows
3. **E2E Tests** - Gerçek cihazda

---

## 🎯 Sıra

### 1️⃣ Unit Tests (Hooks)
### 2️⃣ Integration Tests (Flows)
### 3️⃣ E2E Tests (Physical Device)
### 4️⃣ Performance Tests
### 5️⃣ Security Tests

---

## 1️⃣ Unit Tests (Hooks)

### Adım 1.1: Test Setup

```bash
cd apps/mobile
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest
```

### Adım 1.2: Jest Konfigürasyonu

**Dosya:** `apps/mobile/jest.config.js`

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Dosya:** `apps/mobile/jest.setup.js`

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      data: [],
      error: null,
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
}));
```

### Adım 1.3: useNotifications Hook Test

**Dosya:** `apps/mobile/__tests__/hooks/useNotifications.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotifications } from '@/hooks/useNotifications';
import * as supabase from '@supabase/supabase-js';

describe('useNotifications Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadNotifications', () => {
    it('should load notifications successfully', async () => {
      const mockNotifications = [
        {
          id: '1',
          title: 'Test',
          body: 'Test notification',
          read: false,
          created_at: new Date().toISOString(),
        },
      ];

      // Mock Supabase response
      const mockSupabase = supabase.createClient('', '');
      jest.spyOn(mockSupabase, 'from').mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockNotifications,
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications();
      });

      await waitFor(() => {
        expect(result.current.notifications).toEqual(mockNotifications);
      });
    });

    it('should handle loading errors', async () => {
      const mockError = new Error('Load failed');
      
      const mockSupabase = supabase.createClient('', '');
      jest.spyOn(mockSupabase, 'from').mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications();
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = '1';
      
      const mockSupabase = supabase.createClient('', '');
      jest.spyOn(mockSupabase, 'from').mockReturnValue({
        update: jest.fn().mockResolvedValue({
          data: { id: notificationId, read: true },
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.markAsRead(notificationId);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const notificationId = '1';
      
      const mockSupabase = supabase.createClient('', '');
      jest.spyOn(mockSupabase, 'from').mockReturnValue({
        delete: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.deleteNotification(notificationId);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('unreadCount', () => {
    it('should calculate unread count correctly', async () => {
      const mockNotifications = [
        { id: '1', read: false },
        { id: '2', read: false },
        { id: '3', read: true },
      ];

      const mockSupabase = supabase.createClient('', '');
      jest.spyOn(mockSupabase, 'from').mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockNotifications,
          error: null,
        }),
      } as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications();
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });
    });
  });

  describe('realtime subscription', () => {
    it('should subscribe to realtime changes', async () => {
      const mockSupabase = supabase.createClient('', '');
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };

      jest.spyOn(mockSupabase, 'channel').mockReturnValue(mockChannel as any);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.loadNotifications();
      });

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });
    });
  });
});
```

### Adım 1.4: useDeviceToken Hook Test

**Dosya:** `apps/mobile/__tests__/hooks/useDeviceToken.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDeviceToken } from '@/hooks/useDeviceToken';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

describe('useDeviceToken Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('device check', () => {
    it('should skip on simulator', async () => {
      jest.spyOn(Device, 'isDevice').mockReturnValue(false);

      const { result } = renderHook(() => useDeviceToken());

      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.error).toContain('simulator');
      });
    });

    it('should proceed on physical device', async () => {
      jest.spyOn(Device, 'isDevice').mockReturnValue(true);
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: true,
      } as any);

      const { result } = renderHook(() => useDeviceToken());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('permission request', () => {
    it('should request permissions', async () => {
      jest.spyOn(Device, 'isDevice').mockReturnValue(true);
      const requestPermissions = jest.spyOn(Notifications, 'requestPermissionsAsync');

      renderHook(() => useDeviceToken());

      await waitFor(() => {
        expect(requestPermissions).toHaveBeenCalled();
      });
    });

    it('should handle permission denial', async () => {
      jest.spyOn(Device, 'isDevice').mockReturnValue(true);
      jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({
        granted: false,
      } as any);

      const { result } = renderHook(() => useDeviceToken());

      await waitFor(() => {
        expect(result.current.error).toContain('permission');
      });
    });
  });

  describe('token registration', () => {
    it('should register token to database', async () => {
      jest.spyOn(Device, 'isDevice').mockReturnValue(true);
      jest.spyOn(Notifications, 'getExpoPushTokenAsync').mockResolvedValue({
        data: 'test-token-123',
      } as any);

      const { result } = renderHook(() => useDeviceToken());

      await waitFor(() => {
        expect(result.current.token).toBe('test-token-123');
      });
    });
  });
});
```

### Adım 1.5: useNotificationPreferences Hook Test

**Dosya:** `apps/mobile/__tests__/hooks/useNotificationPreferences.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

describe('useNotificationPreferences Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPreferences', () => {
    it('should load preferences successfully', async () => {
      const mockPreferences = {
        push_enabled: true,
        email_enabled: false,
        notification_types: {
          new_follower: true,
          new_message: true,
        },
      };

      const { result } = renderHook(() => useNotificationPreferences());

      await act(async () => {
        await result.current.loadPreferences();
      });

      await waitFor(() => {
        expect(result.current.preferences).toBeDefined();
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update push_enabled', async () => {
      const { result } = renderHook(() => useNotificationPreferences());

      await act(async () => {
        await result.current.updatePreferences({ push_enabled: false });
      });

      await waitFor(() => {
        expect(result.current.preferences?.push_enabled).toBe(false);
      });
    });

    it('should toggle notification type', async () => {
      const { result } = renderHook(() => useNotificationPreferences());

      await act(async () => {
        await result.current.toggleNotificationType('new_follower', false);
      });

      await waitFor(() => {
        expect(result.current.preferences?.notification_types?.new_follower).toBe(false);
      });
    });
  });

  describe('quiet hours', () => {
    it('should set quiet hours', async () => {
      const { result } = renderHook(() => useNotificationPreferences());

      await act(async () => {
        await result.current.setQuietHours('22:00', '08:00');
      });

      await waitFor(() => {
        expect(result.current.preferences?.quiet_hours_start).toBe('22:00');
        expect(result.current.preferences?.quiet_hours_end).toBe('08:00');
      });
    });
  });
});
```

---

## 2️⃣ Integration Tests (Flows)

### Adım 2.1: Device Token Registration Flow

**Dosya:** `apps/mobile/__tests__/integration/device-token-flow.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDeviceToken } from '@/hooks/useDeviceToken';
import { useNotifications } from '@/hooks/useNotifications';

describe('Device Token Registration Flow', () => {
  it('should complete full registration flow', async () => {
    // 1. Device token alınır
    const { result: deviceTokenResult } = renderHook(() => useDeviceToken());

    await waitFor(() => {
      expect(deviceTokenResult.current.token).toBeDefined();
    });

    // 2. Notifications hook'u başlatılır
    const { result: notificationsResult } = renderHook(() => useNotifications());

    // 3. Bildirimler yüklenir
    await act(async () => {
      await notificationsResult.current.loadNotifications();
    });

    await waitFor(() => {
      expect(notificationsResult.current.notifications).toBeDefined();
    });

    // 4. Realtime subscription aktif
    expect(notificationsResult.current.isSubscribed).toBe(true);
  });
});
```

### Adım 2.2: Notification Receive & Mark as Read Flow

**Dosya:** `apps/mobile/__tests__/integration/notification-flow.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotifications } from '@/hooks/useNotifications';

describe('Notification Receive & Mark as Read Flow', () => {
  it('should receive notification and mark as read', async () => {
    const { result } = renderHook(() => useNotifications());

    // 1. Bildirimler yüklenir
    await act(async () => {
      await result.current.loadNotifications();
    });

    const initialUnreadCount = result.current.unreadCount;

    // 2. Yeni bildirim simüle edilir
    const newNotification = {
      id: 'new-1',
      title: 'Test',
      body: 'Test notification',
      read: false,
      created_at: new Date().toISOString(),
    };

    // 3. Bildirim okundu işaretlenir
    await act(async () => {
      await result.current.markAsRead(newNotification.id);
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBeLessThan(initialUnreadCount + 1);
    });
  });

  it('should mark all as read', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.loadNotifications();
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });
});
```

### Adım 2.3: Deep Linking Flow

**Dosya:** `apps/mobile/__tests__/integration/deep-linking-flow.test.ts`

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import * as Linking from 'expo-linking';

describe('Deep Linking Flow', () => {
  it('should handle deep link from notification', async () => {
    const mockUrl = 'ipelya://profile/user-123';
    
    jest.spyOn(Linking, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() => useNotificationListener());

    await waitFor(() => {
      expect(result.current.isListening).toBe(true);
    });

    // Deep link simüle et
    await act(async () => {
      // Notification response handler'ı çağır
      const handler = (Linking.addEventListener as jest.Mock).mock.calls[0][1];
      handler({ url: mockUrl });
    });

    await waitFor(() => {
      expect(result.current.lastDeepLink).toBe(mockUrl);
    });
  });
});
```

---

## 3️⃣ E2E Tests (Physical Device)

### Adım 3.1: Detox Setup

```bash
npm install --save-dev detox detox-cli detox-config
```

**Dosya:** `apps/mobile/e2e/config.e2e.js`

```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config',
  apps: {
    ios: {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/mobile.app',
      build: 'xcodebuild -workspace ios/mobile.xcworkspace -scheme mobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: {
        type: 'iPhone 14',
      },
      app: 'ios',
    },
  },
  testRunner: 'jest',
};
```

### Adım 3.2: E2E Test - Notification Permission

**Dosya:** `apps/mobile/e2e/notification-permission.e2e.ts`

```typescript
describe('Notification Permission Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should request notification permission', async () => {
    // Permission dialog'u ara
    await expect(element(by.text('Bildirim İzni'))).toBeVisible();

    // İzin ver
    await element(by.text('İzin Ver')).tap();

    // Başarı mesajı kontrol et
    await expect(element(by.text('Bildirimler Etkinleştirildi'))).toBeVisible();
  });
});
```

### Adım 3.3: E2E Test - Notification Center

**Dosya:** `apps/mobile/e2e/notification-center.e2e.ts`

```typescript
describe('Notification Center', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should display notifications', async () => {
    // Notification bell'e tıkla
    await element(by.testID('notification-bell')).tap();

    // Notification center açılmalı
    await expect(element(by.testID('notification-center'))).toBeVisible();

    // Bildirimler listesi görülmeli
    await expect(element(by.testID('notification-item-0'))).toBeVisible();
  });

  it('should mark notification as read', async () => {
    await element(by.testID('notification-bell')).tap();
    
    // Bildirime tıkla
    await element(by.testID('notification-item-0')).tap();

    // Okundu işareti kontrol et
    await expect(element(by.testID('read-indicator-0'))).toBeVisible();
  });

  it('should delete notification', async () => {
    await element(by.testID('notification-bell')).tap();
    
    // Sil butonuna tıkla
    await element(by.testID('delete-button-0')).tap();

    // Bildirim kaybolmalı
    await expect(element(by.testID('notification-item-0'))).not.toBeVisible();
  });
});
```

---

## 4️⃣ Performance Tests

### Adım 4.1: Memory Leak Check

**Dosya:** `apps/mobile/__tests__/performance/memory-leak.test.ts`

```typescript
describe('Memory Leak Tests', () => {
  it('should not leak memory on realtime subscription', async () => {
    const { result, unmount } = renderHook(() => useNotifications());

    // Subscribe
    await act(async () => {
      await result.current.loadNotifications();
    });

    // Unsubscribe
    unmount();

    // Memory check (manual inspection required)
    // Use Chrome DevTools or React Native Debugger
  });

  it('should cleanup notification listeners', async () => {
    const { result, unmount } = renderHook(() => useNotificationListener());

    unmount();

    // Listeners should be cleaned up
    // Verify with console logs
  });
});
```

### Adım 4.2: Performance Metrics

**Dosya:** `apps/mobile/__tests__/performance/metrics.test.ts`

```typescript
describe('Performance Metrics', () => {
  it('should load notifications in <500ms', async () => {
    const { result } = renderHook(() => useNotifications());

    const start = performance.now();
    
    await act(async () => {
      await result.current.loadNotifications();
    });

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(500);
  });

  it('should mark as read in <200ms', async () => {
    const { result } = renderHook(() => useNotifications());

    const start = performance.now();
    
    await act(async () => {
      await result.current.markAsRead('test-id');
    });

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(200);
  });
});
```

---

## 5️⃣ Security Tests

### Adım 5.1: RLS Policy Tests

```sql
-- Test: User can only see own notifications
SELECT * FROM notifications 
WHERE recipient_id != auth.uid()
-- Should return 0 rows

-- Test: User cannot update other's notifications
UPDATE notifications 
SET read = true 
WHERE recipient_id != auth.uid()
-- Should fail with permission denied
```

### Adım 5.2: Token Security

**Dosya:** `apps/mobile/__tests__/security/token-security.test.ts`

```typescript
describe('Token Security', () => {
  it('should not expose token in logs', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    const { result } = renderHook(() => useDeviceToken());

    await waitFor(() => {
      expect(result.current.token).toBeDefined();
    });

    // Token should not be logged
    const logs = consoleSpy.mock.calls.join('');
    expect(logs).not.toContain(result.current.token);
  });

  it('should use HTTPS for token transmission', async () => {
    // Verify all API calls use HTTPS
    // Check network requests in test
  });
});
```

---

## 📊 Test Coverage Hedefleri

```
Statements   : 85%+
Branches     : 80%+
Functions    : 85%+
Lines        : 85%+
```

---

## 🧪 Test Çalıştırma

```bash
# Tüm testleri çalıştır
npm test

# Spesifik test dosyası
npm test -- useNotifications.test.ts

# Coverage raporu
npm test -- --coverage

# Watch mode
npm test -- --watch

# E2E testleri
detox test e2e --configuration ios.sim.debug
```

---

## ✅ Test Kontrol Listesi

- [ ] Unit tests yazıldı
- [ ] Integration tests yazıldı
- [ ] E2E tests yazıldı
- [ ] Coverage %85+ ulaştı
- [ ] Performance tests geçti
- [ ] Security tests geçti
- [ ] Memory leak yok
- [ ] Tüm testler CI/CD'de çalışıyor

---

**Sonraki Adım:** Phase 8.4 - Documentation & Polish
