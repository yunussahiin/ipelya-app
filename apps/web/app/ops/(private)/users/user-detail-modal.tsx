"use client";

import { useState } from "react";
import {
  IconBan,
  IconCalendar,
  IconDeviceMobile,
  IconLock,
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
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "ban" | "delete" | null;
    open: boolean;
  }>({ type: null, open: false });

  if (!user) return null;

  const handleBanUser = async () => {
    setIsLoading(true);
    // TODO: Ban user action
    setTimeout(() => {
      setIsLoading(false);
      setConfirmDialog({ type: null, open: false });
      onOpenChange(false);
    }, 1000);
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    // TODO: Delete user action
    setTimeout(() => {
      setIsLoading(false);
      setConfirmDialog({ type: null, open: false });
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
              <TabsTrigger value="shadow">Shadow Profil</TabsTrigger>
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
                  <Badge
                    variant={user.type === "shadow" ? "secondary" : "default"}
                    className="w-fit"
                  >
                    {user.type === "real"
                      ? "Gerçek Profil"
                      : user.type === "shadow"
                        ? "Shadow Profil"
                        : "-"}
                  </Badge>
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

            {/* Onboarding */}
            <TabsContent value="onboarding" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-4 font-semibold">Onboarding Durumu</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Adım:</span>
                    <Badge variant="default">{user.onboarding_step || 0}/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tamamlanma Tarihi:</span>
                    <span className="text-sm">
                      {user.onboarding_completed_at
                        ? new Date(user.onboarding_completed_at).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Tamamlanmamış"}
                    </span>
                  </div>
                  <Separator />

                  {/* Step 1 - Profil Bilgileri */}
                  {user.onboarding_step >= 1 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Adım 1: Profil Bilgileri</h5>
                      <div className="pl-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Display Name:</span>
                          <span
                            className={
                              !user.onboarding_data?.step1?.displayName
                                ? "text-muted-foreground"
                                : ""
                            }
                          >
                            {user.onboarding_data?.step1?.displayName ||
                              user.display_name ||
                              "Seçilmedi"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cinsiyet:</span>
                          <Badge
                            variant={
                              (user.onboarding_data?.step1?.gender || user.gender) &&
                              (user.onboarding_data?.step1?.gender || user.gender) !==
                                "belirtmek-istemiyorum"
                                ? "secondary"
                                : "outline"
                            }
                            className="capitalize"
                          >
                            {(user.onboarding_data?.step1?.gender || user.gender) ===
                            "belirtmek-istemiyorum"
                              ? "Belirtmek İstemiyorum"
                              : user.onboarding_data?.step1?.gender || user.gender || "Seçilmedi"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bio:</span>
                          <span
                            className={`text-right max-w-xs ${!user.onboarding_data?.step1?.bio ? "text-muted-foreground" : ""}`}
                          >
                            {user.onboarding_data?.step1?.bio || user.bio || "Seçilmedi"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {user.onboarding_step >= 2 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Adım 2: Kişilik Özellikleri</h5>
                        <div className="pl-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mood:</span>
                            <Badge
                              variant={user.onboarding_data?.step2?.mood ? "secondary" : "outline"}
                              className="capitalize"
                            >
                              {user.onboarding_data?.step2?.mood || "Seçilmedi"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Energy:</span>
                            <Badge
                              variant={
                                user.onboarding_data?.step2?.energy ? "secondary" : "outline"
                              }
                              className="capitalize"
                            >
                              {user.onboarding_data?.step2?.energy || "Seçilmedi"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Personality:</span>
                            <Badge
                              variant={
                                user.onboarding_data?.step2?.personality ? "secondary" : "outline"
                              }
                              className="capitalize"
                            >
                              {user.onboarding_data?.step2?.personality || "Seçilmedi"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3 */}
                  {user.onboarding_step >= 3 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Adım 3: Shadow Mode & Biometric</h5>
                        <div className="pl-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Shadow PIN Hash:</span>
                            <Badge variant={user.shadow_pin_hash ? "default" : "secondary"}>
                              {user.shadow_pin_hash ? "✓ Ayarlanmış" : "✗ Ayarlanmamış"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Biometric Enabled:</span>
                            <Badge
                              variant={
                                user.onboarding_data?.step3?.biometricEnabled
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.onboarding_data?.step3?.biometricEnabled ? "✓ Evet" : "✗ Hayır"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Biometric Type:</span>
                            <Badge variant="secondary" className="capitalize">
                              {user.onboarding_data?.step3?.biometricType || "-"}
                            </Badge>
                          </div>
                          {user.shadow_pin_created_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">PIN Oluşturma Tarihi:</span>
                              <span className="text-xs">
                                {new Date(user.shadow_pin_created_at).toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 4 */}
                  {user.onboarding_step >= 4 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Adım 4: Şartlar & Kabuller</h5>
                        <div className="pl-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ToS Accepted:</span>
                            <Badge variant={user.tos_accepted_at ? "default" : "secondary"}>
                              {user.tos_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Privacy Accepted:</span>
                            <Badge variant={user.privacy_accepted_at ? "default" : "secondary"}>
                              {user.privacy_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Firewall Accepted:</span>
                            <Badge variant={user.firewall_accepted_at ? "default" : "secondary"}>
                              {user.firewall_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Anti-Screenshot Accepted:</span>
                            <Badge
                              variant={user.anti_screenshot_accepted_at ? "default" : "secondary"}
                            >
                              {user.anti_screenshot_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shadow" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-4 font-semibold">Shadow Profil Bilgileri</h4>
                <div className="space-y-4">
                  {/* Profil Durumu */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Profil Durumu</Label>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Aktif:</span>
                        <Badge variant={user.shadow_profile_active ? "default" : "secondary"}>
                          {user.shadow_profile_active ? "✓ Evet" : "✗ Hayır"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Açılmış:</span>
                        <Badge variant={user.shadow_unlocked ? "default" : "secondary"}>
                          {user.shadow_unlocked ? "✓ Evet" : "✗ Hayır"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* PIN Bilgileri */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconLock className="h-4 w-4" />
                      PIN Bilgileri
                    </Label>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">PIN Ayarlanmış:</span>
                        <Badge variant={user.shadow_pin_hash ? "default" : "secondary"}>
                          {user.shadow_pin_hash ? "✓ Evet" : "✗ Hayır"}
                        </Badge>
                      </div>
                      {user.shadow_pin_hash && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">PIN Hash:</span>
                          <span className="font-mono text-xs truncate max-w-xs">
                            {user.shadow_pin_hash.substring(0, 16)}...
                          </span>
                        </div>
                      )}
                      {user.shadow_pin_created_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Oluşturma Tarihi:</span>
                          <span className="text-xs">
                            {new Date(user.shadow_pin_created_at).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Biometric Bilgileri */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconDeviceMobile className="h-4 w-4" />
                      Biometric Bilgileri
                    </Label>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Aktif:</span>
                        <Badge variant={user.biometric_enabled ? "default" : "secondary"}>
                          {user.biometric_enabled ? "✓ Evet" : "✗ Hayır"}
                        </Badge>
                      </div>
                      {user.biometric_type && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Türü:</span>
                          <Badge variant="secondary" className="capitalize">
                            {user.biometric_type === "face_id"
                              ? "Face ID"
                              : user.biometric_type === "touch_id"
                                ? "Touch ID"
                                : user.biometric_type === "fingerprint"
                                  ? "Fingerprint"
                                  : user.biometric_type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Kullanıcı Bilgileri */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconUser className="h-4 w-4" />
                      Kullanıcı Bilgileri
                    </Label>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanıcı Adı:</span>
                        <span className="font-medium">@{user.username || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Görünen Ad:</span>
                        <span className="font-medium">{user.display_name || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">E-posta:</span>
                        <span className="text-xs">{user.email || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  {/* Shadow Mode Section */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconLock className="h-4 w-4" />
                      Shadow Mode Durumu
                    </Label>
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Profil Aktif:</span>
                        <Badge variant={user.shadow_profile_active ? "default" : "secondary"}>
                          {user.shadow_profile_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">PIN Ayarlanmış:</span>
                        <Badge variant={user.shadow_pin_hash ? "default" : "secondary"}>
                          {user.shadow_pin_hash ? "Evet" : "Hayır"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Biometric:</span>
                        <Badge variant={user.biometric_enabled ? "default" : "secondary"}>
                          {user.biometric_enabled
                            ? `Aktif (${user.biometric_type || "Bilinmiyor"})`
                            : "Pasif"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Device Info */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconDeviceMobile className="h-4 w-4" />
                      Son Cihaz
                    </Label>
                    {user.last_device_info ? (
                      <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium">{user.last_device_info.model || "-"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform:</span>
                          <Badge variant="secondary" className="capitalize">
                            {user.last_device_info.platform || "-"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">OS Versiyonu:</span>
                          <span className="font-medium">
                            {user.last_device_info.os_version || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">App Versiyonu:</span>
                          <span className="font-medium">
                            {user.last_device_info.app_version || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Device ID:</span>
                          <span className="font-mono text-xs">
                            {user.last_device_info.device_id || "-"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Cihaz bilgisi bulunamadı</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Son IP Adresi</Label>
                    <p className="font-mono text-sm">{user.last_ip_address || "-"}</p>
                  </div>

                  <Separator />

                  {/* Step 4 Acceptances */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <IconShield className="h-4 w-4" />
                      Kabul Edilen Şartlar
                    </Label>
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Kullanım Şartları:</span>
                        <Badge variant={user.tos_accepted_at ? "default" : "secondary"}>
                          {user.tos_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Gizlilik Politikası:</span>
                        <Badge variant={user.privacy_accepted_at ? "default" : "secondary"}>
                          {user.privacy_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Anti-Screenshot:</span>
                        <Badge variant={user.anti_screenshot_accepted_at ? "default" : "secondary"}>
                          {user.anti_screenshot_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Firewall:</span>
                        <Badge variant={user.firewall_accepted_at ? "default" : "secondary"}>
                          {user.firewall_accepted_at ? "✓ Kabul" : "✗ Reddedildi"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          {user.type !== "banned" && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDialog({ type: "ban", open: true })}
              disabled={isLoading}
            >
              <IconBan className="mr-2 h-4 w-4" />
              Yasakla
            </Button>
          )}
          {user.type === "banned" && (
            <Button
              variant="default"
              onClick={() => setConfirmDialog({ type: "ban", open: true })}
              disabled={isLoading}
            >
              <IconUserOff className="mr-2 h-4 w-4" />
              Yasağı Kaldır
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setConfirmDialog({ type: "delete", open: true })}
            disabled={isLoading}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Sil
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(newOpen) => setConfirmDialog({ ...confirmDialog, open: newOpen })}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.type === "ban" ? "Kullanıcıyı Yasakla" : "Kullanıcıyı Sil"}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.type === "ban"
                  ? user.type === "banned"
                    ? "Bu kullanıcının yasağını kaldırmak istediğinize emin misiniz?"
                    : "Bu kullanıcıyı yasaklamak istediğinize emin misiniz?"
                  : "Bu işlem geri alınamaz. Kullanıcıyı silmek istediğinize emin misiniz?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ type: null, open: false })}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button
                variant={confirmDialog.type === "delete" ? "destructive" : "default"}
                onClick={confirmDialog.type === "ban" ? handleBanUser : handleDeleteUser}
                disabled={isLoading}
              >
                {confirmDialog.type === "ban" ? "Evet, Yasakla" : "Evet, Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
