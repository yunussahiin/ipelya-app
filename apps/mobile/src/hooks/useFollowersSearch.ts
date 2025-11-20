/**
 * useFollowersSearch Hook
 * Search, filter, and sort followers/following list
 */

import { useMemo } from "react";
import { FollowerProfile } from "./useFollowers";

export type FilterType = "all" | "mutual" | "recent" | "verified";
export type SortType = "default" | "a-z" | "z-a";

export interface UseFollowersSearchProps {
  followers: FollowerProfile[];
  searchQuery: string;
  filterType: FilterType;
  sortType: SortType;
  currentUserId?: string;
}

export function useFollowersSearch({
  followers,
  searchQuery,
  filterType,
  sortType,
  currentUserId
}: UseFollowersSearchProps): FollowerProfile[] {
  return useMemo(() => {
    let filtered = [...followers];

    // 1. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (follower) =>
          (follower.display_name?.toLowerCase().includes(query) ?? false)
      );
    }

    // 2. Type filter
    switch (filterType) {
      case "mutual":
        // Mutual followers - both follow each other
        filtered = filtered.filter((follower) => follower.is_following === true);
        break;
      case "recent":
        // Recent followers - sort by created_at descending (handled in sort)
        break;
      case "verified":
        // Verified users - if applicable
        // Note: is_verified field may not exist in FollowerProfile yet
        break;
      case "all":
      default:
        // No additional filtering
        break;
    }

    // 3. Sort
    switch (sortType) {
      case "a-z":
        filtered.sort((a, b) => {
          const nameA = a.display_name || "";
          const nameB = b.display_name || "";
          return nameA.localeCompare(nameB, "tr-TR");
        });
        break;
      case "z-a":
        filtered.sort((a, b) => {
          const nameA = a.display_name || "";
          const nameB = b.display_name || "";
          return nameB.localeCompare(nameA, "tr-TR");
        });
        break;
      case "default":
      default:
        // Default: sort by created_at descending (newest first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
    }

    return filtered;
  }, [followers, searchQuery, filterType, sortType, currentUserId]);
}
