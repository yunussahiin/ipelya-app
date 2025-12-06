/**
 * useFollowersRealtime Hook
 * Listens to real-time follower count changes via Supabase Realtime
 */

import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface FollowersRealtimeStats {
  followers_count: number;
  following_count: number;
}

export function useFollowersRealtime(userId: string | undefined) {
  const [stats, setStats] = useState<FollowersRealtimeStats>({
    followers_count: 0,
    following_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial stats
  const loadInitialStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      logger.debug(`Loading followers stats for: ${userId}`, { tag: "Followers" });

      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersError) throw followersError;

      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followingError) throw followingError;

      logger.debug(`Stats loaded: ${followersCount} followers, ${followingCount} following`, { tag: "Followers" });

      setStats({
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stats";
      setError(message);
      logger.error("Load followers stats error", err, { tag: "Followers" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Load initial stats FIRST
        await loadInitialStats();

        // THEN subscribe to followers table changes
        channel = supabase.channel(`followers-${userId}`, {
          config: {
            broadcast: { self: false }
          }
        });

        // Listen for INSERT/DELETE on followers table (followers count)
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "followers",
            filter: `following_id=eq.${userId}`
          },
          () => {
            setStats((prev) => ({
              ...prev,
              followers_count: prev.followers_count + 1
            }));
          }
        );

        // Listen for ALL DELETE events (no filter due to RLS)
        channel.on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "followers"
          },
          (payload) => {
            const oldData = payload.old as { following_id?: string; follower_id?: string };

            if (oldData?.following_id === userId) {
              setStats((prev) => ({
                ...prev,
                followers_count: Math.max(0, prev.followers_count - 1)
              }));
            }

            if (oldData?.follower_id === userId) {
              setStats((prev) => ({
                ...prev,
                following_count: Math.max(0, prev.following_count - 1)
              }));
            }
          }
        );

        // Listen for INSERT on followers table (following count)
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "followers",
            filter: `follower_id=eq.${userId}`
          },
          () => {
            setStats((prev) => ({
              ...prev,
              following_count: prev.following_count + 1
            }));
          }
        );

        await channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            logger.debug("Followers subscription active", { tag: "Followers" });
          } else if (status === "CHANNEL_ERROR") {
            setError("Failed to subscribe to real-time updates");
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Subscription error";
        setError(message);
        logger.error("Realtime subscription error", err, { tag: "Followers" });
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, loadInitialStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadInitialStats
  };
}
