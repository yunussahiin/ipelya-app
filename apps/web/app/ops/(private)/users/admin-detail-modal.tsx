"use client";

import { useState } from "react";
import {
  IconBan,
  IconCalendar,
  IconMail,
  IconShield,
  IconTrash,
  IconUser,
  IconUserOff
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDetailModalProps {
  admin: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDetailModal({ admin, open, onOpenChange }: AdminDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!admin) return null;

  const handleDeactivate = async () => {
    setIsLoading(true);
    // TODO: Deactivate admin action
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    // TODO: Delete admin action
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Detayları</DialogTitle>
          <DialogDescription>Admin kullanıcı bilgilerini görüntüleyin ve yönetin</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Admin Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.email}`} />
              <AvatarFallback className="text-2xl">
                {admin.full_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{admin.full_name || "İsimsiz"}</h3>
                <Badge variant="default" className="bg-purple-500">
                  <IconShield className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
              <div className="mt-2 flex items-center gap-2">
                {admin.is_active ? (
                  <Badge variant="default" className="bg-green-500">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="destructive">Pasif</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="security">Güvenlik</TabsTrigger>
            </TabsList>

            {/* Genel Bilgiler */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    Admin ID
                  </Label>
                  <p className="font-mono text-sm">{admin.id}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconMail className="h-4 w-4" />
                    E-posta
                  </Label>
                  <p className="text-sm">{admin.email || admin.profiles?.email || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconMail className="h-4 w-4" />
                    Telefon
                  </Label>
                  <p className="text-sm">{admin.phone || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    Oluşturma Tarihi
                  </Label>
                  <p className="text-sm">
                    {new Date(admin.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    Güncelleme Tarihi
                  </Label>
                  <p className="text-sm">
                    {new Date(admin.updated_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconShield className="h-4 w-4" />
                    Durum
                  </Label>
                  <p className="text-sm">{admin.is_active ? "Aktif" : "Pasif"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    E-posta Doğrulama
                  </Label>
                  <p className="text-sm">
                    {admin.profiles?.email_confirmed_at
                      ? new Date(admin.profiles.email_confirmed_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Doğrulanmamış"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    Telefon Doğrulama
                  </Label>
                  <p className="text-sm">
                    {admin.profiles?.phone_confirmed_at
                      ? new Date(admin.profiles.phone_confirmed_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Doğrulanmamış"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconShield className="h-4 w-4" />
                    Super Admin
                  </Label>
                  <p className="text-sm">{admin.profiles?.is_super_admin ? "Evet" : "Hayır"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    SSO Kullanıcısı
                  </Label>
                  <p className="text-sm">{admin.profiles?.is_sso_user ? "Evet" : "Hayır"}</p>
                </div>
              </div>
            </TabsContent>

            {/* Güvenlik */}
            <TabsContent value="security" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-4 font-semibold">Admin İşlemleri</h4>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleDeactivate}
                  >
                    <IconUserOff className="mr-2 h-4 w-4" />
                    {admin.is_active ? "Pasifleştir" : "Aktifleştir"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleDelete}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
