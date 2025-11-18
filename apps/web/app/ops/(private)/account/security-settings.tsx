"use client";

import { useState } from "react";
import { IconDeviceMobile, IconKey, IconQrcode, IconShieldCheck } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SecuritySettings({ userId }: { userId: string }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label>İki Faktörlü Kimlik Doğrulama</Label>
              {twoFactorEnabled && (
                <Badge variant="default" className="bg-green-500">
                  <IconShieldCheck className="mr-1 h-3 w-3" />
                  Aktif
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Hesabınıza ekstra güvenlik katmanı ekleyin
            </p>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
        </div>

        {twoFactorEnabled && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <IconDeviceMobile className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Authenticator Uygulaması</p>
                  <p className="text-sm text-muted-foreground">
                    Google Authenticator veya benzeri bir uygulama kullanın
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Yapılandır
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <IconQrcode className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">QR Kod</p>
                  <p className="text-sm text-muted-foreground">
                    Authenticator uygulamanızla tarayın
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Göster
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <IconKey className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Yedek Kodlar</p>
                  <p className="text-sm text-muted-foreground">
                    Cihazınıza erişiminizi kaybederseniz kullanın
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Oluştur
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>E-posta Bildirimleri</Label>
          <p className="text-sm text-muted-foreground">
            Güvenlik olayları için e-posta bildirimleri alın
          </p>
        </div>
        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
      </div>

      {/* Login Alerts */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Giriş Uyarıları</Label>
          <p className="text-sm text-muted-foreground">
            Yeni bir cihazdan giriş yapıldığında bildirim alın
          </p>
        </div>
        <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
      </div>

      {/* Security Recommendations */}
      <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
        <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-400">Güvenlik Önerileri</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            <span>Güçlü ve benzersiz bir şifre kullanın</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            <span>İki faktörlü kimlik doğrulamayı etkinleştirin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            <span>Şifrenizi düzenli olarak değiştirin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            <span>Güvenilmeyen cihazlarda oturum açmayın</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
