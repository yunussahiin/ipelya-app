"use client";

import Link from "next/link";
import { IconDots, IconEye, IconShield, IconTrash, IconUserOff } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { UserDetailModal } from "./user-detail-modal";

interface UsersTableProps {
  profiles: any[] | null;
  adminProfiles: any[] | null;
  filter: "all" | "users" | "creators" | "admins" | "banned";
}

export function UsersTable({ profiles, adminProfiles, filter }: UsersTableProps) {
  // Admin filter'ı için sadece adminleri göster
  const displayData = filter === "admins" ? adminProfiles : profiles;

  if (!displayData || displayData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {filter === "all" && "Tüm Kullanıcılar"}
          {filter === "users" && "Kullanıcılar"}
          {filter === "creators" && "Creator'lar"}
          {filter === "admins" && "Adminler"}
          {filter === "banned" && "Yasaklı Kullanıcılar"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead>Son Giriş</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filter === "admins"
              ? adminProfiles?.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`}
                          />
                          <AvatarFallback>{admin.full_name?.charAt(0) || "A"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{admin.full_name}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-purple-500">
                        <IconShield className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">-</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <IconEye className="mr-2 h-4 w-4" />
                            Detayları Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <IconUserOff className="mr-2 h-4 w-4" />
                            Pasifleştir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              : profiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
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
                          <div className="text-sm text-muted-foreground">
                            @{profile.username || "kullanici"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.is_creator ? (
                        <Badge variant="default" className="bg-blue-500">
                          Creator
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Kullanıcı</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.type === "banned" ? (
                        <Badge variant="destructive">Yasaklı</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">
                          Aktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {profile.last_login_at
                        ? new Date(profile.last_login_at).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/users/${profile.id}`}>
                              <IconEye className="mr-2 h-4 w-4" />
                              Detayları Gör
                            </Link>
                          </DropdownMenuItem>
                          {profile.type !== "banned" && (
                            <DropdownMenuItem className="text-destructive">
                              <IconUserOff className="mr-2 h-4 w-4" />
                              Yasakla
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <IconTrash className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
