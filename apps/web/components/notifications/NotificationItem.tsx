"use client";

import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface NotificationItemProps {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  id,
  title,
  body,
  isRead,
  createdAt,
  onMarkAsRead,
  onDelete
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: tr
  });

  return (
    <div
      className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
        !isRead ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Read indicator */}
        <button
          onClick={() => onMarkAsRead?.(id)}
          className="mt-1 shrink-0"
          aria-label={isRead ? "Mark as unread" : "Mark as read"}
        >
          {isRead ? (
            <CheckCircle2 className="h-5 w-5 text-gray-400" />
          ) : (
            <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold truncate ${!isRead ? "text-gray-900" : "text-gray-700"}`}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{body}</p>
          <p className="text-xs text-gray-500 mt-2">{timeAgo}</p>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete?.(id)}
          className="shrink-0 text-gray-400 hover:text-red-600"
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
