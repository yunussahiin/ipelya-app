"use client";

import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconCoin,
  IconHeart,
  IconMail,
  IconPhone,
  IconPhoto,
  IconUsers,
  IconVideo
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

interface CreatorDetailModalProps {
  creator: Creator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorDetailModal({ creator, open, onOpenChange }: CreatorDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] w-full max-w-none overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Creator Detayları</DialogTitle>
          <DialogDescription>
            {creator.display_name || creator.full_name || "İsimsiz"} (@
            {creator.username || "kullanici"}) - Creator bilgileri ve istatistikleri
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            <TabsTrigger value="content">İçerikler</TabsTrigger>
            <TabsTrigger value="earnings">Kazançlar</TabsTrigger>
          </TabsList>

          {/* General Info */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={creator.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {creator.full_name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {creator.display_name || creator.full_name || "İsimsiz"}
                    </h3>
                    <p className="text-muted-foreground">@{creator.username || "kullanici"}</p>
                    <div className="mt-2 flex gap-2">
                      {creator.is_verified && (
                        <Badge variant="default" className="bg-blue-500">
                          Doğrulanmış
                        </Badge>
                      )}
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
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconMail className="h-4 w-4" />
                      E-posta
                    </p>
                    <p className="text-sm">{creator.email || "⚠️ Tanımsız"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconPhone className="h-4 w-4" />
                      Telefon
                    </p>
                    <p className="text-sm">{creator.phone || "⚠️ Tanımsız"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{creator.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                    <p className="text-sm">
                      {new Date(creator.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol</p>
                    <Badge variant="outline">{creator.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Durum</p>
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
                  </div>
                  {creator.bio && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Biyografi</p>
                      <p className="text-sm">{creator.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sosyal Medya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <IconBrandInstagram className="h-5 w-5" />
                  <span className="text-sm">@creator_instagram</span>
                </div>
                <div className="flex items-center gap-3">
                  <IconBrandTwitter className="h-5 w-5" />
                  <span className="text-sm">@creator_twitter</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="default">Onayla</Button>
              <Button variant="outline">Doğrula</Button>
              <Button variant="outline">Mesaj Gönder</Button>
              <Button variant="destructive">Yasakla</Button>
            </div>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Takipçi</CardTitle>
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,543</div>
                  <p className="text-xs text-muted-foreground">+180 bu ay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Post</CardTitle>
                  <IconPhoto className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">+12 bu hafta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Video</CardTitle>
                  <IconVideo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">26% video oranı</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Beğeni</CardTitle>
                  <IconHeart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45.2K</div>
                  <p className="text-xs text-muted-foreground">Ortalama 132/post</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrikleri</CardTitle>
                <CardDescription>Son 30 günlük performans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Görüntülenme</span>
                      <span className="font-medium">234.5K</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[85%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Etkileşim Oranı</span>
                      <span className="font-medium">8.4%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[84%] rounded-full bg-green-500" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Yeni Takipçi Oranı</span>
                      <span className="font-medium">+1.4%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[14%] rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Son İçerikler</CardTitle>
                <CardDescription>En son paylaşılan içerikler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings */}
          <TabsContent value="earnings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Kazanç</CardTitle>
                  <IconCoin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺45,231</div>
                  <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                  <IconCoin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺8,450</div>
                  <p className="text-xs text-muted-foreground">+18% geçen aya göre</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
                  <IconCoin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺1,250</div>
                  <p className="text-xs text-muted-foreground">Ödeme bekliyor</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gelir Kaynakları</CardTitle>
                <CardDescription>Kazanç dağılımı</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Abonelikler</span>
                  <span className="font-medium">₺5,200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">PPV İçerikler</span>
                  <span className="font-medium">₺2,100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bahşişler</span>
                  <span className="font-medium">₺850</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mesajlar</span>
                  <span className="font-medium">₺300</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
