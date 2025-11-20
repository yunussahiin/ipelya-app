/**
 * useFollowersRealtime Hook
 * Listens to real-time follower count changes via Supabase Realtime
 */

import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

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
    if (!userId) {
      console.log("⚠️ No userId provided to useFollowersRealtime");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📊 Loading followers stats for userId:", userId);

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

      console.log("✅ Followers stats loaded:", { followersCount, followingCount });

      setStats({
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stats";
      setError(message);
      console.error("❌ Load followers realtime stats error:", err);
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
          (payload) => {
            console.log("📊 New follower:", payload.new);
            setStats((prev) => {
              const updated = {
                ...prev,
                followers_count: prev.followers_count + 1
              };
              console.log("📈 Updated followers count:", updated.followers_count);
              return updated;
            });
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
            const oldData = payload.old as any;
            console.log("🗑️ DELETE event received:", JSON.stringify(oldData));
            console.log("🎯 Current userId:", userId);
            console.log("📋 oldData.following_id:", oldData?.following_id);
            console.log("📋 oldData.follower_id:", oldData?.follower_id);

            // Check if this affects followers count
            if (oldData?.following_id === userId) {
              console.log("✅ Follower removed - following_id matches!");
              setStats((prev) => {
                const updated = {
                  ...prev,
                  followers_count: Math.max(0, prev.followers_count - 1)
                };
                console.log("📉 Updated followers count:", prev.followers_count, "→", updated.followers_count);
                return updated;
              });
            } else {
              console.log("❌ Follower removed - following_id does NOT match");
            }

            // Check if this affects following count
            if (oldData?.follower_id === userId) {
              console.log("✅ Unfollowed - follower_id matches!");
              setStats((prev) => {
                const updated = {
                  ...prev,
                  following_count: Math.max(0, prev.following_count - 1)
                };
                console.log("📉 Updated following count:", prev.following_count, "→", updated.following_count);
                return updated;
              });
            } else {
              console.log("❌ Unfollowed - follower_id does NOT match");
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
          (payload) => {
            console.log("📊 Now following:", payload.new);
            setStats((prev) => ({
              ...prev,
              following_count: prev.following_count + 1
            }));
          }
        );

        await channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✅ Realtime followers subscription active");
          } else if (status === "CHANNEL_ERROR") {
            setError("Failed to subscribe to real-time updates");
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Subscription error";
        setError(message);
        console.error("❌ Realtime subscription error:", err);
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
