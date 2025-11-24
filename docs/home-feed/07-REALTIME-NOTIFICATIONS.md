# İpelya Home Feed - Realtime & Notifications

## 🔄 Genel Bakış

Bu döküman, İpelya Home Feed sisteminin realtime güncellemelerini, push notification stratejisini ve WebSocket yönetimini detaylı olarak açıklar.

---

## 📡 Supabase Realtime

### 1. Channel Setup

**Feed Channel:**
```typescript
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const supabase = createBrowserSupabaseClient();

// Subscribe to feed updates
const feedChannel = supabase
  .channel(`feed:user:${userId}`)
  .on('broadcast', { event: 'new_post' }, (payload) => {
    console.log('New post:', payload);
    // Update feed state
  })
  .on('broadcast', { event: 'post_update' }, (payload) => {
    console.log('Post updated:', payload);
    // Update specific post
  })
  .on('broadcast', { event: 'post_delete' }, (payload) => {
    console.log('Post deleted:', payload);
    // Remove post from feed
  })
  .subscribe();

// Cleanup
return () => {
  feedChannel.unsubscribe();
};
```

---

### 2. Post Interactions Channel

**Like/Comment/Share Updates:**
```typescript
const postChannel = supabase
  .channel(`post:${postId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'post_likes',
    filter: `post_id=eq.${postId}`,
  }, (payload) => {
    console.log('New like:', payload);
    // Update like count
    setLikesCount((prev) => prev + 1);
  })
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'post_likes',
    filter: `post_id=eq.${postId}`,
  }, (payload) => {
    console.log('Like removed:', payload);
    // Update like count
    setLikesCount((prev) => prev - 1);
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'post_comments',
    filter: `post_id=eq.${postId}`,
  }, (payload) => {
    console.log('New comment:', payload);
    // Add comment to list
    setComments((prev) => [...prev, payload.new]);
  })
  .subscribe();
```

---

### 3. Presence (Online Users)

**Track Online Users:**
```typescript
const presenceChannel = supabase
  .channel('online_users')
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    console.log('Online users:', Object.keys(state).length);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
      });
    }
  });
```

---

### 4. Broadcast Events

**Server-side Broadcast:**
```typescript
// Edge Function: create-post
const broadcastNewPost = async (post: Post) => {
  const supabase = createAdminSupabaseClient();
  
  // Get followers
  const { data: followers } = await supabase
    .from('user_connections')
    .select('user_id')
    .eq('connected_user_id', post.user_id)
    .eq('connection_type', 'follow')
    .eq('status', 'accepted');
  
  if (!followers) return;
  
  // Broadcast to each follower
  for (const follower of followers) {
    await supabase
      .channel(`feed:user:${follower.user_id}`)
      .send({
        type: 'broadcast',
        event: 'new_post',
        payload: {
          post_id: post.id,
          user: {
            id: post.user_id,
            name: post.user.name,
            avatar: post.user.avatar,
          },
          caption: post.caption,
          created_at: post.created_at,
        },
      });
  }
};
```

---

## 🔔 Push Notifications

### 1. Expo Notifications Setup

**Installation:**
```bash
npx expo install expo-notifications expo-device expo-constants
```

**Configuration:**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions
const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;
  
  return token;
};

// Save token to database
const savePushToken = async (userId: string, token: string) => {
  await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      platform: Device.osName,
      updated_at: new Date().toISOString(),
    });
};
```

---

### 2. Notification Types

**Like Notification:**
```typescript
interface LikeNotification {
  type: 'like';
  data: {
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
  };
}

const sendLikeNotification = async (
  recipientId: string,
  likerId: string,
  postId: string
) => {
  const { data: liker } = await supabase
    .from('profiles')
    .select('name, avatar')
    .eq('user_id', likerId)
    .single();
  
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientId);
  
  if (!tokens || tokens.length === 0) return;
  
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title: 'Yeni Beğeni',
    body: `${liker?.name} gönderini beğendi`,
    data: {
      type: 'like',
      post_id: postId,
      user_id: likerId,
    },
  }));
  
  await sendPushNotifications(messages);
};
```

**Comment Notification:**
```typescript
interface CommentNotification {
  type: 'comment';
  data: {
    post_id: string;
    comment_id: string;
    user_id: string;
    user_name: string;
    comment_text: string;
  };
}

const sendCommentNotification = async (
  recipientId: string,
  commenterId: string,
  postId: string,
  commentText: string
) => {
  const { data: commenter } = await supabase
    .from('profiles')
    .select('name, avatar')
    .eq('user_id', commenterId)
    .single();
  
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientId);
  
  if (!tokens || tokens.length === 0) return;
  
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title: 'Yeni Yorum',
    body: `${commenter?.name}: ${commentText.substring(0, 50)}...`,
    data: {
      type: 'comment',
      post_id: postId,
      user_id: commenterId,
    },
  }));
  
  await sendPushNotifications(messages);
};
```

**Mention Notification:**
```typescript
const sendMentionNotification = async (
  recipientId: string,
  mentionerId: string,
  postId: string
) => {
  const { data: mentioner } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', mentionerId)
    .single();
  
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientId);
  
  if (!tokens || tokens.length === 0) return;
  
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title: 'Seni Etiketledi',
    body: `${mentioner?.name} seni bir gönderide etiketledi`,
    data: {
      type: 'mention',
      post_id: postId,
      user_id: mentionerId,
    },
  }));
  
  await sendPushNotifications(messages);
};
```

**New Follower Notification:**
```typescript
const sendFollowerNotification = async (
  recipientId: string,
  followerId: string
) => {
  const { data: follower } = await supabase
    .from('profiles')
    .select('name, avatar')
    .eq('user_id', followerId)
    .single();
  
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', recipientId);
  
  if (!tokens || tokens.length === 0) return;
  
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: 'default',
    title: 'Yeni Takipçi',
    body: `${follower?.name} seni takip etmeye başladı`,
    data: {
      type: 'follower',
      user_id: followerId,
    },
  }));
  
  await sendPushNotifications(messages);
};
```

---

### 3. Batch Notification Sending

**Expo Push API:**
```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const sendPushNotifications = async (
  messages: {
    to: string;
    sound?: 'default' | null;
    title: string;
    body: string;
    data?: any;
  }[]
) => {
  // Filter valid tokens
  const validMessages = messages.filter((message) =>
    Expo.isExpoPushToken(message.to)
  );
  
  // Chunk messages (max 100 per request)
  const chunks = expo.chunkPushNotifications(validMessages);
  
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
  
  return tickets;
};
```

---

### 4. Notification Preferences

**User Settings:**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Preferences
  likes_enabled BOOLEAN DEFAULT TRUE,
  comments_enabled BOOLEAN DEFAULT TRUE,
  mentions_enabled BOOLEAN DEFAULT TRUE,
  followers_enabled BOOLEAN DEFAULT TRUE,
  messages_enabled BOOLEAN DEFAULT TRUE,
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);
```

**Check Preferences:**
```typescript
const shouldSendNotification = async (
  userId: string,
  notificationType: string
): Promise<boolean> => {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!prefs) return true; // Default: send all
  
  // Check type preference
  const typeKey = `${notificationType}_enabled` as keyof typeof prefs;
  if (!prefs[typeKey]) return false;
  
  // Check quiet hours
  if (prefs.quiet_hours_enabled) {
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}:00`;
    
    if (
      currentTime >= prefs.quiet_hours_start &&
      currentTime <= prefs.quiet_hours_end
    ) {
      return false;
    }
  }
  
  return true;
};
```

---

## 🔄 Realtime Hooks

### 1. useFeedRealtime

**Hook Implementation:**
```typescript
import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export const useFeedRealtime = (
  userId: string,
  onNewPost: (post: any) => void,
  onPostUpdate: (post: any) => void,
  onPostDelete: (postId: string) => void
) => {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    
    const channel = supabase
      .channel(`feed:user:${userId}`)
      .on('broadcast', { event: 'new_post' }, (payload) => {
        onNewPost(payload.payload);
      })
      .on('broadcast', { event: 'post_update' }, (payload) => {
        onPostUpdate(payload.payload);
      })
      .on('broadcast', { event: 'post_delete' }, (payload) => {
        onPostDelete(payload.payload.post_id);
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNewPost, onPostUpdate, onPostDelete]);
};
```

**Usage:**
```typescript
const FeedScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  
  useFeedRealtime(
    userId,
    (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    },
    (updatedPost) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
      );
    },
    (deletedPostId) => {
      setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    }
  );
  
  return <FeedList posts={posts} />;
};
```

---

### 2. usePostRealtime

**Hook Implementation:**
```typescript
export const usePostRealtime = (
  postId: string,
  onLike: () => void,
  onUnlike: () => void,
  onComment: (comment: any) => void
) => {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    
    const channel = supabase
      .channel(`post:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`,
      }, onLike)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`,
      }, onUnlike)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        onComment(payload.new);
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [postId, onLike, onUnlike, onComment]);
};
```

---

### 3. useNotifications

**Hook Implementation:**
```typescript
export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [userId]);
  
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => prev - 1);
  };
  
  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
```

---

## 📊 Notification Analytics

**Track Notification Engagement:**
```typescript
const trackNotificationEngagement = async (
  notificationId: string,
  action: 'delivered' | 'opened' | 'clicked' | 'dismissed'
) => {
  await supabase.from('notification_analytics').insert({
    notification_id: notificationId,
    action,
    timestamp: new Date().toISOString(),
  });
};
```

**Notification Metrics:**
```sql
CREATE MATERIALIZED VIEW notification_metrics AS
SELECT
  notification_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN action = 'opened' THEN 1 END) as total_opened,
  COUNT(CASE WHEN action = 'clicked' THEN 1 END) as total_clicked,
  (COUNT(CASE WHEN action = 'opened' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) as open_rate,
  (COUNT(CASE WHEN action = 'clicked' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) as click_rate
FROM notification_analytics
GROUP BY notification_type;
```

---

## 🔧 Error Handling

**Retry Logic:**
```typescript
const sendNotificationWithRetry = async (
  message: any,
  maxRetries: number = 3
) => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendPushNotifications([message]);
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(`Retry ${i + 1}/${maxRetries} failed:`, error);
      
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  // Log failed notification
  await supabase.from('failed_notifications').insert({
    message,
    error: lastError?.message,
    attempts: maxRetries,
  });
};
```

---

**Son Güncelleme:** 2025-11-24 03:56 UTC+03:00
**Durum:** Tamamlandı ✅
