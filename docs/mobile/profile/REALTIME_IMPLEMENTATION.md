# Supabase Realtime Implementation Guide

## Overview
Real-time follower/following count updates using Supabase Realtime CDC (Change Data Capture).

## Architecture

### Components
- **useFollowersRealtime Hook** - Manages real-time stats subscriptions
- **Profile Screen** - Displays real-time follower/following counts
- **Followers Screen** - Shows real-time tab counters
- **SkeletonLoader** - Loading UI during tab transitions

### Database Setup

#### 1. Table Configuration
```sql
-- followers table structure
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id),
  following_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- CRITICAL: Set REPLICA IDENTITY FULL for DELETE events
-- This ensures DELETE events include all old row data (follower_id, following_id)
ALTER TABLE public.followers REPLICA IDENTITY FULL;
```

#### 2. Realtime Publication
```sql
-- Create publication for Realtime CDC
CREATE PUBLICATION supabase_realtime FOR TABLE public.followers;
```

#### 3. Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- SELECT policy - allows Realtime to see all data
CREATE POLICY "Realtime can see all" ON public.followers
FOR SELECT USING (true);

-- INSERT policy - users can only follow others
CREATE POLICY "Users can insert own" ON public.followers
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- DELETE policy - users can only unfollow themselves
CREATE POLICY "Users can delete own" ON public.followers
FOR DELETE USING (auth.uid() = follower_id);
```

**Note:** Currently RLS is DISABLED for testing. In production, use the policies above.

## Implementation Details

### useFollowersRealtime Hook

**Location:** `/src/hooks/useFollowersRealtime.ts`

**Functionality:**
1. Load initial stats from database
2. Subscribe to Realtime channel
3. Listen for INSERT events (follow)
4. Listen for DELETE events (unfollow)
5. Update state in real-time

**Key Points:**
- Initial stats load BEFORE subscription setup (prevents race conditions)
- DELETE events listened without filter (RLS limitation)
- Manual filtering based on `following_id` and `follower_id`
- Comprehensive logging for debugging

**Usage:**
```typescript
const { stats, loading, error, refetch } = useFollowersRealtime(userId);

// stats = { followers_count: number, following_count: number }
```

### Event Listeners

#### INSERT Events
```typescript
// Listen for new followers
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'followers',
  filter: `following_id=eq.${userId}`
}, (payload) => {
  // followers_count += 1
});

// Listen for new following
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'followers',
  filter: `follower_id=eq.${userId}`
}, (payload) => {
  // following_count += 1
});
```

#### DELETE Events
```typescript
// Listen for ALL DELETE events (no filter due to RLS)
channel.on('postgres_changes', {
  event: 'DELETE',
  schema: 'public',
  table: 'followers'
}, (payload) => {
  const oldData = payload.old;
  
  // Check if affects followers count
  if (oldData.following_id === userId) {
    // followers_count -= 1
  }
  
  // Check if affects following count
  if (oldData.follower_id === userId) {
    // following_count -= 1
  }
});
```

## Integration Points

### Profile Screen (`/app/(profile)/index.tsx`)
```typescript
import { useFollowersRealtime } from '@/hooks/useFollowersRealtime';

export default function ProfileScreen() {
  const [currentUserId, setCurrentUserId] = useState<string>();
  const { stats: followersStats } = useFollowersRealtime(currentUserId);
  
  // Display stats
  <Text>{followersStats.followers_count}</Text>
  <Text>{followersStats.following_count}</Text>
}
```

### Followers Screen (`/app/(profile)/followers.tsx`)
```typescript
import { useFollowersRealtime } from '@/hooks/useFollowersRealtime';

export default function FollowersScreen() {
  const { stats: realtimeStats } = useFollowersRealtime(currentUserId);
  
  // Display in tab counters
  <Text>{realtimeStats.followers_count}</Text>
  <Text>{realtimeStats.following_count}</Text>
}
```

## Debugging

### Console Logs
The hook includes detailed logging:

```
🗑️ DELETE event received: {...}
🎯 Current userId: ...
📋 oldData.following_id: ...
📋 oldData.follower_id: ...
✅ Follower removed - following_id matches!
📉 Updated followers count: 3 → 2
```

### Common Issues

#### Issue: DELETE events not received
**Cause:** REPLICA IDENTITY not set to FULL
**Solution:**
```sql
ALTER TABLE public.followers REPLICA IDENTITY FULL;
```

#### Issue: DELETE events missing old data
**Cause:** RLS policy blocking data visibility
**Solution:** Ensure SELECT policy allows data visibility or disable RLS for testing

#### Issue: Stats not updating
**Cause:** Race condition between initial load and subscription
**Solution:** Load initial stats BEFORE setting up subscription listeners

## Performance Considerations

1. **Channel Name:** Uses `followers-${userId}` for per-user channels
2. **Broadcast:** Disabled (`self: false`) to avoid duplicate events
3. **Memory:** Cleanup on unmount via `removeChannel()`
4. **Polling:** No polling - pure event-driven updates

## Security Notes

### Current State
- RLS is **DISABLED** for development/testing
- All authenticated users can see all followers data

### Production Recommendations
1. Enable RLS with proper policies
2. Implement proper authorization checks
3. Add audit logging for follow/unfollow actions
4. Rate limit follow/unfollow operations
5. Validate user IDs on backend

## Testing Checklist

- [ ] Follow user → followers_count increases
- [ ] Unfollow user → followers_count decreases
- [ ] Follow/unfollow rapidly → counts stay accurate
- [ ] Switch profiles → stats update correctly
- [ ] Refresh page → initial stats load correctly
- [ ] Close and reopen app → stats persist

## Related Files

- `/src/hooks/useFollowersRealtime.ts` - Main hook
- `/app/(profile)/index.tsx` - Profile screen integration
- `/app/(profile)/followers.tsx` - Followers screen integration
- `/src/components/profile/FollowersList.tsx` - Followers list component
- `/src/components/profile/FollowingList.tsx` - Following list component
- `/src/services/followers.service.ts` - API service

## Future Improvements

1. Real-time follow/unfollow in FollowersList
2. Search/filter followers with real-time sync
3. Block user functionality
4. Follow suggestions
5. Notifications for new followers
6. Presence tracking (online status)
