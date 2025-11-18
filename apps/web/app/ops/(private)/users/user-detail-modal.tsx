"use client";

import { useState } from "react";
import {
  IconBan,
  IconCalendar,
  IconDeviceMobile,
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

interface UserDetailModalProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailModal({ user, open, onOpenChange }: UserDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const handleBanUser = async () => {
    setIsLoading(true);
    // TODO: Ban user action
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    // TODO: Delete user action
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayları</DialogTitle>
          <DialogDescription>Kullanıcı bilgilerini görüntüleyin ve yönetin</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {user.display_name?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">
                  {user.display_name || user.username || "İsimsiz"}
                </h3>
                {user.is_creator && (
                  <Badge variant="default" className="bg-blue-500">
                    Creator
                  </Badge>
                )}
                {user.role === "admin" && (
                  <Badge variant="default" className="bg-purple-500">
                    <IconShield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{user.username || "kullanici"}</p>
              <div className="mt-2 flex items-center gap-2">
                {user.role === "banned" ? (
                  <Badge variant="destructive">Yasaklı</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    Aktif
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="activity">Aktivite</TabsTrigger>
              <TabsTrigger value="security">Güvenlik</TabsTrigger>
            </TabsList>

            {/* Genel Bilgiler */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    Kullanıcı ID
                  </Label>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconMail className="h-4 w-4" />
                    E-posta
                  </Label>
                  <p className="text-sm">{user.email || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconDeviceMobile className="h-4 w-4" />
                    Telefon
                  </Label>
                  <p className="text-sm">{user.phone || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    Kullanıcı Adı
                  </Label>
                  <p className="text-sm">@{user.username || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    Kayıt Tarihi
                  </Label>
                  <p className="text-sm">
                    {new Date(user.created_at).toLocaleDateString("tr-TR", {
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
                    Son Giriş
                  </Label>
                  <p className="text-sm">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "-"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconShield className="h-4 w-4" />
                    Profil Tipi
                  </Label>
                  <p className="text-sm capitalize">{user.type || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconShield className="h-4 w-4" />
                    Rol
                  </Label>
                  <p className="text-sm capitalize">{user.role || "user"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconDeviceMobile className="h-4 w-4" />
                    Son IP Adresi
                  </Label>
                  <p className="font-mono text-sm">{user.last_ip_address || "-"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    E-posta Doğrulama
                  </Label>
                  <p className="text-sm">
                    {user.email_confirmed_at
                      ? new Date(user.email_confirmed_at).toLocaleDateString("tr-TR", {
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
                    {user.phone_confirmed_at
                      ? new Date(user.phone_confirmed_at).toLocaleDateString("tr-TR", {
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
                    <IconBan className="h-4 w-4" />
                    Yasaklama Tarihi
                  </Label>
                  <p className="text-sm">
                    {user.banned_until
                      ? new Date(user.banned_until).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Yasaklanmamış"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconShield className="h-4 w-4" />
                    Super Admin
                  </Label>
                  <p className="text-sm">{user.is_super_admin ? "Evet" : "Hayır"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    SSO Kullanıcısı
                  </Label>
                  <p className="text-sm">{user.is_sso_user ? "Evet" : "Hayır"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    Anonim
                  </Label>
                  <p className="text-sm">{user.is_anonymous ? "Evet" : "Hayır"}</p>
                </div>
              </div>

              {user.bio && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Biyografi</Label>
                  <p className="rounded-md border bg-muted/50 p-3 text-sm">{user.bio}</p>
                </div>
              )}
            </TabsContent>

            {/* Aktivite */}
            <TabsContent value="activity" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-4 font-semibold">Son Aktiviteler</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Toplam İçerik</span>
                    <span className="font-medium">0</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Toplam Gelir</span>
                    <span className="font-medium">₺0</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Takipçi Sayısı</span>
                    <span className="font-medium">0</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Takip Edilen</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Güvenlik */}
            <TabsContent value="security" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-4 font-semibold">Güvenlik Bilgileri</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconDeviceMobile className="h-4 w-4" />
                      Son Cihaz
                    </Label>
                    <div className="rounded-md border bg-muted/50 p-3">
                      <pre className="text-xs overflow-x-auto">
                        {user.last_device_info
                          ? JSON.stringify(user.last_device_info, null, 2)
                          : "-"}
                      </pre>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Son IP Adresi</Label>
                    <p className="font-mono text-sm">{user.last_ip_address || "-"}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Shadow Mode</Label>
                    <Badge variant={user.shadow_unlocked ? "default" : "secondary"}>
                      {user.shadow_unlocked ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          {user.type !== "banned" && (
            <Button variant="destructive" onClick={handleBanUser} disabled={isLoading}>
              <IconBan className="mr-2 h-4 w-4" />
              Yasakla
            </Button>
          )}
          {user.type === "banned" && (
            <Button variant="default" onClick={handleBanUser} disabled={isLoading}>
              <IconUserOff className="mr-2 h-4 w-4" />
              Yasağı Kaldır
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
            <IconTrash className="mr-2 h-4 w-4" />
            Sil
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
