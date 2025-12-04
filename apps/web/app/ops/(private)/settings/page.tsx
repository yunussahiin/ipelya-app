import {
  IconBell,
  IconDatabase,
  IconKey,
  IconMail,
  IconPalette,
  IconServer,
  IconShield,
  IconUsers
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ThemeSwitcherSettings } from "./theme-switcher-settings";
import { ShortcutsSettings } from "./shortcuts-settings";

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;
  const defaultTab = params.tab || "general";

  // Sistem ayarlarını çek (tablo henüz mevcut değil, placeholder)
  // TODO: system_settings tablosu oluşturulduğunda aktif et
  const settings = null;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground">Sistem ayarlarını yönetin</p>
        </div>
        <Button>
          <IconServer className="mr-2 h-4 w-4" />
          Değişiklikleri Kaydet
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="email">E-posta</TabsTrigger>
          <TabsTrigger value="appearance">Görünüm</TabsTrigger>
          <TabsTrigger value="shortcuts">Kısayollar</TabsTrigger>
          <TabsTrigger value="advanced">Gelişmiş</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Platform genelinde geçerli temel ayarlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Adı</Label>
                <Input id="site-name" defaultValue="İpelya" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-description">Site Açıklaması</Label>
                <Textarea
                  id="site-description"
                  defaultValue="Premium içerik paylaşım platformu"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Destek E-postası</Label>
                <Input id="support-email" type="email" defaultValue="support@ipelya.com" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yeni Kayıtlar</Label>
                  <p className="text-sm text-muted-foreground">
                    Yeni kullanıcı kayıtlarına izin ver
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bakım Modu</Label>
                  <p className="text-sm text-muted-foreground">
                    Site bakım moduna alındığında sadece adminler erişebilir
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Limitleri</CardTitle>
              <CardDescription>Kullanıcı ve içerik limitleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max-upload-size">Maksimum Yükleme Boyutu (MB)</Label>
                <Input id="max-upload-size" type="number" defaultValue="100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-video-length">Maksimum Video Süresi (dakika)</Label>
                <Input id="max-video-length" type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-posts-per-day">Günlük Maksimum Post</Label>
                <Input id="max-posts-per-day" type="number" defaultValue="50" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <IconShield className="mr-2 inline h-5 w-5" />
                Güvenlik Ayarları
              </CardTitle>
              <CardDescription>Platform güvenlik yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>İki Faktörlü Kimlik Doğrulama</Label>
                  <p className="text-sm text-muted-foreground">
                    Admin hesapları için 2FA zorunlu yap
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Screenshot Koruması</Label>
                  <p className="text-sm text-muted-foreground">
                    Premium içeriklerde screenshot engelle
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>VPN Engelleme</Label>
                  <p className="text-sm text-muted-foreground">
                    VPN kullanan kullanıcıları engelle
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Bazlı Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Aynı IP'den çok fazla istek yapılmasını engelle
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Maksimum Başarısız Giriş</Label>
                <Input id="max-login-attempts" type="number" defaultValue="5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Güvenliği</CardTitle>
              <CardDescription>API erişim ve güvenlik ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Anahtarı</Label>
                <div className="flex gap-2">
                  <Input id="api-key" type="password" defaultValue="sk_live_***************" />
                  <Button variant="outline">Yenile</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">API isteklerini sınırla</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <IconBell className="mr-2 inline h-5 w-5" />
                Bildirim Ayarları
              </CardTitle>
              <CardDescription>Sistem bildirimleri yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yeni Kullanıcı Bildirimi</Label>
                  <p className="text-sm text-muted-foreground">Yeni kayıt olduğunda bildir</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>İçerik Moderasyon Bildirimi</Label>
                  <p className="text-sm text-muted-foreground">
                    Onay bekleyen içerik olduğunda bildir
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rapor Bildirimi</Label>
                  <p className="text-sm text-muted-foreground">Yeni rapor geldiğinde bildir</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ödeme Bildirimi</Label>
                  <p className="text-sm text-muted-foreground">Yeni ödeme alındığında bildir</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Güvenlik Uyarıları</Label>
                  <p className="text-sm text-muted-foreground">
                    Şüpheli aktivite tespit edildiğinde bildir
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <IconMail className="mr-2 inline h-5 w-5" />
                E-posta Ayarları
              </CardTitle>
              <CardDescription>SMTP ve e-posta yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" defaultValue="smtp.gmail.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" type="number" defaultValue="587" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP Kullanıcı Adı</Label>
                <Input id="smtp-user" type="email" defaultValue="noreply@ipelya.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Şifre</Label>
                <Input id="smtp-password" type="password" defaultValue="***************" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSL/TLS Kullan</Label>
                  <p className="text-sm text-muted-foreground">Güvenli bağlantı kullan</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button variant="outline">Test E-postası Gönder</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <IconPalette className="mr-2 inline h-5 w-5" />
                Görünüm Ayarları
              </CardTitle>
              <CardDescription>Platform tema ve görünüm ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSwitcherSettings />

              <div className="space-y-2">
                <Label htmlFor="primary-color">Ana Renk</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    defaultValue="#8b5cf6"
                    className="h-10 w-20"
                  />
                  <Input defaultValue="#8b5cf6" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animasyonlar</Label>
                  <p className="text-sm text-muted-foreground">UI animasyonlarını etkinleştir</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <IconDatabase className="mr-2 inline h-5 w-5" />
                Gelişmiş Ayarlar
              </CardTitle>
              <CardDescription>Sistem ve veritabanı ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Modu</Label>
                  <p className="text-sm text-muted-foreground">Detaylı hata logları göster</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Sistemi</Label>
                  <p className="text-sm text-muted-foreground">Redis cache kullan</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-ttl">Cache TTL (saniye)</Label>
                <Input id="cache-ttl" type="number" defaultValue="3600" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>CDN Kullan</Label>
                  <p className="text-sm text-muted-foreground">Statik dosyalar için CDN kullan</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cdn-url">CDN URL</Label>
                <Input id="cdn-url" defaultValue="https://cdn.ipelya.com" />
              </div>

              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <h4 className="mb-2 font-semibold text-destructive">Tehlikeli Bölge</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Bu işlemler geri alınamaz. Dikkatli olun.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm">
                    Cache Temizle
                  </Button>
                  <Button variant="destructive" size="sm">
                    Veritabanını Optimize Et
                  </Button>
                  <Button variant="destructive" size="sm">
                    Logları Temizle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sistem Bilgileri</CardTitle>
              <CardDescription>Platform ve sunucu bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform Versiyonu</span>
                <Badge>v2.1.0</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Node.js Versiyonu</span>
                <Badge variant="outline">v20.10.0</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <Badge variant="outline">PostgreSQL 15.4</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <Badge variant="outline">45 gün 12 saat</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shortcuts Settings */}
        <TabsContent value="shortcuts" className="space-y-4">
          <ShortcutsSettings />
        </TabsContent>
      </Tabs>
    </>
  );
}
