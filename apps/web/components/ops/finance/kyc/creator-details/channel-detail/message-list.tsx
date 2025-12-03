"use client";

import { useEffect, useRef, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { BroadcastMessage } from "./types";

interface MessageListProps {
  messages: BroadcastMessage[];
  creatorAvatarUrl?: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function MessageList({
  messages,
  creatorAvatarUrl,
  hasMore,
  isLoadingMore,
  onLoadMore
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on initial load
  const isFirstLoad = messages.length > 0;
  useEffect(() => {
    if (containerRef.current && isFirstLoad) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [isFirstLoad]);

  // Infinite scroll - load more when scrolling to top
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoadingMore || !hasMore) return;
    if (containerRef.current.scrollTop < 100) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Henüz mesaj yok</p>
        </div>
      </div>
    );
  }

  // Reverse messages so newest is at bottom
  const sortedMessages = [...messages].reverse();

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4">
      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Top sentinel for infinite scroll */}
      {hasMore && !isLoadingMore && (
        <div ref={topSentinelRef} className="text-center py-2">
          <span className="text-xs text-muted-foreground">Yukarı kaydırarak daha fazla yükle</span>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {sortedMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} creatorAvatarUrl={creatorAvatarUrl} />
        ))}
      </div>
    </div>
  );
}
