"use client";

import {
  IconAlertTriangle,
  IconClock,
  IconHistory,
  IconLock,
  IconShield
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface BannedUserDetailModalProps {
  user: BannedUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BannedUserDetailModal({ user, open, onOpenChange }: BannedUserDetailModalProps) {
  const isPermanent = !user.ban_expires_at;
  const isExpired = user.ban_expires_at && new Date(user.ban_expires_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yasaklı Kullanıcı Detayları</DialogTitle>
          <DialogDescription>
            @{user.username || "kullanici"} - Yasak bilgileri ve geçmiş
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Yasak Bilgileri</TabsTrigger>
            <TabsTrigger value="history">Geçmiş</TabsTrigger>
            <TabsTrigger value="actions">İşlemler</TabsTrigger>
          </TabsList>

          {/* Ban Info */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{user.full_name || "İsimsiz"}</h3>
                    <p className="text-muted-foreground">@{user.username || "kullanici"}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="destructive">Yasaklı</Badge>
                      {isPermanent && (
                        <Badge variant="destructive" className="bg-red-700">
                          <IconLock className="mr-1 h-3 w-3" />
                          Kalıcı
                        </Badge>
                      )}
                      {!isPermanent && !isExpired && (
                        <Badge variant="default" className="bg-orange-500">
                          <IconClock className="mr-1 h-3 w-3" />
                          Geçici
                        </Badge>
                      )}
                      {isExpired && <Badge variant="outline">Süresi Dolmuş</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{user.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol</p>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Yasak Tarihi</p>
                    <p className="text-sm">
                      {new Date(user.updated_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bitiş Tarihi</p>
                    <p className="text-sm">
                      {user.ban_expires_at
                        ? new Date(user.ban_expires_at).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Kalıcı"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <IconAlertTriangle className="mr-2 inline h-5 w-5" />
                  Yasak Nedeni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm">{user.ban_reason || "Yasak nedeni belirtilmemiş"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İhlal Detayları</CardTitle>
                <CardDescription>Yasaklamaya neden olan ihlaller</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <IconShield className="mt-0.5 h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium">Spam İçerik</p>
                    <p className="text-sm text-muted-foreground">
                      Kısa sürede çok sayıda benzer içerik paylaşımı
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">15 Kasım 2024, 14:30</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <IconShield className="mt-0.5 h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium">Kullanıcı Tacizi</p>
                    <p className="text-sm text-muted-foreground">
                      Diğer kullanıcılara rahatsız edici mesajlar
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">12 Kasım 2024, 09:15</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <IconShield className="mt-0.5 h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="font-medium">Topluluk Kuralları İhlali</p>
                    <p className="text-sm text-muted-foreground">Uygunsuz içerik paylaşımı</p>
                    <p className="mt-1 text-xs text-muted-foreground">08 Kasım 2024, 16:45</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <IconHistory className="mr-2 inline h-5 w-5" />
                  İşlem Geçmişi
                </CardTitle>
                <CardDescription>Kullanıcıyla ilgili tüm moderasyon işlemleri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 border-l-2 border-red-500 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Yasaklandı</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.updated_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">
                      Admin tarafından {isPermanent ? "kalıcı" : "geçici"} olarak yasaklandı
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Neden: {user.ban_reason || "Belirtilmemiş"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-orange-500 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-orange-500">
                        Uyarı
                      </Badge>
                      <span className="text-sm text-muted-foreground">12 Kasım 2024</span>
                    </div>
                    <p className="mt-1 text-sm">Topluluk kuralları ihlali nedeniyle uyarıldı</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-yellow-500 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-yellow-500">
                        İçerik Kaldırıldı
                      </Badge>
                      <span className="text-sm text-muted-foreground">08 Kasım 2024</span>
                    </div>
                    <p className="mt-1 text-sm">3 adet uygunsuz içerik kaldırıldı</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-500">
                        Rapor Edildi
                      </Badge>
                      <span className="text-sm text-muted-foreground">05 Kasım 2024</span>
                    </div>
                    <p className="mt-1 text-sm">
                      5 kullanıcı tarafından spam nedeniyle rapor edildi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Moderasyon İşlemleri</CardTitle>
                <CardDescription>Bu kullanıcı için yapılabilecek işlemler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Yasak Yönetimi</h4>
                  <div className="flex gap-2">
                    <Button variant="default" className="bg-green-500 hover:bg-green-600">
                      Yasağı Kaldır
                    </Button>
                    <Button variant="outline">Yasak Süresini Uzat</Button>
                    <Button variant="outline">Geçici Yasağa Çevir</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">İletişim</h4>
                  <div className="flex gap-2">
                    <Button variant="outline">Kullanıcıya Mesaj Gönder</Button>
                    <Button variant="outline">E-posta Gönder</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Veri Yönetimi</h4>
                  <div className="flex gap-2">
                    <Button variant="outline">Tüm İçerikleri Görüntüle</Button>
                    <Button variant="outline">Hesap Geçmişini İndir</Button>
                  </div>
                </div>

                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <h4 className="mb-2 font-semibold text-destructive">Tehlikeli İşlemler</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Bu işlemler geri alınamaz. Dikkatli olun.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm">
                      Hesabı Kalıcı Sil
                    </Button>
                    <Button variant="destructive" size="sm">
                      Tüm İçerikleri Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
