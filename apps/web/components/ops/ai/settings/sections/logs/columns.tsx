"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { ArrowUpDown, MoreHorizontal, Copy, Eye } from "lucide-react";

export interface LogItem {
  id: string;
  admin_id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: unknown[] | null;
  tool_results: unknown[] | null;
  model: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
  admin: {
    full_name: string | null;
    email: string | null;
    id: string;
  } | null;
  profile: {
    avatar_url: string | null;
  } | null;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "user":
      return <Badge variant="outline">Kullanıcı</Badge>;
    case "assistant":
      return <Badge variant="secondary">Asistan</Badge>;
    case "system":
      return <Badge>Sistem</Badge>;
    case "tool":
      return (
        <Badge
          variant="outline"
          className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
        >
          Tool
        </Badge>
      );
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export const columns: ColumnDef<LogItem>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Tarih
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">{formatDate(row.getValue("created_at"))}</span>
    )
  },
  {
    accessorKey: "admin",
    header: "Admin",
    cell: ({ row }) => {
      const admin = row.original.admin;
      const name = admin?.full_name || admin?.email?.split("@")[0] || "-";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const avatarUrl = row.original.profile?.avatar_url;

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs">{name}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => getRoleBadge(row.getValue("role")),
    filterFn: (row, id, value) => value.includes(row.getValue(id))
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => {
      const role = row.original.role;
      const model = row.getValue("model") as string | null;

      // Assistant için model adını göster
      if (role === "assistant" && model) {
        // Model adını kısalt (örn: google/gemini-2.0-flash-exp:free -> gemini-2.0-flash)
        const shortModel = model.split("/").pop()?.replace(":free", "") || model;
        return <span className="font-mono text-xs">{shortModel}</span>;
      }

      return <span className="text-muted-foreground">-</span>;
    }
  },
  {
    accessorKey: "tokens_used",
    header: () => <div className="text-right">Token</div>,
    cell: ({ row }) => {
      const tokens = row.getValue("tokens_used") as number | null;
      return (
        <div className="text-right font-mono">{tokens ? tokens.toLocaleString("tr-TR") : "-"}</div>
      );
    }
  },
  {
    accessorKey: "duration_ms",
    header: () => <div className="text-right">Süre</div>,
    cell: ({ row }) => {
      const duration = row.getValue("duration_ms") as number | null;
      return <div className="text-right font-mono">{duration ? `${duration}ms` : "-"}</div>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.id)}>
              <Copy className="h-4 w-4 mr-2" />
              ID Kopyala
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.content || "")}>
              <Copy className="h-4 w-4 mr-2" />
              İçerik Kopyala
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(log.session_id)}>
              <Eye className="h-4 w-4 mr-2" />
              Session ID Kopyala
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
