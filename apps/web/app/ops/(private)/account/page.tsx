import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { AccountForm } from "./account-form";
import { PasswordForm } from "./password-form";
import { SecuritySettings } from "./security-settings";
import { SessionsTable } from "./sessions-table";
import { ThemeSwitcher } from "./theme-switcher";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const headersList = await headers();

  // Auth check
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/ops/login");
  }

  // Get admin profile
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Get user metadata
  const userInfo = {
    id: session.user.id,
    email: session.user.email || "",
    full_name: session.user.user_metadata?.full_name || "",
    avatar_url: session.user.user_metadata?.avatar_url || "",
    phone: session.user.user_metadata?.phone || "",
    created_at: session.user.created_at,
    last_sign_in_at: session.user.last_sign_in_at,
    role: adminProfile?.role || "admin",
    permissions: adminProfile?.permissions || []
  };

  // Get IP from headers
  const getClientIp = () => {
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "Bilinmiyor"
    );
  };

  const clientIp = getClientIp();

  // Get location from IP
  const getLocation = async (ip: string) => {
    if (ip === "Bilinmiyor" || ip === "127.0.0.1" || ip === "localhost")
      return { location: "Yerel", timezone: "", coordinates: "" };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        next: { revalidate: 3600 }
      });

      clearTimeout(timeoutId);

      if (!res.ok) return { location: "Bilinmiyor", timezone: "", coordinates: "" };
      const data = await res.json();
      const city = data.city || "";
      const country = data.country_name || "";
      const timezone = data.timezone || "";
      const latitude = data.latitude || "";
      const longitude = data.longitude || "";

      const location = `${city}${city && country ? ", " : ""}${country}`.trim() || "Bilinmiyor";
      const coordinates =
        latitude && longitude ? `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E` : "";

      return { location, timezone, coordinates };
    } catch (error) {
      console.error("Location fetch error:", error);
      return { location: "Bilinmiyor", timezone: "", coordinates: "" };
    }
  };

  const locationData = await getLocation(clientIp);

  // Get current session info
  const sessions = [
    {
      id: session.user.id,
      device: "Bu Cihaz",
      location: locationData.location,
      timezone: locationData.timezone,
      coordinates: locationData.coordinates,
      ip: clientIp,
      last_active: session.user.last_sign_in_at || new Date().toISOString(),
      is_current: true
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hesap Ayarları</h1>
          <p className="text-muted-foreground">
            Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin
          </p>
        </div>
        <ThemeSwitcher />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Temel hesap bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountForm user={userInfo} />
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>Hesabınızın güvenliği için güçlü bir şifre kullanın</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>
                İki faktörlü kimlik doğrulama ve güvenlik seçenekleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings userId={userInfo.id} />
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Aktif Oturumlar</CardTitle>
              <CardDescription>Hesabınıza bağlı cihazları ve oturumları yönetin</CardDescription>
            </CardHeader>
            <CardContent>
              <SessionsTable sessions={sessions} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Hesap Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Kullanıcı ID</p>
                <p className="font-mono text-sm">{userInfo.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="text-sm font-medium capitalize">{userInfo.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kayıt Tarihi</p>
                <p className="text-sm">
                  {new Date(userInfo.created_at).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Son Giriş</p>
                <p className="text-sm">
                  {userInfo.last_sign_in_at
                    ? new Date(userInfo.last_sign_in_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Yetkiler</CardTitle>
              <CardDescription>Hesabınızın yetkileri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userInfo.permissions.length > 0 ? (
                  userInfo.permissions.map((permission: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>{permission}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Tüm yetkilere sahipsiniz</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
              <CardDescription>Geri alınamaz işlemler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bu işlemler hesabınızı kalıcı olarak etkiler. Dikkatli olun.
              </p>
              <div className="space-y-2">
                <button className="w-full rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Tüm Oturumları Sonlandır
                </button>
                <button className="w-full rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Hesabı Devre Dışı Bırak
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
