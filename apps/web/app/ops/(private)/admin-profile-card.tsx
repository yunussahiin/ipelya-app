import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";

interface Profile {
  id?: string;
  user_id?: string;
  display_name?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface AdminMeta {
  id?: string;
  full_name?: string;
  is_active?: boolean;
  department?: string;
  role?: string;
  permissions?: string[];
  last_activity?: string;
  [key: string]: unknown;
}

export interface AdminProfileCardProps {
  user: User | null;
  profile: Profile | null;
  adminMeta: AdminMeta | null;
}

export function AdminProfileCard({ user, profile, adminMeta }: AdminProfileCardProps) {
  const isActive = profile?.role === "admin" && adminMeta?.is_active !== false;

  return (
    <div>
      <Card className="border-violet-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            Hoş Geldin, {profile?.display_name || adminMeta?.full_name || user?.email}! 👋
          </CardTitle>
          <CardDescription className="text-slate-400">
            İpelya Ops yönetici paneline giriş yaptın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Temel Bilgiler */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">User ID</p>
              <p className="font-mono text-sm text-white">{user?.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">E-posta</p>
              <p className="text-sm text-white">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">Ad Soyad</p>
              <p className="text-sm text-white">
                {profile?.display_name || adminMeta?.full_name || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">Durum</p>
              <p className="text-sm text-white">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                    Pasif
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">Kayıt Tarihi</p>
              <p className="text-sm text-white">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-400">Son Güncelleme</p>
              <p className="text-sm text-white">
                {profile?.updated_at
                  ? new Date(profile.updated_at).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "-"}
              </p>
            </div>
          </div>

          {/* Admin Ek Bilgileri */}
          {adminMeta && (
            <div className="mt-6 space-y-4 border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-300">Admin Bilgileri</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {adminMeta.department && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Departman</p>
                    <p className="text-sm text-white">{adminMeta.department}</p>
                  </div>
                )}
                {adminMeta.role && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Admin Rolü</p>
                    <Badge variant="outline" className="w-fit">
                      {adminMeta.role}
                    </Badge>
                  </div>
                )}
                {adminMeta.permissions && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">İzinler</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(adminMeta.permissions) ? (
                        adminMeta.permissions.map((perm: string) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">-</p>
                      )}
                    </div>
                  </div>
                )}
                {adminMeta.last_activity && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">Son Aktivite</p>
                    <p className="text-sm text-white">
                      {new Date(adminMeta.last_activity).toLocaleString("tr-TR")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session Bilgileri */}
          <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-300">Session Bilgileri</p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-mono text-slate-300">{user?.app_metadata?.provider}</span>
              </div>
              <div className="flex justify-between">
                <span>Email Verified:</span>
                <span className="font-mono text-slate-300">
                  {user?.email_confirmed_at ? "✓ Evet" : "✗ Hayır"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Son Giriş:</span>
                <span className="font-mono text-slate-300">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString("tr-TR")
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
