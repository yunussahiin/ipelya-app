/**
 * useFollowersListRealtime Hook
 * Listens to real-time follow/unfollow changes for followers list
 */

import { useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

interface FollowChangePayload {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UseFollowersListRealtimeProps {
  userId: string;
  currentUserId?: string;
  onFollowChange?: (followerId: string, isFollowing: boolean) => void;
  onListRefresh?: () => void;
}

export function useFollowersListRealtime({
  userId,
  currentUserId,
  onFollowChange,
  onListRefresh
}: UseFollowersListRealtimeProps) {
  useEffect(() => {
    if (!userId || !currentUserId) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to followers table changes
        channel = supabase.channel(`followers-list-${userId}`, {
          config: {
            broadcast: { self: false }
          }
        });

        // Listen for new follows (INSERT)
        // When someone follows this user, refresh the list
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "followers",
            filter: `following_id=eq.${userId}`
          },
          () => {
            if (onListRefresh) {
              onListRefresh();
            }
          }
        );

        // Listen for new follows by currentUser
        // When currentUserId follows someone, update follow state
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "followers",
            filter: `follower_id=eq.${currentUserId}`
          },
          (payload) => {
            const newData = payload.new as FollowChangePayload;
            if (onFollowChange) {
              onFollowChange(newData.following_id, true);
            }
          }
        );

        // Listen for unfollows (DELETE)
        // When currentUserId unfollows someone, remove them from the list
        channel.on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "followers"
          },
          (payload) => {
            const oldData = payload.old as FollowChangePayload;
            if (oldData.follower_id === currentUserId && onFollowChange) {
              onFollowChange(oldData.following_id, false);
            }
          }
        );

        await channel.subscribe();
      } catch (err) {
        logger.error('Followers list realtime subscription error', err, { tag: 'Followers' });
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, currentUserId, onFollowChange]);
}
