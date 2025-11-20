"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

interface Notification {
  id: string | number;
  title?: string;
  body?: string;
  user?: string;
  action?: string;
  target?: string;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
  timestamp?: string;
  unread?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onMarkAllAsRead?: () => void;
}

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

export function NotificationCenter({
  notifications: externalNotifications,
  isLoading: externalLoading = false,
  onMarkAsRead: externalMarkAsRead,
  onDelete: externalDelete,
  onMarkAllAsRead: externalMarkAllAsRead
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Use real data from hook if available
  const {
    notifications: hookNotifications,
    loading: hookLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Prefer hook data, fallback to external props
  const notifications: Notification[] =
    hookNotifications.length > 0
      ? (hookNotifications as any).map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          read: n.read,
          created_at: n.created_at,
          timestamp: new Date(n.created_at).toLocaleString("tr-TR")
        }))
      : externalNotifications;

  const isLoading = hookNotifications.length > 0 ? hookLoading : externalLoading;
  const handleMarkAsRead = hookNotifications.length > 0 ? markAsRead : externalMarkAsRead;
  const handleMarkAllAsRead = hookNotifications.length > 0 ? markAllAsRead : externalMarkAllAsRead;

  // Handle both read and unread properties
  const unreadCount = notifications.filter((n) => {
    const isUnread = n.unread !== undefined ? n.unread : !n.read && !n.is_read;
    return isUnread;
  }).length;

  const handleNotificationClick = (id: string | number) => {
    if (typeof id === "string") {
      handleMarkAsRead?.(id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline" className="relative" aria-label="Open notifications">
          <Bell size={16} strokeWidth={2} aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-1">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Bildirimler</div>
          {unreadCount > 0 && (
            <button className="text-xs font-medium hover:underline" onClick={handleMarkAllAsRead}>
              Tümünü okundu olarak işaretle
            </button>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="-mx-1 my-1 h-px bg-border"
        ></div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            Hiçbir bildirim yok.
          </div>
        ) : (
          notifications.map((notification) => {
            const isUnread =
              notification.unread !== undefined
                ? notification.unread
                : !notification.read && !notification.is_read;
            const displayUser = notification.user || notification.title || "Notification";
            const displayAction = notification.action || "";
            const displayTarget = notification.target || notification.body || "";
            const displayTime = notification.timestamp || notification.created_at || "";

            return (
              <div
                key={notification.id}
                className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <div className="relative flex items-start gap-3 pe-3">
                  <div className="flex-1 space-y-1">
                    <button
                      className="text-left text-foreground/80 after:absolute after:inset-0"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <span className="font-medium text-foreground hover:underline">
                        {displayUser}
                      </span>{" "}
                      {displayAction}{" "}
                      <span className="font-medium text-foreground hover:underline">
                        {displayTarget}
                      </span>
                      .
                    </button>
                    {displayTime && (
                      <div className="text-xs text-muted-foreground">{displayTime}</div>
                    )}
                  </div>
                  {isUnread && (
                    <div className="absolute end-0 self-center">
                      <Dot />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}
