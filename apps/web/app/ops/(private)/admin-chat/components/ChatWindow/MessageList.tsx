"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { MessageBubble } from "./MessageBubble";
import type { OpsMessage } from "../../types";

function MessageSkeleton({ isMine, width }: { isMine: boolean; width: number }) {
  return (
    <div className={`flex gap-2 py-1 ${isMine ? "justify-end" : "justify-start"}`}>
      {!isMine && <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />}
      <div className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && <div className="h-3 w-20 rounded bg-muted animate-pulse ml-1" />}
        <div
          className={`rounded-2xl px-4 py-3 ${isMine ? "bg-primary/20" : "bg-muted"} animate-pulse`}
          style={{ width, height: 36 }}
        />
        <div className="h-2 w-10 rounded bg-muted animate-pulse ml-1" />
      </div>
    </div>
  );
}

function LoadMoreSkeleton() {
  return (
    <div className="space-y-2 py-4">
      <MessageSkeleton isMine={false} width={180} />
      <MessageSkeleton isMine={true} width={140} />
      <MessageSkeleton isMine={false} width={200} />
    </div>
  );
}

interface MessageListProps {
  messages: OpsMessage[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (message: OpsMessage) => void;
}

function DateSeparator({ date }: { date: Date }) {
  let label: string;

  if (isToday(date)) {
    label = "Bugün";
  } else if (isYesterday(date)) {
    label = "Dün";
  } else {
    label = format(date, "d MMMM yyyy", { locale: tr });
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  onReply
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Check if near bottom
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsNearBottom(nearBottom);
      setShowScrollButton(!nearBottom);

      // Load more when scrolled to top
      if (scrollTop < 50 && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  // Auto scroll on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && isNearBottom) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Initial scroll to bottom when messages first load or conversation changes
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        scrollToBottom(false);
      }, 50);
    }
  }, [messages, scrollToBottom]);

  // Check if should show avatar/name for message grouping
  const shouldShowAvatar = (index: number) => {
    if (index === 0) return true;
    const current = messages[index];
    const prev = messages[index - 1];
    return current.sender_id !== prev.sender_id;
  };

  const shouldShowName = (index: number) => {
    if (messages[index].sender_id === currentUserId) return false;
    return shouldShowAvatar(index);
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].created_at);
    const prev = new Date(messages[index - 1].created_at);
    return !isSameDay(current, prev);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <ScrollArea ref={scrollRef} className="h-full p-4" onScrollCapture={handleScroll}>
        {/* Load more indicator */}
        {isLoading && <LoadMoreSkeleton />}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <div className="flex justify-center py-2">
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Daha fazla yükle
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((msg, index) => (
            <div key={msg.id}>
              {shouldShowDateSeparator(index) && <DateSeparator date={new Date(msg.created_at)} />}
              <MessageBubble
                message={msg}
                isMine={msg.sender_id === currentUserId}
                showAvatar={shouldShowAvatar(index)}
                showName={shouldShowName(index)}
                onReply={onReply}
              />
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
