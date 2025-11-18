import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import data from "../data.json";

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // Kullanıcı profil bilgilerini çek (role-based)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session?.user.id)
    .single();

  // Admin metadata'sını çek (opsiyonel)
  const { data: adminMeta } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", session?.user.id)
    .single();

  return (
    <>
      {/* Kullanıcı Bilgileri Kartı */}
      <div>
        <Card className="border-violet-500/20 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              Hoş Geldin, {profile?.display_name || adminMeta?.full_name || session?.user.email}! 👋
            </CardTitle>
            <CardDescription className="text-slate-400">
              İpelya Ops yönetici paneline giriş yaptın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">User ID</p>
                <p className="font-mono text-sm text-white">{session?.user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-400">E-posta</p>
                <p className="text-sm text-white">{session?.user.email}</p>
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
                  {profile?.role === "admin" && adminMeta?.is_active !== false ? (
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

            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">Session Bilgileri</p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-mono text-slate-300">
                    {session?.user.app_metadata.provider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Email Verified:</span>
                  <span className="font-mono text-slate-300">
                    {session?.user.email_confirmed_at ? "✓ Evet" : "✗ Hayır"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Son Giriş:</span>
                  <span className="font-mono text-slate-300">
                    {session?.user.last_sign_in_at
                      ? new Date(session.user.last_sign_in_at).toLocaleString("tr-TR")
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionCards />
      <div>
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
