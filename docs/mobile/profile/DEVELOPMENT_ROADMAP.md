# Followers/Following Feature - Development Roadmap

## Phase 1: Real-Time List Updates ✅ (Current)

### 1.1 FollowersList Real-Time Sync
**Objective:** Update follower list in real-time when follow/unfollow actions occur

**Components:**
- `FollowersList.tsx` - Main followers list component
- `useFollowers.ts` - Hook for followers data
- `useFollowersRealtime.ts` - Real-time updates hook

**Implementation:**
```typescript
// Listen to follow/unfollow events
// Update followers list in real-time
// Remove/add users from list
// Update follow button states
```

**Tasks:**
- [ ] Integrate Realtime listener in FollowersList
- [ ] Handle follow/unfollow events
- [ ] Update list items in real-time
- [ ] Update follow button UI states
- [ ] Add optimistic updates
- [ ] Handle errors gracefully

**Database Events:**
- INSERT into followers table → Add to list
- DELETE from followers table → Remove from list
- UPDATE follow status → Update button state

**UI/UX:**
- Smooth animations when adding/removing
- Loading states for buttons
- Error messages
- Undo functionality (optional)

---

### 1.2 FollowingList Real-Time Sync
**Objective:** Update following list in real-time

**Similar to FollowersList but:**
- Listen for follower_id = currentUserId
- Show unfollow button
- Show message button

**Tasks:**
- [ ] Integrate Realtime listener in FollowingList
- [ ] Handle unfollow events
- [ ] Update list in real-time
- [ ] Sync with sort/filter state

---

## Phase 2: Search & Filter Followers

### 2.1 Search Functionality
**Objective:** Search followers/following by name, username, bio

**Components:**
- `FollowersSearchBar.tsx` - Search input component
- Enhanced `FollowersList.tsx` with search

**Implementation:**
```typescript
// Client-side search (fast, no API calls)
// Filter by display_name, username
// Real-time search results
// Debounced search
```

**Features:**
- [ ] Search input with clear button
- [ ] Real-time search results
- [ ] Debounce search (300ms)
- [ ] Case-insensitive search
- [ ] Highlight matches
- [ ] Recent searches (optional)

**Database:**
- No new queries needed (client-side filtering)
- Load all followers once, filter locally

---

### 2.2 Filter & Sort Options
**Objective:** Filter and sort followers/following

**Filter Options:**
- [ ] All followers
- [ ] Mutual followers (both follow each other)
- [ ] Recent followers
- [ ] Verified users (if applicable)

**Sort Options:**
- [ ] Default (by follow date, newest first)
- [ ] Alphabetical (A-Z)
- [ ] Alphabetical (Z-A)
- [ ] Most recent followers
- [ ] Oldest followers

**Implementation:**
```typescript
// Add filter/sort UI
// Combine with search
// Persist preferences
```

**UI Components:**
- [ ] Filter button/sheet
- [ ] Sort button/sheet
- [ ] Active filters display
- [ ] Clear filters button

---

## Phase 3: Block User Functionality

### 3.1 Block User Feature
**Objective:** Allow users to block other users

**Database Schema:**
```sql
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id),
  blocked_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- RLS Policies
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks" ON public.blocked_users
FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.blocked_users
FOR DELETE USING (auth.uid() = blocker_id);
```

**Features:**
- [ ] Block button in follower/following list
- [ ] Block confirmation dialog
- [ ] Blocked users list
- [ ] Unblock functionality
- [ ] Real-time block updates

**UI Components:**
- [ ] Block button (three-dot menu)
- [ ] Block confirmation sheet
- [ ] Blocked users screen
- [ ] Unblock button

**Business Logic:**
- [ ] Remove blocked user from followers/following
- [ ] Prevent blocked user from following
- [ ] Hide profile from blocked user
- [ ] Hide blocked user's content

**Implementation:**
```typescript
// Add block option to user menu
// Create blocked users screen
// Integrate with Realtime
// Update followers list when blocked
```

---

### 3.2 Blocked Users Management
**Objective:** Manage blocked users

**Features:**
- [ ] View all blocked users
- [ ] Search blocked users
- [ ] Unblock users
- [ ] Block history (optional)

**Screen:** `/app/(profile)/blocked-users`

**Components:**
- `BlockedUsersList.tsx`
- `BlockedUserItem.tsx`
- `UnblockConfirmation.tsx`

---

## Phase 4: Follow Suggestions

### 4.1 Suggested Users
**Objective:** Show users to follow based on various criteria

**Suggestion Algorithms:**
1. **Mutual Followers** - Users followed by people you follow
2. **Popular Users** - Users with most followers
3. **Recent Users** - Recently joined users
4. **Trending** - Most followed this week
5. **Similar Interests** - Based on bio/profile (future)

**Database Queries:**
```sql
-- Mutual followers
SELECT DISTINCT f2.follower_id
FROM followers f1
JOIN followers f2 ON f1.follower_id = f2.following_id
WHERE f1.following_id = $1
  AND f2.follower_id != $1
  AND NOT EXISTS (
    SELECT 1 FROM followers
    WHERE follower_id = $1 AND following_id = f2.follower_id
  );

-- Popular users
SELECT id, display_name, avatar_url,
  (SELECT COUNT(*) FROM followers WHERE following_id = profiles.id) as follower_count
FROM profiles
WHERE type = 'real'
  AND id != $1
ORDER BY follower_count DESC
LIMIT 20;
```

**Features:**
- [ ] Suggestions screen
- [ ] Multiple suggestion types
- [ ] Follow button on suggestions
- [ ] Dismiss suggestions
- [ ] Refresh suggestions
- [ ] Real-time follow updates

**UI Components:**
- `SuggestionsScreen.tsx`
- `SuggestionCard.tsx`
- `SuggestionTabs.tsx` (Mutual, Popular, Recent, etc.)

**Implementation:**
```typescript
// Create suggestions hook
// Fetch suggestions from API
// Display with follow button
// Handle follow/unfollow
// Real-time updates
```

**API Endpoints (if needed):**
- `GET /api/suggestions/mutual`
- `GET /api/suggestions/popular`
- `GET /api/suggestions/recent`
- `GET /api/suggestions/trending`

---

## Phase 5: Notifications System (Detailed Planning)

### 5.1 Notification Types
```typescript
enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  FOLLOW_ACCEPTED = 'follow_accepted',
  MESSAGE = 'message',
  LIKE = 'like',
  COMMENT = 'comment',
  MENTION = 'mention'
}
```

### 5.2 Database Schema
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb, -- Additional data (post_id, comment_id, etc.)
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);
```

### 5.3 Notification Features
- [ ] Real-time notification badge
- [ ] Notification center screen
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Notification preferences
- [ ] Push notifications (optional)

### 5.4 Real-Time Notifications
```typescript
// Listen to notifications table
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications',
  filter: `user_id=eq.${currentUserId}`
}, (payload) => {
  // Update notification badge
  // Show toast notification
  // Add to notifications list
});
```

### 5.5 Notification Triggers
- **New Follower:** When someone follows you
- **Follow Accepted:** When someone accepts your follow request (if applicable)
- **Message:** When someone messages you
- **Like:** When someone likes your post
- **Comment:** When someone comments on your post
- **Mention:** When someone mentions you

---

## Implementation Order

### Week 1: Real-Time List Updates
1. FollowersList Real-Time Sync
2. FollowingList Real-Time Sync
3. Testing & Bug Fixes

### Week 2: Search & Filter
1. Search Functionality
2. Filter Options
3. Sort Options
4. UI Polish

### Week 3: Block User
1. Block User Feature
2. Blocked Users Management
3. Integration with followers list

### Week 4: Follow Suggestions
1. Suggestion Algorithms
2. Suggestions Screen
3. Real-Time Updates
4. Testing

### Week 5+: Notifications
1. Database Schema
2. Notification Center
3. Real-Time Notifications
4. Push Notifications (optional)

---

## Testing Strategy

### Unit Tests
- [ ] Search/filter logic
- [ ] Block user logic
- [ ] Suggestion algorithms
- [ ] Notification creation

### Integration Tests
- [ ] Real-time list updates
- [ ] Follow/unfollow flow
- [ ] Block/unblock flow
- [ ] Notification delivery

### E2E Tests
- [ ] Complete user flows
- [ ] Real-time synchronization
- [ ] Error scenarios
- [ ] Performance under load

---

## Performance Considerations

1. **Pagination:** Implement pagination for large follower lists
2. **Caching:** Cache suggestions and blocked users
3. **Lazy Loading:** Load followers/following on scroll
4. **Debouncing:** Debounce search queries
5. **Batch Operations:** Batch notification creation
6. **Indexes:** Add database indexes for common queries

---

## Security Considerations

1. **RLS Policies:** Ensure proper row-level security
2. **Rate Limiting:** Limit follow/unfollow/block operations
3. **Validation:** Validate all user inputs
4. **Authorization:** Check user permissions before operations
5. **Audit Logging:** Log sensitive operations (block, unblock)

---

## Documentation Files

- `REALTIME_IMPLEMENTATION.md` - Current real-time setup
- `DEVELOPMENT_ROADMAP.md` - This file
- `NOTIFICATIONS_SYSTEM.md` - Detailed notifications planning (to be created)
- `SEARCH_FILTER_GUIDE.md` - Search/filter implementation (to be created)
- `BLOCK_USER_GUIDE.md` - Block user feature (to be created)
- `SUGGESTIONS_GUIDE.md` - Follow suggestions (to be created)
