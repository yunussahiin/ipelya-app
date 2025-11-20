"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen?: boolean;
}

export function NotificationBell({ unreadCount, onClick, isOpen = false }: NotificationBellProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      aria-label="Notifications"
    >
      <Bell className={`h-5 w-5 ${isOpen ? "text-blue-600" : "text-gray-600"}`} />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600"
          variant="default"
        >
          <span className="text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
        </Badge>
      )}
    </Button>
  );
}
