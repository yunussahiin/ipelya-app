"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User, Mail, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "./data-table-column-header";
import { formatFileSize } from "@ipelya/types";

export interface TopUser {
  user_id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: "user" | "creator" | "admin";
  file_count: number;
  total_size: number;
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return (
        <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Admin</Badge>
      );
    case "creator":
      return (
        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
          Creator
        </Badge>
      );
    default:
      return <Badge variant="secondary">User</Badge>;
  }
};

export const userColumns: ColumnDef<TopUser>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kullanıcı" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium">@{user.username}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </span>
          </div>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const user = row.original;
      const searchValue = value.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.user_id.toLowerCase().includes(searchValue)
      );
    }
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    cell: ({ row }) => getRoleBadge(row.getValue("role")),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "file_count",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dosya Sayısı" />,
    cell: ({ row }) => {
      const count = row.getValue("file_count") as number;
      return <div className="text-right font-medium">{count.toLocaleString("tr-TR")}</div>;
    }
  },
  {
    accessorKey: "total_size",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Toplam Boyut" />,
    cell: ({ row }) => {
      const size = row.getValue("total_size") as number;
      return <div className="text-right font-medium">{formatFileSize(size)}</div>;
    }
  },
  {
    id: "avgSize",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ort. Dosya Boyutu" />,
    cell: ({ row }) => {
      const fileCount = row.original.file_count;
      const totalSize = row.original.total_size;
      const avgSize = fileCount > 0 ? totalSize / fileCount : 0;
      return <div className="text-right text-muted-foreground">{formatFileSize(avgSize)}</div>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/ops/users/${user.user_id}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      );
    }
  }
];
