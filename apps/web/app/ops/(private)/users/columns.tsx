"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type UserProfile = {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  role: "user" | "creator" | "admin";
  is_creator: boolean;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  shadow_profile_active: boolean;
  shadow_pin_hash: string | null;
  biometric_enabled: boolean;
  biometric_type: string | null;
  last_login_at: string | null;
  created_at: string;
  banned_until: string | null;
};

export const columns: ColumnDef<UserProfile>[] = [
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
        aria-label="Satırı seç"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "display_name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Kullanıcı
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const profile = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {profile.display_name?.charAt(0) || profile.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {profile.display_name || profile.username || "İsimsiz"}
            </div>
            <div className="text-sm text-muted-foreground">@{profile.username || "kullanici"}</div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Tip
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const profile = row.original;
      if (profile.role === "admin") {
        return <Badge className="bg-purple-500">Admin</Badge>;
      }
      if (profile.is_creator) {
        return <Badge className="bg-blue-500">Creator</Badge>;
      }
      return <Badge variant="secondary">Kullanıcı</Badge>;
    }
  },
  {
    accessorKey: "banned_until",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Durum
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const profile = row.original;
      if (profile.banned_until) {
        return <Badge variant="destructive">Yasaklı</Badge>;
      }
      return <Badge className="bg-green-500">Aktif</Badge>;
    }
  },
  {
    accessorKey: "onboarding_step",
    header: "Onboarding",
    cell: ({ row }) => {
      const step = row.original.onboarding_step;
      return <Badge variant={step === 5 ? "default" : "secondary"}>{step}/5</Badge>;
    }
  },
  {
    accessorKey: "shadow_profile_active",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Shadow
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const active = row.original.shadow_profile_active;
      return <Badge variant={active ? "default" : "secondary"}>{active ? "Aktif" : "Pasif"}</Badge>;
    }
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Kayıt Tarihi
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return <span className="text-sm">{date.toLocaleDateString("tr-TR")}</span>;
    }
  },
  {
    accessorKey: "last_login_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Son Giriş
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.last_login_at;
      if (!date) return <span className="text-sm text-muted-foreground">-</span>;
      return <span className="text-sm">{new Date(date).toLocaleDateString("tr-TR")}</span>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original;

      const handleOpenDetails = () => {
        if (typeof window !== "undefined" && (window as any).openUserDetail) {
          (window as any).openUserDetail(profile);
        }
      };

      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenDetails}>
            Detaylar
          </Button>
          {!profile.banned_until && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // TODO: Ban user
                console.log("Ban user:", profile.id);
              }}
            >
              Yasakla
            </Button>
          )}
          {profile.banned_until && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // TODO: Unban user
                console.log("Unban user:", profile.id);
              }}
            >
              Yasağı Kaldır
            </Button>
          )}
        </div>
      );
    }
  }
];
