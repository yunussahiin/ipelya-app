/**
 * PostDetailModal Component
 * Post detaylarını ve yorumları gösteren modal
 * Sheet component kullanarak tam ekran açılır
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { IconEyeOff, IconHeart, IconMessageCircle, IconShare, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Comment, FeedItem } from "../types";
import { ModerationDialog } from "./moderation-dialog";

interface PostDetailModalProps {
  item: FeedItem | null;
  open: boolean;
  onClose: () => void;
}

interface PostDetails {
  id: string;
  caption?: string;
  content?: string;
  user: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_creator?: boolean;
  };
  media?: Array<{ media_url: string; media_type: string }>;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  comments: Comment[];
}

export function PostDetailModal({ item, open, onClose }: PostDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<PostDetails | null>(null);
  const [moderatingCommentId, setModeratingCommentId] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!item) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ops/feed/post-details?post_id=${item.content.id}`);
      const data = await response.json();

      if (data.success) {
        setDetails(data.data);
      }
    } catch (error) {
      console.error("Post details fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (open && item) {
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [open, item, fetchDetails]);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        hideCloseButton
        className="flex h-full w-full max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none md:w-[85vw] lg:w-[80vw]"
      >
        {/* Header - Sabit */}
        <div className="flex shrink-0 items-center gap-4 border-b px-6 py-4">
          {item.content.user.avatar_url ? (
            <Image
              src={item.content.user.avatar_url}
              alt={item.content.user.username}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <span className="text-lg font-medium">
                {item.content.user.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold">@{item.content.user.username}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onClose}>
            <IconX className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Flex row */}
        <div className="flex min-h-0 flex-1">
          {/* Sol taraf - Media */}
          <div className="relative hidden w-3/5 bg-black md:flex md:items-center md:justify-center">
            {item.content.media && item.content.media.length > 0 ? (
              <Image src={item.content.media[0].media_url} alt="" fill className="object-contain" />
            ) : item.content_type === "mini_post" ? (
              <div className="flex h-full w-full items-center justify-center p-8">
                {/* Vibe Card - Card stilinde */}
                <div className="aspect-3/4 w-full max-w-md overflow-hidden rounded-3xl bg-linear-to-br from-pink-500 to-purple-600 p-8 shadow-2xl">
                  <div className="flex h-full flex-col items-center justify-center">
                    <p className="text-center text-2xl font-bold leading-relaxed text-white md:text-3xl">
                      {item.content.content || item.content.caption}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <p className="text-lg text-muted-foreground">Medya yok</p>
              </div>
            )}
          </div>

          {/* Sağ taraf - Detaylar ve Yorumlar */}
          <div className="flex w-full flex-col md:w-2/5">
            {/* Caption */}
            {(item.content.caption || item.content.content) && (
              <div className="shrink-0 border-b p-4">
                <p className="text-sm leading-relaxed">
                  {item.content.caption || item.content.content}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex shrink-0 items-center gap-6 border-b p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <IconHeart className="h-5 w-5" />
                {details?.likes_count || item.content.likes_count || 0} beğeni
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <IconMessageCircle className="h-5 w-5" />
                {details?.comments_count || item.content.comments_count || 0} yorum
              </span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <IconShare className="h-5 w-5" />
                {details?.shares_count || item.content.shares_count || 0} paylaşım
              </span>
            </div>

            {/* Yorumlar - Scrollable */}
            <div className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h3 className="mb-4 text-lg font-semibold">Yorumlar</h3>

                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : details?.comments && details.comments.length > 0 ? (
                    <div className="space-y-6">
                      {details.comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          onModerate={setModeratingCommentId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <IconMessageCircle className="mb-3 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Henüz yorum yok</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Yorum Moderasyon Dialog */}
      {moderatingCommentId && (
        <ModerationDialog
          open={!!moderatingCommentId}
          onClose={() => setModeratingCommentId(null)}
          targetType="comment"
          targetId={moderatingCommentId}
          onSuccess={() => {
            setModeratingCommentId(null);
            fetchDetails();
            toast.success("Yorum moderasyonu tamamlandı");
          }}
        />
      )}
    </Sheet>
  );
}

/**
 * CommentItem Component
 * Tek bir yorum ve reply'larını gösterir
 */
function CommentItem({
  comment,
  onModerate
}: {
  comment: Comment;
  onModerate: (commentId: string) => void;
}) {
  return (
    <div className="group space-y-3">
      <div className="flex gap-3">
        {comment.user.avatar_url ? (
          <Image
            src={comment.user.avatar_url}
            alt={comment.user.username}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium">
              {comment.user.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">@{comment.user.username}</span>
              {comment.user.is_creator && (
                <Badge variant="secondary" className="text-xs">
                  Creator
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString("tr-TR")}
              </span>
            </div>
            {/* Moderasyon Butonu */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onModerate(comment.id)}
                >
                  <IconEyeOff className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Yorumu Moderasyona Al</TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-1 text-sm">{comment.content}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IconHeart
                className={`h-3 w-3 ${comment.is_liked ? "fill-red-500 text-red-500" : ""}`}
              />
              {comment.likes_count}
            </span>
            {comment.replies_count ? <span>{comment.replies_count} yanıt</span> : null}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              {reply.user.avatar_url ? (
                <Image
                  src={reply.user.avatar_url}
                  alt={reply.user.username}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs">{reply.user.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">@{reply.user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <p className="mt-1 text-sm">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
