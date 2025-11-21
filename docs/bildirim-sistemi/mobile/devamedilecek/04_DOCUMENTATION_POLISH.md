# Phase 8.4: Documentation & Polish - Detaylı Rehber

## 📋 Genel Bakış

Bildirim sistemini production'a hazırlamak için:
1. **Code Documentation** - JSDoc, comments
2. **User Documentation** - README, guides
3. **UI/UX Polish** - Animations, dark mode
4. **Error Handling** - Logging, monitoring

---

## 🎯 Sıra

### 1️⃣ Code Documentation (JSDoc)
### 2️⃣ User Documentation (README, Troubleshooting)
### 3️⃣ UI/UX Polish (Animations, Dark Mode)
### 4️⃣ Error Handling & Monitoring
### 5️⃣ Production Checklist

---

## 1️⃣ Code Documentation (JSDoc)

### Adım 1.1: useNotifications Hook

**Dosya:** `apps/mobile/src/hooks/useNotifications.ts`

```typescript
/**
 * Hook for managing notifications with real-time updates
 * 
 * Provides functionality to:
 * - Load notifications from database
 * - Subscribe to real-time changes
 * - Mark notifications as read
 * - Delete notifications
 * - Track unread count
 * 
 * @example
 * ```typescript
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 * 
 * useEffect(() => {
 *   loadNotifications();
 * }, []);
 * ```
 * 
 * @returns {UseNotificationsReturn} Notifications state and actions
 * @throws {Error} If database query fails
 */
export function useNotifications(): UseNotificationsReturn {
  // Implementation...
}

/**
 * Load all notifications for current user
 * 
 * Fetches notifications from database and sets up real-time subscription.
 * Automatically filters based on notification preferences.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If database query fails
 * 
 * @example
 * ```typescript
 * await loadNotifications();
 * ```
 */
async function loadNotifications(): Promise<void> {
  // Implementation...
}

/**
 * Mark a notification as read
 * 
 * Updates the notification's read status in the database.
 * Automatically updates unread count.
 * 
 * @param {string} notificationId - The notification ID to mark as read
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 * 
 * @example
 * ```typescript
 * await markAsRead('notification-123');
 * ```
 */
async function markAsRead(notificationId: string): Promise<void> {
  // Implementation...
}

/**
 * Mark all notifications as read
 * 
 * Updates all unread notifications to read status.
 * Useful for "Mark all as read" button.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 * 
 * @example
 * ```typescript
 * await markAllAsRead();
 * ```
 */
async function markAllAsRead(): Promise<void> {
  // Implementation...
}

/**
 * Delete a notification
 * 
 * Removes notification from database permanently.
 * Cannot be undone.
 * 
 * @param {string} notificationId - The notification ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If delete fails
 * 
 * @example
 * ```typescript
 * await deleteNotification('notification-123');
 * ```
 */
async function deleteNotification(notificationId: string): Promise<void> {
  // Implementation...
}

/**
 * Interface for useNotifications return value
 */
interface UseNotificationsReturn {
  /** Array of notifications */
  notifications: Notification[];
  
  /** Number of unread notifications */
  unreadCount: number;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Realtime subscription active */
  isSubscribed: boolean;
  
  /** Load notifications function */
  loadNotifications: () => Promise<void>;
  
  /** Mark as read function */
  markAsRead: (id: string) => Promise<void>;
  
  /** Mark all as read function */
  markAllAsRead: () => Promise<void>;
  
  /** Delete notification function */
  deleteNotification: (id: string) => Promise<void>;
}
```

### Adım 1.2: useDeviceToken Hook

```typescript
/**
 * Hook for managing device push notification token
 * 
 * Handles:
 * - Device capability check
 * - Permission request
 * - Token retrieval from Expo
 * - Token storage in database
 * - Token updates
 * 
 * @example
 * ```typescript
 * const { token, loading, error } = useDeviceToken();
 * 
 * useEffect(() => {
 *   if (token) {
 *     console.log('Device token registered:', token);
 *   }
 * }, [token]);
 * ```
 * 
 * @returns {UseDeviceTokenReturn} Token state and status
 */
export function useDeviceToken(): UseDeviceTokenReturn {
  // Implementation...
}

interface UseDeviceTokenReturn {
  /** Device push token */
  token: string | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Retry function */
  retry: () => Promise<void>;
}
```

### Adım 1.3: useNotificationListener Hook

```typescript
/**
 * Hook for handling incoming notifications
 * 
 * Manages:
 * - Foreground notification display
 * - Background notification handling
 * - Notification response (when tapped)
 * - Deep linking from notifications
 * - Last notification tracking
 * 
 * @example
 * ```typescript
 * useNotificationListener();
 * // Automatically handles all notification events
 * ```
 * 
 * @returns {UseNotificationListenerReturn} Listener state
 */
export function useNotificationListener(): UseNotificationListenerReturn {
  // Implementation...
}

interface UseNotificationListenerReturn {
  /** Listener is active */
  isListening: boolean;
  
  /** Last received notification */
  lastNotification: Notification | null;
  
  /** Last deep link from notification */
  lastDeepLink: string | null;
}
```

### Adım 1.4: useNotificationPreferences Hook

```typescript
/**
 * Hook for managing user notification preferences
 * 
 * Allows users to:
 * - Enable/disable push notifications
 * - Enable/disable email notifications
 * - Toggle individual notification types
 * - Set quiet hours
 * 
 * @example
 * ```typescript
 * const { preferences, updatePreferences } = useNotificationPreferences();
 * 
 * // Toggle notification type
 * await updatePreferences({
 *   notification_types: {
 *     ...preferences.notification_types,
 *     new_follower: false
 *   }
 * });
 * ```
 * 
 * @returns {UseNotificationPreferencesReturn} Preferences state and actions
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  // Implementation...
}

interface UseNotificationPreferencesReturn {
  /** User preferences */
  preferences: NotificationPreferences | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Update preferences function */
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  
  /** Toggle notification type function */
  toggleNotificationType: (type: string, enabled: boolean) => Promise<void>;
  
  /** Set quiet hours function */
  setQuietHours: (start: string, end: string) => Promise<void>;
}
```

---

## 2️⃣ User Documentation

### Adım 2.1: README.md

**Dosya:** `apps/mobile/NOTIFICATIONS_README.md`

```markdown
# Push Notifications System

## Overview

The push notifications system allows users to receive real-time updates about:
- New followers
- Messages and replies
- Content interactions (likes, comments, shares)
- System alerts and maintenance notifications
- Security alerts

## Features

### ✅ Implemented
- Real-time notifications with Supabase Realtime
- Device token management
- Notification preferences
- Deep linking to relevant content
- Quiet hours support
- Mark as read / Delete functionality

### 📱 Supported Platforms
- iOS (APNs)
- Android (FCM)
- Web (Realtime only)

## Setup

### Prerequisites
- iOS: Apple Developer Account
- Android: Firebase Project
- EAS Account (for building)

### Installation

1. **Install dependencies**
   ```bash
   npx expo install expo-notifications expo-device expo-constants
   ```

2. **Configure app.json**
   ```json
   {
     "plugins": [
       [
         "expo-notifications",
         {
           "icon": "./assets/notification-icon.png",
           "color": "#FF6B35",
           "defaultChannel": "default",
           "sounds": ["./assets/notification-sound.wav"],
           "enableBackgroundRemoteNotifications": true
         }
       ]
     ]
   }
   ```

3. **Set up EAS credentials**
   ```bash
   npx eas-cli@latest credentials configure --platform ios
   npx eas-cli@latest credentials configure --platform android
   ```

4. **Create development build**
   ```bash
   npx eas-cli@latest build:dev --platform ios
   npx eas-cli@latest build:dev --platform android
   ```

## Usage

### In Components

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationListener } from '@/hooks/useNotificationListener';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { lastNotification } = useNotificationListener();

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onPress={() => markAsRead(notification.id)}
        />
      ))}
    </View>
  );
}
```

### Notification Types

| Type                | Description          | Deep Link                |
| ------------------- | -------------------- | ------------------------ |
| `new_follower`      | New follower         | `/profile/{follower_id}` |
| `follow_back`       | Follow back          | `/profile/{user_id}`     |
| `profile_mention`   | Mentioned in profile | `/profile/{user_id}`     |
| `new_message`       | New message          | `/messages/{sender_id}`  |
| `message_like`      | Message liked        | `/messages/{user_id}`    |
| `message_reply`     | Message replied      | `/messages/{sender_id}`  |
| `content_like`      | Content liked        | `/content/{content_id}`  |
| `content_comment`   | Content commented    | `/content/{content_id}`  |
| `content_share`     | Content shared       | `/content/{content_id}`  |
| `content_update`    | Content updated      | `/content/{content_id}`  |
| `user_blocked`      | User blocked         | `/(settings)/security`   |
| `system_alert`      | System alert         | App home                 |
| `security_alert`    | Security alert       | `/(settings)/security`   |
| `maintenance_start` | Maintenance started  | App home                 |
| `maintenance_end`   | Maintenance ended    | App home                 |

## API Reference

### useNotifications

```typescript
const {
  notifications,      // Notification[]
  unreadCount,        // number
  loading,            // boolean
  error,              // string | null
  isSubscribed,       // boolean
  loadNotifications,  // () => Promise<void>
  markAsRead,         // (id: string) => Promise<void>
  markAllAsRead,      // () => Promise<void>
  deleteNotification  // (id: string) => Promise<void>
} = useNotifications();
```

### useDeviceToken

```typescript
const {
  token,    // string | null
  loading,  // boolean
  error,    // string | null
  retry     // () => Promise<void>
} = useDeviceToken();
```

### useNotificationListener

```typescript
const {
  isListening,    // boolean
  lastNotification, // Notification | null
  lastDeepLink    // string | null
} = useNotificationListener();
```

### useNotificationPreferences

```typescript
const {
  preferences,           // NotificationPreferences | null
  loading,               // boolean
  error,                 // string | null
  updatePreferences,     // (updates) => Promise<void>
  toggleNotificationType, // (type, enabled) => Promise<void>
  setQuietHours          // (start, end) => Promise<void>
} = useNotificationPreferences();
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Performance

- Load notifications: <500ms
- Mark as read: <200ms
- Realtime latency: 19-58ms (median)
- Memory usage: ~5-10MB
- Battery impact: Minimal

## Security

- RLS policies enforce user isolation
- Tokens never logged or exposed
- HTTPS for all API calls
- Encrypted storage for sensitive data

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm test -- --integration

# E2E tests
detox test e2e --configuration ios.sim.debug

# Coverage
npm test -- --coverage
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

MIT
```

### Adım 2.2: TROUBLESHOOTING.md

**Dosya:** `apps/mobile/TROUBLESHOOTING.md`

```markdown
# Troubleshooting Guide

## Common Issues

### 1. Notifications Not Received

**Symptoms:**
- Push notifications not arriving on device
- Device token registered but no notifications

**Solutions:**

1. **Check device token**
   ```sql
   SELECT * FROM device_tokens 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC;
   ```

2. **Verify notification preferences**
   ```sql
   SELECT * FROM notification_preferences 
   WHERE user_id = 'your-user-id';
   ```

3. **Check quiet hours**
   - If current time is within quiet hours, notifications are suppressed
   - Disable quiet hours in settings

4. **Verify credentials**
   ```bash
   npx eas-cli@latest credentials list
   ```

5. **Check Edge Function logs**
   ```bash
   npx eas-cli@latest logs --service edge-function
   ```

### 2. Permission Denied

**Symptoms:**
- "Permission denied" error when accessing notifications
- RLS policy violation

**Solutions:**

1. **Check RLS policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'notifications';
   ```

2. **Verify user authentication**
   - Ensure user is logged in
   - Check auth token validity

3. **Check notification ownership**
   - User can only access own notifications
   - Verify recipient_id matches auth.uid()

### 3. Device Token Not Registered

**Symptoms:**
- Device token is null
- "Token registration failed" error

**Solutions:**

1. **Check permissions**
   - iOS: Settings → Notifications → ipelya → Allow Notifications
   - Android: Settings → Apps → ipelya → Notifications → Allow

2. **Check device type**
   - Simulator: Push notifications not supported
   - Physical device required

3. **Check Expo token endpoint**
   ```bash
   # In useDeviceToken hook
   console.log('Token request:', token);
   ```

4. **Verify EAS project ID**
   - Check app.json: `extra.eas.projectId`
   - Should match EAS project

### 4. Deep Linking Not Working

**Symptoms:**
- Notification tapped but no navigation
- Wrong screen opened

**Solutions:**

1. **Check deep link URL**
   - Verify format: `ipelya://path/to/screen`
   - Check notification data.url field

2. **Check route configuration**
   - Verify route exists in app router
   - Check route parameters match

3. **Test deep link manually**
   ```bash
   npx expo start
   # Then in another terminal
   xcrun simctl openurl booted "ipelya://profile/user-123"
   ```

### 5. Memory Leak

**Symptoms:**
- App crashes after receiving many notifications
- Memory usage increases over time

**Solutions:**

1. **Check realtime subscription cleanup**
   ```typescript
   useEffect(() => {
     return () => {
       // Cleanup should be called here
       channel.unsubscribe();
     };
   }, []);
   ```

2. **Check event listener cleanup**
   - Notification listeners should be removed on unmount
   - Use `removeNotificationSubscription()`

3. **Profile memory usage**
   - Use React Native Debugger
   - Check for circular references

### 6. Slow Performance

**Symptoms:**
- Notifications load slowly
- UI freezes when opening notification center

**Solutions:**

1. **Optimize query**
   - Add pagination: `limit(20).range(0, 20)`
   - Add indexes on recipient_id, created_at

2. **Reduce realtime updates**
   - Filter by notification type
   - Use debouncing for updates

3. **Check network**
   - Verify internet connection
   - Check API latency

### 7. Notifications Not Showing in Foreground

**Symptoms:**
- Notifications received but not displayed
- Only background notifications work

**Solutions:**

1. **Check notification handler**
   ```typescript
   Notifications.setNotificationHandler({
     handleNotification: async () => ({
       shouldShowAlert: true,
       shouldPlaySound: true,
       shouldSetBadge: true,
     }),
   });
   ```

2. **Verify notification data**
   - Check title and body fields
   - Ensure data is valid JSON

3. **Check Android notification channel**
   - Verify channel exists
   - Check channel settings

### 8. Simulator Issues

**Note:** Push notifications don't work on simulator

**Workaround:**
- Use physical device for testing
- Use Realtime subscription for simulator testing
- Mock notifications in development

## Debug Tips

### Enable Detailed Logging

```typescript
// In useNotifications hook
const [debug, setDebug] = useState(true);

useEffect(() => {
  if (debug) {
    console.log('📱 Notifications:', notifications);
    console.log('📊 Unread count:', unreadCount);
    console.log('🔄 Subscribed:', isSubscribed);
  }
}, [notifications, unreadCount, isSubscribed]);
```

### Check Database

```sql
-- View all notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- View device tokens
SELECT * FROM device_tokens;

-- View preferences
SELECT * FROM notification_preferences;

-- Check triggers
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%notification%';
```

### Monitor Network

```bash
# Start dev server with network logging
EXPO_DEBUG=1 npx expo start

# Check API calls in React Native Debugger
# Open: http://localhost:8081/debugger-ui
```

### Test Edge Function

```bash
# Test send-notification function
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "user-id",
    "type": "test",
    "title": "Test",
    "body": "Test notification"
  }'
```

## Getting Help

1. Check logs: `npx eas-cli@latest logs`
2. Check database: Supabase Dashboard
3. Check Edge Function: Supabase Dashboard → Edge Functions
4. Check RLS policies: Supabase Dashboard → SQL Editor

## Performance Benchmarks

| Operation          | Target  | Actual  |
| ------------------ | ------- | ------- |
| Load notifications | <500ms  | ~300ms  |
| Mark as read       | <200ms  | ~150ms  |
| Realtime latency   | <100ms  | 19-58ms |
| Memory usage       | <20MB   | ~10MB   |
| Battery impact     | Minimal | Minimal |

## Known Limitations

1. **Simulator:** Push notifications not supported
2. **Quiet hours:** Client-side only (Edge Function doesn't check)
3. **Batch operations:** Limited to 1000 notifications per query
4. **Realtime:** Max 250,000 concurrent connections

## Version History

- **v1.0.0** - Initial release
  - Push notifications
  - Realtime updates
  - Deep linking
  - Preferences management
```

---

## 3️⃣ UI/UX Polish

### Adım 3.1: Dark Mode Support

**Dosya:** `apps/mobile/src/components/notifications/NotificationCenter.tsx`

```typescript
import { useColorScheme } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function NotificationCenter() {
  const { scheme, colors } = useTheme();
  const colorScheme = useColorScheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Dark mode automatically applied via colors */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
  },
});
```

### Adım 3.2: Loading Animations

```typescript
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function SkeletonLoader() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.skeleton, animatedStyle]} />
  );
}
```

### Adım 3.3: Empty State

```typescript
export function EmptyNotifications() {
  return (
    <View style={styles.emptyContainer}>
      <BellIcon size={48} color="#999" />
      <Text style={styles.emptyTitle}>Bildirim Yok</Text>
      <Text style={styles.emptyText}>
        Yeni bildirimler burada görünecek
      </Text>
    </View>
  );
}
```

---

## 4️⃣ Error Handling & Monitoring

### Adım 4.1: Error Boundary

**Dosya:** `apps/mobile/src/components/NotificationErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NotificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Notification Error:', error, errorInfo);
    // Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Bildirim Hatası</Text>
          <Text style={styles.errorText}>
            Bildirimler yüklenirken bir hata oluştu
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Adım 4.2: Logging Service

**Dosya:** `apps/mobile/src/services/logger.ts`

```typescript
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️ ${message}`, data);
  },

  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data);
  },

  error: (message: string, error?: Error) => {
    console.error(`❌ ${message}`, error);
    // Send to Sentry
    // Sentry.captureException(error);
  },

  debug: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`🐛 ${message}`, data);
    }
  },
};
```

### Adım 4.3: Sentry Integration

```bash
npm install @sentry/react-native
```

**Dosya:** `apps/mobile/app/_layout.tsx`

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://your-sentry-dsn@sentry.io/project-id',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});

export default Sentry.wrap(Layout);
```

---

## 5️⃣ Production Checklist

- [ ] All JSDoc comments added
- [ ] README.md completed
- [ ] TROUBLESHOOTING.md completed
- [ ] Dark mode tested
- [ ] Animations smooth
- [ ] Error boundaries in place
- [ ] Logging configured
- [ ] Sentry integrated
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Tests passing (>85% coverage)
- [ ] Build optimized
- [ ] Environment variables set
- [ ] Secrets secured
- [ ] CI/CD configured

---

## 📊 Documentation Checklist

- [ ] JSDoc for all hooks
- [ ] JSDoc for all components
- [ ] JSDoc for all functions
- [ ] README.md with setup instructions
- [ ] TROUBLESHOOTING.md with common issues
- [ ] API reference documented
- [ ] Notification types documented
- [ ] Deep linking documented
- [ ] Performance metrics documented
- [ ] Security notes documented

---

## 🎨 UI/UX Checklist

- [ ] Dark mode support
- [ ] Loading animations
- [ ] Empty states
- [ ] Error states
- [ ] Skeleton screens
- [ ] Accessibility (a11y)
- [ ] Responsive design
- [ ] Touch targets (44x44pt minimum)
- [ ] Color contrast (WCAG AA)
- [ ] Font sizes readable

---

## 🔒 Security Checklist

- [ ] No tokens in logs
- [ ] HTTPS for all API calls
- [ ] RLS policies enforced
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak info
- [ ] Rate limiting implemented
- [ ] Input validation
- [ ] SQL injection prevention

---

**Sonraki Adım:** Production Deployment
