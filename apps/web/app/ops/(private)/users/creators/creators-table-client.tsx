"use client";

import { useState } from "react";
import { IconCheck, IconEye, IconShieldCheck, IconUserOff, IconX } from "@tabler/icons-react";

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

import { CreatorDetailModal } from "./creator-detail-modal";

interface Creator {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  role: string;
  type: string;
  is_verified: boolean;
  created_at: string;
}

export function CreatorsTableClient({ data }: { data: Creator[] }) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsModalOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creator</TableHead>
            <TableHead>Kullanıcı Adı</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Doğrulama</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Creator bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            data.map((creator) => (
              <TableRow key={creator.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={creator.avatar_url || undefined} />
                      <AvatarFallback>
                        {creator.full_name?.charAt(0) || creator.username?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {creator.display_name || creator.full_name || "İsimsiz"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {creator.user_id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">@{creator.username || "kullanici"}</span>
                </TableCell>
                <TableCell>
                  {creator.type === "active" && (
                    <Badge variant="default" className="bg-green-500">
                      Aktif
                    </Badge>
                  )}
                  {creator.type === "pending" && <Badge variant="secondary">Bekliyor</Badge>}
                  {creator.type === "suspended" && <Badge variant="destructive">Askıda</Badge>}
                  {creator.type === "banned" && <Badge variant="destructive">Yasaklı</Badge>}
                  {!creator.type && (
                    <Badge variant="outline" className="text-yellow-600">
                      ⚠️ Tanımsız
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {creator.is_verified ? (
                    <Badge variant="default" className="bg-blue-500">
                      <IconShieldCheck className="mr-1 h-3 w-3" />
                      Doğrulanmış
                    </Badge>
                  ) : (
                    <Badge variant="outline">Doğrulanmamış</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(creator.created_at).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleViewDetails(creator)}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Detayları Görüntüle</TooltipContent>
                    </Tooltip>

                    {!creator.is_verified && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <IconCheck className="h-4 w-4 text-green-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Doğrula</TooltipContent>
                      </Tooltip>
                    )}

                    {creator.type === "pending" && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <IconCheck className="h-4 w-4 text-green-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Onayla</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <IconX className="h-4 w-4 text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reddet</TooltipContent>
                        </Tooltip>
                      </>
                    )}

                    {creator.type !== "banned" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <IconUserOff className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Yasakla</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedCreator && (
        <CreatorDetailModal
          creator={selectedCreator}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </>
  );
}
