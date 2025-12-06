/**
 * Followers Hook
 * Manages follower/following list state and operations
 */

import { useState, useCallback } from "react";
import {
  getFollowers,
  getFollowing,
  getFollowStats,
  followUser,
  unfollowUser,
  type FollowerProfile,
  type FollowStats
} from "@/services/followers.service";
import { logger } from "@/utils/logger";

export type { FollowerProfile, FollowStats };

export interface UseFollowersState {
  followers: FollowerProfile[];
  following: FollowerProfile[];
  stats: FollowStats;
  loading: boolean;
  error: string | null;
}

export interface UseFollowersActions {
  loadFollowers: (userId: string, currentUserId?: string) => Promise<void>;
  loadFollowing: (userId: string) => Promise<void>;
  loadStats: (userId: string, currentUserId?: string) => Promise<void>;
  follow: (userId: string) => Promise<boolean>;
  unfollow: (userId: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export function useFollowers(): UseFollowersState & UseFollowersActions {
  const [followers, setFollowers] = useState<FollowerProfile[]>([]);
  const [following, setFollowing] = useState<FollowerProfile[]>([]);
  const [stats, setStats] = useState<FollowStats>({
    followers_count: 0,
    following_count: 0,
    is_following: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setFollowers([]);
    setFollowing([]);
    setStats({
      followers_count: 0,
      following_count: 0,
      is_following: false
    });
    setLoading(false);
    setError(null);
  }, []);

  const loadFollowers = useCallback(async (userId: string, currentUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFollowers(userId, currentUserId);
      setFollowers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Takipçi listesi yüklenemedi";
      setError(message);
      logger.error('Load followers error', err, { tag: 'Followers' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowing = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFollowing(userId);
      setFollowing(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Takip listesi yüklenemedi";
      setError(message);
      logger.error('Load following error', err, { tag: 'Followers' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async (userId: string, currentUserId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFollowStats(userId, currentUserId);
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "İstatistikler yüklenemedi";
      setError(message);
      logger.error('Load stats error', err, { tag: 'Followers' });
    } finally {
      setLoading(false);
    }
  }, []);

  const follow = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await followUser(userId);
      if (!result.success) {
        setError(result.error || "Takip başarısız");
        return false;
      }
      // Update stats
      setStats(prev => ({
        ...prev,
        is_following: true,
        following_count: prev.following_count + 1
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Takip başarısız";
      setError(message);
      logger.error('Follow error', err, { tag: 'Followers' });
      return false;
    }
  }, []);

  const unfollow = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await unfollowUser(userId);
      if (!result.success) {
        setError(result.error || "Takipten çıkma başarısız");
        return false;
      }
      // Update stats
      setStats(prev => ({
        ...prev,
        is_following: false,
        following_count: Math.max(0, prev.following_count - 1)
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Takipten çıkma başarısız";
      setError(message);
      logger.error('Unfollow error', err, { tag: 'Followers' });
      return false;
    }
  }, []);

  return {
    followers,
    following,
    stats,
    loading,
    error,
    loadFollowers,
    loadFollowing,
    loadStats,
    follow,
    unfollow,
    clearError,
    reset
  };
}
