"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { BroadcastChannel } from "../broadcast-channels-card";
import type { BroadcastMessage, ChannelStats } from "./types";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { ChannelDetailSkeleton } from "./channel-skeleton";

const PAGE_SIZE = 20;

interface BroadcastChannelDetailSheetProps {
  channel: BroadcastChannel | null;
  creatorAvatarUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastChannelDetailSheet({
  channel,
  creatorAvatarUrl,
  open,
  onOpenChange
}: BroadcastChannelDetailSheetProps) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Fetch initial messages
  useEffect(() => {
    if (!channel || !open) {
      setMessages([]);
      setStats(null);
      setOffset(0);
      setHasMore(true);
      return;
    }

    async function fetchInitial() {
      if (!channel) return;
      setIsLoading(true);

      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("broadcast_messages")
          .select("*")
          .eq("channel_id", channel.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;

        const msgs = data || [];
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        setStats({
          totalMessages: channel.messageCount,
          totalViews: msgs.reduce((sum, m) => sum + (m.view_count || 0), 0),
          totalReactions: msgs.reduce((sum, m) => sum + (m.reaction_count || 0), 0),
          pinnedMessages: msgs.filter((m) => m.is_pinned).length,
          messagesThisWeek: msgs.filter((m) => new Date(m.created_at) >= weekAgo).length,
          messagesThisMonth: msgs.filter((m) => new Date(m.created_at) >= monthAgo).length
        });

        // Fetch reactions for messages
        const messageIds = msgs.map((m) => m.id);
        const { data: reactions } = await supabase
          .from("broadcast_reactions")
          .select("message_id, emoji")
          .in("message_id", messageIds);

        // Group reactions by message and emoji
        const reactionMap = new Map<string, Map<string, number>>();
        (reactions || []).forEach((r) => {
          if (!reactionMap.has(r.message_id)) {
            reactionMap.set(r.message_id, new Map());
          }
          const emojiMap = reactionMap.get(r.message_id)!;
          emojiMap.set(r.emoji, (emojiMap.get(r.emoji) || 0) + 1);
        });

        setMessages(msgs.map((m) => formatMessage(m, reactionMap.get(m.id))));
        setOffset(msgs.length);
        setHasMore(msgs.length >= PAGE_SIZE);
      } catch (err) {
        toast.error("Hata", {
          description: err instanceof Error ? err.message : "Mesajlar yüklenemedi"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitial();
  }, [channel, open]);

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!channel || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .eq("channel_id", channel.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const msgs = data || [];

      // Fetch reactions for new messages
      const messageIds = msgs.map((m) => m.id);
      const { data: reactions } = await supabase
        .from("broadcast_reactions")
        .select("message_id, emoji")
        .in("message_id", messageIds);

      const reactionMap = new Map<string, Map<string, number>>();
      (reactions || []).forEach((r) => {
        if (!reactionMap.has(r.message_id)) {
          reactionMap.set(r.message_id, new Map());
        }
        const emojiMap = reactionMap.get(r.message_id)!;
        emojiMap.set(r.emoji, (emojiMap.get(r.emoji) || 0) + 1);
      });

      setMessages((prev) => [...prev, ...msgs.map((m) => formatMessage(m, reactionMap.get(m.id)))]);
      setOffset((prev) => prev + msgs.length);
      setHasMore(msgs.length >= PAGE_SIZE);
    } catch {
      toast.error("Hata", { description: "Daha fazla mesaj yüklenemedi" });
    } finally {
      setIsLoadingMore(false);
    }
  }, [channel, offset, isLoadingMore, hasMore]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full">
        <VisuallyHidden>
          <SheetTitle>{channel?.name || "Kanal Detayları"}</SheetTitle>
        </VisuallyHidden>
        {isLoading ? (
          <ChannelDetailSkeleton />
        ) : channel && stats ? (
          <>
            <ChannelHeader channel={channel} stats={stats} />
            <Separator />
            <MessageList
              messages={messages}
              creatorAvatarUrl={creatorAvatarUrl}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
            />
            {/* Footer */}
            <div className="px-6 py-3 border-t bg-background">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(channel.createdAt), "d MMM yyyy", { locale: tr })}
                </span>
                {channel.lastMessageAt && (
                  <span>
                    Son:{" "}
                    {formatDistanceToNow(new Date(channel.lastMessageAt), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Kanal seçilmedi
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Helper
function formatMessage(
  m: Record<string, unknown>,
  emojiMap?: Map<string, number>
): BroadcastMessage {
  const reactions = emojiMap
    ? Array.from(emojiMap.entries()).map(([emoji, count]) => ({ emoji, count }))
    : undefined;

  return {
    id: m.id as string,
    content: (m.content as string) || "",
    contentType: (m.content_type as BroadcastMessage["contentType"]) || "text",
    mediaUrl: m.media_url as string | undefined,
    mediaThumbnailUrl: m.media_thumbnail_url as string | undefined,
    viewCount: (m.view_count as number) || 0,
    reactionCount: (m.reaction_count as number) || 0,
    reactions,
    isPinned: (m.is_pinned as boolean) || false,
    isCritical: (m.is_critical as boolean) || false,
    createdAt: m.created_at as string
  };
}
