/**
 * useCommentSheet Hook
 *
 * CommentSheet'in tüm logic'ini yönetir
 */

import { useState, useCallback, useEffect } from "react";
import { useProfileStore } from "@/store/profile.store";
import { useAuthStore } from "@/store/auth.store";
import { getPostDetails, commentPost, searchMentions, likeComment } from "@ipelya/api/home-feed";
import { supabase } from "@/lib/supabaseClient";
import type { Comment, MentionUser } from "../components";
import type { ReplyTo } from "../types";

interface UseCommentSheetProps {
  postId: string;
}

export function useCommentSheet({ postId }: UseCommentSheetProps) {
  const { profile } = useProfileStore();
  const { sessionToken } = useAuthStore();

  // State
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  // Reply state
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // Likers sheet state
  const [likersCommentId, setLikersCommentId] = useState<string | null>(null);
  const [showLikersSheet, setShowLikersSheet] = useState(false);

  // User avatar
  const [userAvatar, setUserAvatar] = useState<string | undefined>(profile?.avatarUrl);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Fetch user avatar
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (profile?.avatarUrl) {
        setUserAvatar(profile.avatarUrl);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("user_id", user.id)
            .eq("type", "real")
            .single();

          if (profileData?.avatar_url) {
            setUserAvatar(profileData.avatar_url);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user avatar:", error);
      }
    };

    fetchUserAvatar();
  }, [profile?.avatarUrl]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!postId || !accessToken) return;

    try {
      console.log("💬 Fetching comments for post:", postId);
      const response = await getPostDetails(supabaseUrl, accessToken, postId);

      if (response.success && response.data) {
        const postData = response.data as { comments?: Comment[] };
        const fetchedComments = postData.comments || [];
        setComments(fetchedComments);
        console.log("✅ Comments fetched:", fetchedComments.length);
      } else {
        console.error("❌ Failed to fetch comments:", response.error);
      }
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
    }
  }, [postId, supabaseUrl, accessToken]);

  // Submit comment
  const handleSubmitComment = useCallback(
    async (commentText: string) => {
      if (!commentText.trim() || loading || !accessToken) return;

      setLoading(true);
      try {
        console.log("💬 Creating comment:", commentText, "replyTo:", replyTo);
        const response = await commentPost(supabaseUrl, accessToken, {
          post_id: postId,
          content: commentText.trim(),
          parent_comment_id: replyTo?.commentId
        });

        if (response.success) {
          console.log("✅ Comment created successfully");
          setReplyTo(null);
          await fetchComments();
        } else {
          console.error("❌ Failed to create comment:", response.error);
        }
      } catch (error) {
        console.error("❌ Error creating comment:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading, accessToken, supabaseUrl, postId, fetchComments, replyTo]
  );

  // Mention query handler
  const handleMentionQuery = useCallback(
    async (query: string | null) => {
      setMentionQuery(query);

      if (!query) {
        setMentionUsers([]);
        setMentionLoading(false);
        return;
      }

      setMentionLoading(true);
      try {
        const response = await searchMentions(supabaseUrl, accessToken, query, 6);
        if (response.success && response.data?.users) {
          setMentionUsers(response.data.users);
        } else {
          setMentionUsers([]);
        }
      } catch (error) {
        console.error("Mention search error:", error);
        setMentionUsers([]);
      } finally {
        setMentionLoading(false);
      }
    },
    [supabaseUrl, accessToken]
  );

  // Toggle comment like - recursive helper
  const updateCommentLike = (comments: Comment[], commentId: string): Comment[] => {
    return comments.map((c) => {
      if (c.id === commentId) {
        const isLiked = c.is_liked || false;
        return {
          ...c,
          is_liked: !isLiked,
          likes_count: isLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
        };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateCommentLike(c.replies, commentId) };
      }
      return c;
    });
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    setComments((prev) => updateCommentLike(prev, commentId));

    try {
      const response = await likeComment(supabaseUrl, accessToken, commentId);
      console.log("❤️ Like comment response:", response);
      if (!response.success) {
        setComments((prev) => updateCommentLike(prev, commentId));
      }
    } catch (error) {
      console.error("❌ Like comment error:", error);
      setComments((prev) => updateCommentLike(prev, commentId));
    }
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    console.log("🗑️ Deleting comment:", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setShowDeleteMenu(null);
  };

  // Handle reply
  const handleReply = (commentId: string) => {
    const findComment = (comments: Comment[]): Comment | undefined => {
      for (const c of comments) {
        if (c.id === commentId) return c;
        if (c.replies) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return undefined;
    };

    const comment = findComment(comments);
    if (comment) {
      setReplyTo({
        username: comment.user.username,
        commentId: comment.id
      });
    }
  };

  // Show likers sheet
  const handleShowLikers = (commentId: string) => {
    setLikersCommentId(commentId);
    setShowLikersSheet(true);
  };

  // Close likers sheet
  const closeLikersSheet = () => {
    setShowLikersSheet(false);
    setLikersCommentId(null);
  };

  return {
    // State
    loading,
    comments,
    showDeleteMenu,
    mentionQuery,
    mentionUsers,
    mentionLoading,
    replyTo,
    likersCommentId,
    showLikersSheet,
    userAvatar,

    // Actions
    fetchComments,
    handleSubmitComment,
    handleMentionQuery,
    handleLikeComment,
    handleDeleteComment,
    handleReply,
    handleShowLikers,
    closeLikersSheet,
    setShowDeleteMenu,
    setReplyTo,
    setMentionQuery,
    setMentionUsers
  };
}
