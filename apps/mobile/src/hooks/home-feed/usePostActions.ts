/**
 * usePostActions Hook
 * 
 * Amaç: Post action handlers - Like, comment, share
 * 
 * Özellikler:
 * - Like/unlike post
 * - Comment on post
 * - Share post
 * - Optimistic updates
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { Alert, Share } from "react-native";
import * as Haptics from "expo-haptics";
import { logger } from "@/utils/logger";

interface UsePostActionsProps {
  postId: string;
}

export function usePostActions({ postId }: UsePostActionsProps) {
  const queryClient = useQueryClient();
  const { sessionToken } = useAuthStore();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/like-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ post_id: postId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to like/unlike post");
      }

      return response.json();
    },
    onMutate: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      
      return { previousData: null };
    },
    onError: (err) => {
      logger.error('Like error', err, { tag: 'Feed' });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      Alert.alert("Hata", "Beğeni işlemi başarısız oldu");
    },
    onSuccess: (data) => {
      
      // Update based on API response
      const queries = queryClient.getQueriesData({ queryKey: ["feed"] });
      queries.forEach(([queryKey]) => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) => {
                if (item.content?.id === postId) {
                  const newIsLiked = data.action === "liked";
                  const wasLiked = item.content.is_liked;
                  const currentCount = item.content.likes_count;
                  
                  // Calculate new count based on state change
                  let newCount = currentCount;
                  if (newIsLiked && !wasLiked) {
                    newCount = currentCount + 1;
                  } else if (!newIsLiked && wasLiked) {
                    newCount = currentCount - 1;
                  }
                  
                  return {
                    ...item,
                    content: {
                      ...item.content,
                      is_liked: newIsLiked,
                      likes_count: newCount
                    }
                  };
                }
                return item;
              })
            }))
          };
        });
      });
    }
  });

  // Comment handler - handled in PostCard
  const handleComment = () => {
    // Sheet opens in PostCard
  };

  // Share handler
  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await Share.share({
        message: `Check out this post on ipelya!`,
        url: `https://ipelya.com/post/${postId}`
      });

      if (result.action === Share.sharedAction) {
        // TODO: Track share analytics
      }
    } catch (error) {
      logger.error('Share error', error, { tag: 'Feed' });
    }
  };

  return {
    handleLike: () => likeMutation.mutate(),
    handleComment,
    handleShare,
    isLiking: likeMutation.isPending
  };
}
