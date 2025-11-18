"use client";

import { useState } from "react";
import { IconEye, IconShield, IconTrash, IconUserCheck, IconUserOff } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { UserDetailModal } from "./user-detail-modal";
import { AdminDetailModal } from "./admin-detail-modal";

interface UsersTableClientProps {
  profiles: any[] | null;
  adminProfiles: any[] | null;
  filter: "all" | "users" | "creators" | "admins" | "banned";
}

export function UsersTableClient({ profiles, adminProfiles, filter }: UsersTableClientProps) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

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
    <>
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
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleViewDetails(admin)}
                              >
                                <IconEye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detayları Gör</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <IconUserOff className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pasifleştir</TooltipContent>
                          </Tooltip>
                        </div>
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
                              {profile.display_name?.charAt(0) ||
                                profile.username?.charAt(0) ||
                                "U"}
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
                        {profile.role === "admin" ? (
                          <Badge variant="default" className="bg-purple-500">
                            Admin
                          </Badge>
                        ) : profile.is_creator ? (
                          <Badge variant="default" className="bg-blue-500">
                            Creator
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Kullanıcı</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {profile.role === "banned" ? (
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
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleViewDetails(profile)}
                              >
                                <IconEye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Detayları Gör</TooltipContent>
                          </Tooltip>

                          {profile.type !== "banned" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <IconUserOff className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Yasakla</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-green-600 hover:text-green-600"
                                >
                                  <IconUserCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Yasağı Kaldır</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sil</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filter === "admins" ? (
        <AdminDetailModal admin={selectedUser} open={modalOpen} onOpenChange={setModalOpen} />
      ) : (
        <UserDetailModal user={selectedUser} open={modalOpen} onOpenChange={setModalOpen} />
      )}
    </>
  );
}
