"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconTrash
} from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { DataTableColumnHeader } from "./data-table-column-header";

// ModerationLog interface - admin avatar_url eklendi
export interface ModerationLog {
  id: string;
  admin_id: string;
  target_type: string;
  target_id: string;
  target_user_id: string;
  action_type: string;
  reason_code: string | null;
  reason_custom: string | null;
  reason_title: string | null;
  admin_note: string | null;
  notification_sent: boolean;
  created_at: string;
  admin: {
    display_name: string;
    email?: string;
    avatar_url?: string;
  };
  target_user: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

const getActionBadge = (action: string) => {
  switch (action) {
    case "hide":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconEyeOff className="h-3 w-3" /> Gizlendi
        </Badge>
      );
    case "unhide":
      return (
        <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
          <IconEye className="h-3 w-3" /> Gösterildi
        </Badge>
      );
    case "delete":
      return (
        <Badge variant="destructive" className="gap-1">
          <IconTrash className="h-3 w-3" /> Silindi
        </Badge>
      );
    case "restore":
      return (
        <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">
          <IconRefresh className="h-3 w-3" /> Geri Yüklendi
        </Badge>
      );
    case "warn":
      return (
        <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
          <IconAlertTriangle className="h-3 w-3" /> Uyarıldı
        </Badge>
      );
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
};

const getTargetTypeBadge = (type: string) => {
  const labels: Record<string, string> = {
    post: "Post",
    mini_post: "Vibe",
    poll: "Anket",
    voice_moment: "Ses",
    comment: "Yorum"
  };
  return <Badge variant="outline">{labels[type] || type}</Badge>;
};

export const columns: ColumnDef<ModerationLog>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tümünü seç"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Satır seç"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tarih" />,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {date.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: "admin",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Admin" />,
    cell: ({ row }) => {
      const admin = row.original.admin;
      return (
        <div className="flex items-center gap-2">
          {admin.avatar_url ? (
            <Image
              src={admin.avatar_url}
              alt={admin.display_name || "Admin"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xs font-medium">
                {(admin.display_name || "A").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{admin.display_name || "Admin"}</span>
            {admin.email && <span className="text-xs text-muted-foreground">{admin.email}</span>}
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const admin = row.original.admin;
      return admin.display_name?.toLowerCase().includes(value.toLowerCase()) || false;
    }
  },
  {
    accessorKey: "action_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="İşlem" />,
    cell: ({ row }) => getActionBadge(row.getValue("action_type")),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "target_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="İçerik Türü" />,
    cell: ({ row }) => getTargetTypeBadge(row.getValue("target_type")),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "target_user",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hedef Kullanıcı" />,
    cell: ({ row }) => {
      const user = row.original.target_user;
      return (
        <div className="flex items-center gap-2">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <span className="text-xs">{user.username?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="text-sm">@{user.username}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const user = row.original.target_user;
      return user.username?.toLowerCase().includes(value.toLowerCase()) || false;
    }
  },
  {
    accessorKey: "reason_title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Neden" />,
    cell: ({ row }) => {
      const reasonTitle = row.getValue("reason_title") as string | null;
      const reasonCustom = row.original.reason_custom;
      const adminNote = row.original.admin_note;

      return (
        <div className="max-w-[200px] space-y-1">
          {reasonTitle && (
            <Badge variant="outline" className="text-xs">
              {reasonTitle}
            </Badge>
          )}
          {reasonCustom && (
            <p className="truncate text-xs text-muted-foreground" title={reasonCustom}>
              {reasonCustom}
            </p>
          )}
          {adminNote && (
            <p
              className="truncate text-xs text-yellow-600 dark:text-yellow-400"
              title={`Yönetim: ${adminNote}`}
            >
              📝 {adminNote}
            </p>
          )}
          {!reasonTitle && !reasonCustom && (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "notification_sent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bildirim" />,
    cell: ({ row }) => {
      const sent = row.getValue("notification_sent") as boolean;
      return sent ? (
        <Badge variant="outline" className="border-green-500 text-green-600">
          Gönderildi
        </Badge>
      ) : (
        <Badge variant="secondary">Gönderilmedi</Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)));
    }
  }
];
