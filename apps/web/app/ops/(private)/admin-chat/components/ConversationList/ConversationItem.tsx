"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { OpsConversation } from "../../types";

interface ConversationItemProps {
  conversation: OpsConversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick
}: ConversationItemProps) {
  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct") {
      const other = conversation.participants.find((p) => p.admin_id !== currentUserId);
      return other?.admin?.full_name || "Anonim";
    }
    return "Grup Sohbeti";
  };

  const getAvatar = () => {
    if (conversation.type === "group") {
      return (
        <div className="relative shrink-0">
          {conversation.avatar_url ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.avatar_url} />
              <AvatarFallback className="bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          )}
          {/* Group badge */}
          <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <Users className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        </div>
      );
    }
    const other = conversation.participants.find((p) => p.admin_id !== currentUserId);
    return (
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={other?.admin?.avatar_url || undefined} />
        <AvatarFallback className="bg-muted text-sm">
          {other?.admin?.full_name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent"
      )}
      onClick={onClick}
    >
      {getAvatar()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate text-sm">{getConversationName()}</span>
          {conversation.unread_count > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
            >
              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5 gap-2">
          {conversation.last_message && (
            <span className="text-xs text-muted-foreground truncate flex-1">
              {conversation.last_message}
            </span>
          )}
          {conversation.last_message_at && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(conversation.last_message_at), {
                addSuffix: false,
                locale: tr
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
