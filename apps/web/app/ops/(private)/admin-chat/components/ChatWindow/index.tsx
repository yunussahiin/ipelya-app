"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useMessages, useMediaUpload, useTypingIndicator } from "../../hooks";
import type { OpsConversation, OpsMessage } from "../../types";

interface ChatWindowProps {
  conversation: OpsConversation | null;
  currentUserId: string;
  onConversationUpdate?: (conversation: OpsConversation) => void;
  onOpenMobileDrawer?: () => void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  onConversationUpdate,
  onOpenMobileDrawer
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<OpsMessage | null>(null);

  // Check if current user can write
  const currentParticipant = conversation?.participants.find((p) => p.admin_id === currentUserId);
  const canWrite = currentParticipant?.can_write !== false;

  const { messages, isLoading, hasMore, isSending, loadMore, sendMessage, markAsRead } =
    useMessages(conversation?.id || null, currentUserId);

  const { isUploading, uploadFile, getContentType } = useMediaUpload(conversation?.id || null);

  const { typingUsers, startTyping } = useTypingIndicator(conversation?.id || null, currentUserId);

  const handleReply = useCallback((message: OpsMessage) => {
    setReplyTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const handleSend = useCallback(
    async (
      content: string,
      replyToId?: string,
      mediaUrl?: string,
      contentType?: string,
      metadata?: object
    ) => {
      const result = await sendMessage(content, replyToId, mediaUrl, contentType, metadata);
      if (result) {
        setReplyTo(null);
      }
    },
    [sendMessage]
  );

  // Mark as read when conversation changes
  if (conversation) {
    markAsRead();
  }

  if (!conversation) {
    return (
      <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Sohbet seçin</p>
            <p className="text-sm mt-1">veya yeni bir sohbet başlatın</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden py-0 gap-0">
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onConversationUpdate={onConversationUpdate}
        onOpenMobileDrawer={onOpenMobileDrawer}
      />

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onReply={handleReply}
        />

        <TypingIndicator typingUsers={typingUsers} />

        {canWrite ? (
          <MessageInput
            replyTo={replyTo}
            isSending={isSending}
            isUploading={isUploading}
            onSend={handleSend}
            onCancelReply={handleCancelReply}
            onUpload={uploadFile}
            onTyping={startTyping}
            getContentType={getContentType}
          />
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground border-t bg-muted/50">
            Bu grupta mesaj gönderme yetkiniz yok
          </div>
        )}
      </CardContent>
    </Card>
  );
}
