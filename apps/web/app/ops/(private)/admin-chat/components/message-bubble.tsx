"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Reply, Check, CheckCheck, Shield, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  role?: string;
}

interface ReplyTo {
  id: string;
  content: string;
  sender_name: string;
}

interface OpsMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: string;
  created_at: string;
  sender: AdminProfile | null;
  reply_to_id?: string | null;
  reply_to?: ReplyTo | null;
  read_by?: string[];
}

interface MessageBubbleProps {
  message: OpsMessage;
  isMine: boolean;
  currentUserId: string;
  participantCount: number;
  onReply: (message: OpsMessage) => void;
}

// Role badge renkleri
const getRoleBadge = (role?: string) => {
  switch (role) {
    case "super_admin":
      return (
        <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">
          <Shield className="h-3 w-3 mr-0.5" />
          Super
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="default" className="ml-1 text-xs px-1 py-0">
          Admin
        </Badge>
      );
    case "moderator":
      return (
        <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
          Mod
        </Badge>
      );
    default:
      return null;
  }
};

// Okundu durumu ikonu
const ReadStatus = ({
  readBy,
  participantCount,
  isMine
}: {
  readBy?: string[];
  participantCount: number;
  isMine: boolean;
}) => {
  if (!isMine) return null;

  const readCount = readBy?.length || 0;
  const allRead = readCount >= participantCount - 1; // Kendisi hariç

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1">
          {allRead ? (
            <CheckCheck className="h-3 w-3 text-blue-500 inline" />
          ) : readCount > 0 ? (
            <CheckCheck className="h-3 w-3 text-muted-foreground inline" />
          ) : (
            <Check className="h-3 w-3 text-muted-foreground inline" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {allRead ? "Herkes okudu" : readCount > 0 ? `${readCount} kişi okudu` : "Gönderildi"}
      </TooltipContent>
    </Tooltip>
  );
};

export function MessageBubble({
  message,
  isMine,
  currentUserId,
  participantCount,
  onReply
}: MessageBubbleProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Mesaj kopyalandı");
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
          <div className={`flex gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : ""}`}>
            {/* Avatar - sadece karşı taraf için */}
            {!isMine && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.sender?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {message.sender?.full_name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex flex-col">
              {/* Sender adı ve badge - sadece karşı taraf için */}
              {!isMine && (
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {message.sender?.full_name || "Anonim"}
                  </span>
                  {getRoleBadge(message.sender?.role)}
                </div>
              )}

              {/* Reply preview */}
              {message.reply_to && (
                <div className="mb-1 px-2 py-1 rounded bg-muted/50 border-l-2 border-primary text-xs">
                  <span className="font-medium">{message.reply_to.sender_name}</span>
                  <p className="text-muted-foreground truncate max-w-48">
                    {message.reply_to.content}
                  </p>
                </div>
              )}

              {/* Mesaj içeriği */}
              <div
                className={`rounded-lg px-4 py-2 ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>

              {/* Zaman ve okundu durumu */}
              <div className={`flex items-center mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: tr
                  })}
                </span>
                <ReadStatus
                  readBy={message.read_by}
                  participantCount={participantCount}
                  isMine={isMine}
                />
              </div>
            </div>

            {/* Reply butonu - hover'da görünür */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center"
              onClick={() => onReply(message)}
            >
              <Reply className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onReply(message)}>
          <Reply className="h-4 w-4 mr-2" />
          Yanıtla
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Kopyala
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
