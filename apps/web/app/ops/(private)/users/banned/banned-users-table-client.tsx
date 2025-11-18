"use client";

import { useState } from "react";
import { IconClock, IconEye, IconLock, IconUserCheck } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { BannedUserDetailModal } from "./banned-user-detail-modal";

interface BannedUser {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  type: string;
  ban_reason: string | null;
  ban_expires_at: string | null;
  updated_at: string;
}

export function BannedUsersTableClient({ data }: { data: BannedUser[] }) {
  const [selectedUser, setSelectedUser] = useState<BannedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (user: BannedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const getBanType = (expiresAt: string | null) => {
    if (!expiresAt) return "Kalıcı";
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    if (expiryDate < now) return "Süresi Dolmuş";
    return "Geçici";
  };

  const getRemainingTime = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();

    if (diff < 0) return "Süresi doldu";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} gün ${hours} saat`;
    return `${hours} saat`;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Kullanıcı Adı</TableHead>
            <TableHead>Yasak Tipi</TableHead>
            <TableHead>Neden</TableHead>
            <TableHead>Kalan Süre</TableHead>
            <TableHead>Yasak Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Yasaklı kullanıcı bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            data.map((user) => {
              const banType = getBanType(user.ban_expires_at);
              const remainingTime = getRemainingTime(user.ban_expires_at);

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "İsimsiz"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">@{user.username || "kullanici"}</span>
                  </TableCell>
                  <TableCell>
                    {banType === "Kalıcı" && (
                      <Badge variant="destructive">
                        <IconLock className="mr-1 h-3 w-3" />
                        Kalıcı
                      </Badge>
                    )}
                    {banType === "Geçici" && (
                      <Badge variant="default" className="bg-orange-500">
                        <IconClock className="mr-1 h-3 w-3" />
                        Geçici
                      </Badge>
                    )}
                    {banType === "Süresi Dolmuş" && <Badge variant="outline">Süresi Dolmuş</Badge>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.ban_reason || "Belirtilmemiş"}</span>
                  </TableCell>
                  <TableCell>
                    {remainingTime ? (
                      <span className="text-sm text-muted-foreground">{remainingTime}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.updated_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Detayları Görüntüle</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <IconUserCheck className="h-4 w-4 text-green-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Yasağı Kaldır</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {selectedUser && (
        <BannedUserDetailModal
          user={selectedUser}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}
