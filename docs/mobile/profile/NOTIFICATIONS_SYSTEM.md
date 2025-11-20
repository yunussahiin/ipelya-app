# Notifications System - Detailed Implementation Guide

## Overview
Real-time notification system for user activities (new followers, messages, likes, comments, mentions).

## Architecture

### Components
- **Notifications Table** - Store all notifications
- **Realtime Listener** - Listen for new notifications
- **Notification Center** - Display all notifications
- **Notification Badge** - Show unread count
- **Toast Notifications** - Show instant notifications
- **Push Notifications** - Optional mobile notifications

## Database Schema

### Notifications Table
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'new_follower',
    'follow_accepted',
    'message',
    'like',
    'comment',
    'mention'
  )),
  title text NOT NULL,
  description text,
  data jsonb, -- Additional data: { post_id, comment_id, message_id, etc. }
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
```

### Notification Preferences Table (Optional)
```sql
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  new_follower boolean DEFAULT true,
  follow_accepted boolean DEFAULT true,
  message boolean DEFAULT true,
  like boolean DEFAULT true,
  comment boolean DEFAULT true,
  mention boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.notification_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
FOR UPDATE USING (auth.uid() = user_id);
```

## Notification Types

### 1. New Follower
```typescript
{
  type: 'new_follower',
  title: 'New Follower',
  description: 'yunussahin38 started following you',
  data: {
    follower_id: 'user-uuid',
    follower_name: 'yunussahin38'
  }
}
```

**Trigger:** When someone follows you
**Action:** Navigate to follower's profile

### 2. Follow Accepted
```typescript
{
  type: 'follow_accepted',
  title: 'Follow Request Accepted',
  description: 'Yunus Creator accepted your follow request',
  data: {
    user_id: 'user-uuid',
    user_name: 'Yunus Creator'
  }
}
```

**Trigger:** When someone accepts your follow request (if applicable)
**Action:** Navigate to user's profile

### 3. Message
```typescript
{
  type: 'message',
  title: 'New Message',
  description: 'yunussahin38: Hey, how are you?',
  data: {
    sender_id: 'user-uuid',
    sender_name: 'yunussahin38',
    message_id: 'msg-uuid',
    conversation_id: 'conv-uuid'
  }
}
```

**Trigger:** When someone sends you a message
**Action:** Navigate to conversation

### 4. Like
```typescript
{
  type: 'like',
  title: 'New Like',
  description: 'yunussahin38 liked your post',
  data: {
    user_id: 'user-uuid',
    user_name: 'yunussahin38',
    post_id: 'post-uuid'
  }
}
```

**Trigger:** When someone likes your post
**Action:** Navigate to post

### 5. Comment
```typescript
{
  type: 'comment',
  title: 'New Comment',
  description: 'yunussahin38: Great post!',
  data: {
    user_id: 'user-uuid',
    user_name: 'yunussahin38',
    post_id: 'post-uuid',
    comment_id: 'comment-uuid'
  }
}
```

**Trigger:** When someone comments on your post
**Action:** Navigate to post with comment highlighted

### 6. Mention
```typescript
{
  type: 'mention',
  title: 'You were mentioned',
  description: 'yunussahin38 mentioned you in a comment',
  data: {
    user_id: 'user-uuid',
    user_name: 'yunussahin38',
    post_id: 'post-uuid',
    comment_id: 'comment-uuid'
  }
}
```

**Trigger:** When someone mentions you in a comment/post
**Action:** Navigate to post/comment

## Implementation

### Hook: useNotifications

```typescript
// /src/hooks/useNotifications.ts

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  title: string;
  description: string;
  data: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  // 1. Load initial notifications
  // 2. Subscribe to new notifications via Realtime
  // 3. Listen for INSERT events
  // 4. Update unread count
  // 5. Cleanup on unmount
}
```

### Component: NotificationCenter

```typescript
// /src/components/notifications/NotificationCenter.tsx

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications(userId);
  
  return (
    <View>
      {/* Header with unread count */}
      {/* List of notifications */}
      {/* Empty state */}
      {/* Mark all as read button */}
    </View>
  );
}
```

### Component: NotificationBadge

```typescript
// /src/components/notifications/NotificationBadge.tsx

export function NotificationBadge() {
  const { unreadCount } = useNotifications(userId);
  
  return (
    <View>
      {unreadCount > 0 && (
        <Badge count={unreadCount} />
      )}
    </View>
  );
}
```

### Component: NotificationItem

```typescript
// /src/components/notifications/NotificationItem.tsx

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
}

export function NotificationItem({ notification, onPress, onDelete }: NotificationItemProps) {
  return (
    <Pressable onPress={onPress}>
      {/* Avatar */}
      {/* Title and description */}
      {/* Time ago */}
      {/* Read indicator */}
      {/* Delete button */}
    </Pressable>
  );
}
```

### Service: NotificationService

```typescript
// /src/services/notifications.service.ts

export class NotificationService {
  // Create notification
  static async createNotification(
    userId: string,
    actorId: string,
    type: NotificationType,
    title: string,
    description: string,
    data: Record<string, any>
  ): Promise<Notification> {
    // Insert into notifications table
  }

  // Get notifications
  static async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Notification[]> {
    // Fetch notifications
  }

  // Mark as read
  static async markAsRead(notificationId: string): Promise<void> {
    // Update read status
  }

  // Mark all as read
  static async markAllAsRead(userId: string): Promise<void> {
    // Update all notifications
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    // Delete notification
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    // Count unread notifications
  }
}
```

## Realtime Integration

### Listen for New Notifications

```typescript
// In useNotifications hook

const setupRealtimeSubscription = async () => {
  const channel = supabase.channel(`notifications-${userId}`);

  // Listen for new notifications
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Add new notification to list
      // Update unread count
      // Show toast notification
      // Play sound (optional)
    }
  );

  // Listen for read status updates
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update notification read status
      // Update unread count
    }
  );

  await channel.subscribe();
};
```

## Notification Triggers

### New Follower Notification

```typescript
// When someone follows you
// In follow action handler

const handleFollow = async (targetUserId: string) => {
  // Follow user
  const success = await followUser(targetUserId);

  if (success) {
    // Create notification for target user
    await NotificationService.createNotification(
      targetUserId, // user_id (who receives notification)
      currentUserId, // actor_id (who performed action)
      'new_follower',
      'New Follower',
      `${currentUserName} started following you`,
      {
        follower_id: currentUserId,
        follower_name: currentUserName
      }
    );
  }
};
```

### Message Notification

```typescript
// When someone sends a message
// In message send handler

const handleSendMessage = async (conversationId: string, message: string) => {
  // Send message
  const msg = await sendMessage(conversationId, message);

  if (msg) {
    // Get conversation participants
    const participants = await getConversationParticipants(conversationId);

    // Create notification for each participant (except sender)
    for (const participant of participants) {
      if (participant.id !== currentUserId) {
        await NotificationService.createNotification(
          participant.id,
          currentUserId,
          'message',
          'New Message',
          `${currentUserName}: ${message.substring(0, 50)}...`,
          {
            sender_id: currentUserId,
            sender_name: currentUserName,
            message_id: msg.id,
            conversation_id: conversationId
          }
        );
      }
    }
  }
};
```

## UI Screens

### Notification Center Screen

**Location:** `/app/(notifications)/center`

**Features:**
- [ ] List of all notifications
- [ ] Filter by type
- [ ] Mark as read
- [ ] Delete notification
- [ ] Empty state
- [ ] Pull to refresh
- [ ] Pagination

**Navigation:**
- From notification badge
- From bottom tab
- From push notification

### Notification Preferences Screen

**Location:** `/app/(settings)/notification-preferences`

**Features:**
- [ ] Toggle notification types
- [ ] Toggle push notifications
- [ ] Toggle email notifications
- [ ] Save preferences

## Toast Notifications

Show instant feedback when notification arrives:

```typescript
// Show toast when new notification arrives
Toast.show({
  type: 'info',
  text1: notification.title,
  text2: notification.description,
  duration: 4000,
  onPress: () => {
    // Navigate based on notification type
    handleNotificationPress(notification);
  }
});
```

## Push Notifications (Optional)

### Setup
1. Configure Firebase Cloud Messaging (FCM)
2. Store FCM tokens in database
3. Send notifications via FCM API

### Implementation
```typescript
// Store FCM token
const storeFCMToken = async (userId: string, token: string) => {
  await supabase
    .from('user_devices')
    .upsert({
      user_id: userId,
      fcm_token: token,
      device_type: Platform.OS
    });
};

// Send push notification via backend
const sendPushNotification = async (notification: Notification) => {
  // Call backend API
  // Backend sends via FCM
};
```

## Performance Optimization

1. **Pagination:** Load 20 notifications per page
2. **Caching:** Cache notifications locally
3. **Indexing:** Use database indexes for queries
4. **Batch Operations:** Batch mark as read
5. **Cleanup:** Delete old notifications (30+ days)

## Testing

### Unit Tests
- [ ] Notification creation
- [ ] Mark as read logic
- [ ] Unread count calculation
- [ ] Notification filtering

### Integration Tests
- [ ] Real-time notification delivery
- [ ] Toast notification display
- [ ] Navigation from notification
- [ ] Preferences update

### E2E Tests
- [ ] Complete notification flow
- [ ] Real-time synchronization
- [ ] Push notifications

## Security

1. **RLS Policies:** Users can only see their own notifications
2. **Validation:** Validate actor_id and user_id
3. **Rate Limiting:** Limit notification creation
4. **Audit Logging:** Log notification creation
5. **Data Privacy:** Don't expose sensitive data in notifications

## Future Enhancements

1. **Notification Grouping:** Group similar notifications
2. **Smart Notifications:** ML-based notification ranking
3. **Notification Scheduling:** Schedule notifications
4. **Notification Analytics:** Track notification engagement
5. **Notification Templates:** Customizable notification templates
6. **Notification Channels:** Different channels for different types
