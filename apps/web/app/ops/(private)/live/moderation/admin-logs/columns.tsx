"use client";

/**
 * Admin Logs Table Columns
 * TanStack Table column definitions
 */

import { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  XCircle,
  UserX,
  Ban,
  MessageSquareX,
  Shield,
  Eye,
  Megaphone,
  Settings,
  UserCheck,
  UserMinus,
  Clock,
  User,
  FileText,
  MoreHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableColumnHeader } from "@/app/ops/(private)/live/logs/components/data-table-column-header";

// Types
export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin: AdminProfile | null;
}

// Action konfigürasyonu
const ACTION_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  terminate_session: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Yayın Sonlandırıldı",
    color: "text-red-500",
    variant: "destructive"
  },
  kick_participant: {
    icon: <UserX className="h-3.5 w-3.5" />,
    label: "Katılımcı Atıldı",
    color: "text-orange-500",
    variant: "secondary"
  },
  ban_participant: {
    icon: <Ban className="h-3.5 w-3.5" />,
    label: "Katılımcı Yasaklandı",
    color: "text-red-600",
    variant: "destructive"
  },
  unban_user: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    label: "Yasak Kaldırıldı",
    color: "text-green-500",
    variant: "outline"
  },
  delete_message: {
    icon: <MessageSquareX className="h-3.5 w-3.5" />,
    label: "Mesaj Silindi",
    color: "text-gray-500",
    variant: "secondary"
  },
  promote_user: {
    icon: <Shield className="h-3.5 w-3.5" />,
    label: "Kullanıcı Yükseltildi",
    color: "text-blue-500",
    variant: "outline"
  },
  demote_user: {
    icon: <UserMinus className="h-3.5 w-3.5" />,
    label: "Kullanıcı Düşürüldü",
    color: "text-yellow-500",
    variant: "secondary"
  },
  view_session: {
    icon: <Eye className="h-3.5 w-3.5" />,
    label: "Yayın Görüntülendi",
    color: "text-muted-foreground",
    variant: "outline"
  },
  send_announcement: {
    icon: <Megaphone className="h-3.5 w-3.5" />,
    label: "Duyuru Gönderildi",
    color: "text-purple-500",
    variant: "secondary"
  },
  update_settings: {
    icon: <Settings className="h-3.5 w-3.5" />,
    label: "Ayarlar Güncellendi",
    color: "text-blue-500",
    variant: "outline"
  },
  review_report: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "Şikayet İncelendi",
    color: "text-blue-500",
    variant: "outline"
  },
  dismiss_report: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "Şikayet Reddedildi",
    color: "text-gray-500",
    variant: "secondary"
  }
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] || {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      color: "text-muted-foreground",
      variant: "outline" as const
    }
  );
}

// Action options for filtering
export const actionOptions = Object.entries(ACTION_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon
}));

export const columns: ColumnDef<AdminLog>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Zaman" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(date, { addSuffix: true, locale: tr })}
              </span>
            </TooltipTrigger>
            <TooltipContent>{format(date, "d MMMM yyyy HH:mm:ss", { locale: tr })}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    sortingFn: "datetime"
  },
  {
    accessorKey: "admin",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
    cell: ({ row }) => {
      const admin = row.original.admin;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={admin?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {admin?.full_name?.[0] || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[120px]">
              {admin?.full_name || "Bilinmiyor"}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {admin?.email}
            </span>
          </div>
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="İşlem" />,
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const config = getActionConfig(action);
      return (
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <Badge variant={config.variant} className="font-normal">
            {config.label}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "metadata",
    header: "Detay",
    cell: ({ row }) => {
      const metadata = row.original.metadata || {};
      const sessionTitle = metadata.session_title as string | undefined;
      const reason = metadata.reason as string | undefined;
      const adminNote = metadata.admin_note as string | undefined;
      const username = metadata.username as string | undefined;

      return (
        <div className="flex flex-col gap-0.5 max-w-[300px]">
          {sessionTitle && (
            <span className="text-sm truncate">
              <span className="text-muted-foreground">Yayın:</span>{" "}
              <span className="font-medium">{sessionTitle}</span>
            </span>
          )}
          {reason && (
            <span className="text-sm text-muted-foreground truncate">Neden: {reason}</span>
          )}
          {adminNote && (
            <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
              📝 {adminNote}
            </span>
          )}
          {username && !sessionTitle && <span className="text-sm">@{username}</span>}
          {!sessionTitle && !reason && !username && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
    enableSorting: false
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP" />,
    cell: ({ row }) => {
      const ip = row.getValue("ip_address") as string | null;
      return (
        <span className="text-xs text-muted-foreground font-mono">{ip?.split(",")[0] || "-"}</span>
      );
    },
    enableSorting: false
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const log = row.original;
      const meta = table.options.meta as { onViewDetail?: (log: AdminLog) => void } | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menüyü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => meta?.onViewDetail?.(log)}>
              Detayları Görüntüle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.id)}>
              Log ID Kopyala
            </DropdownMenuItem>
            {log.target_id && (
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.target_id!)}>
                Hedef ID Kopyala
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
