import {
  IconFilter,
  IconRefresh,
  IconSearch,
  IconLogin,
  IconLogout,
  IconUserPlus,
  IconAlertTriangle,
  IconShield,
  IconCrown,
  IconUsers
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AuthLogsTable } from "./auth-logs-table";

interface AuthLogsPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    search?: string;
    period?: string;
    userType?: string;
  }>;
}

export default async function AuthLogsPage({ searchParams }: AuthLogsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const action = params.action || "all";
  const search = params.search || "";
  const period = params.period || "24h";
  const userType = params.userType || "all";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auth Logları</h1>
          <p className="text-muted-foreground">Kullanıcı kimlik doğrulama ve güvenlik olayları</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/ops/auth-logs">
            <IconRefresh className="mr-2 h-4 w-4" />
            Yenile
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards period={period} />
      </Suspense>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <IconFilter className="mr-2 inline h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                name="search"
                placeholder="Email veya kullanıcı adı ara..."
                defaultValue={search}
              />
            </div>
            <Select name="action" defaultValue={action}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="İşlem Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                {/* Auth işlemleri */}
                <SelectItem value="login">Giriş</SelectItem>
                <SelectItem value="logout">Çıkış</SelectItem>
                <SelectItem value="user_signedup">Yeni Kayıt</SelectItem>
                <SelectItem value="user_deleted">Hesap Silme</SelectItem>
                <SelectItem value="user_modified">Profil Güncelleme</SelectItem>
                {/* Şifre işlemleri */}
                <SelectItem value="user_recovery_requested">Şifre Sıfırlama</SelectItem>
                <SelectItem value="user_updated_password">Şifre Değişikliği</SelectItem>
                {/* Token işlemleri */}
                <SelectItem value="token_refreshed">Token Yenileme</SelectItem>
                <SelectItem value="token_revoked">Token İptal</SelectItem>
                {/* Davet işlemleri */}
                <SelectItem value="user_invited">Davet Gönderimi</SelectItem>
                <SelectItem value="invite_accepted">Davet Kabul</SelectItem>
                {/* Şüpheli işlemler */}
                <SelectItem value="user_repeated_signup">Tekrarlı Kayıt</SelectItem>
              </SelectContent>
            </Select>
            <Select name="period" defaultValue={period}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Dönem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Son 1 Saat</SelectItem>
                <SelectItem value="24h">Son 24 Saat</SelectItem>
                <SelectItem value="7d">Son 7 Gün</SelectItem>
                <SelectItem value="30d">Son 30 Gün</SelectItem>
              </SelectContent>
            </Select>
            <Select name="userType" defaultValue={userType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Kullanıcı Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">
              <IconSearch className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Suspense fallback={<TableSkeleton />}>
        <AuthLogsTable
          page={page}
          action={action}
          search={search}
          period={period}
          userType={userType}
        />
      </Suspense>
    </>
  );
}

async function StatsCards({ period }: { period: string }) {
  const supabase = createAdminSupabaseClient();

  // Calculate period date
  const getPeriodDate = (): Date => {
    const now = new Date();
    switch (period) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const periodDate = getPeriodDate();

  // Get stats using raw SQL since auth schema
  const { data: stats } = await supabase.rpc("get_auth_log_stats", {
    period_start: periodDate.toISOString()
  });

  const loginCount = stats?.login_count || 0;
  const logoutCount = stats?.logout_count || 0;
  const signupCount = stats?.signup_count || 0;
  const failedCount = stats?.failed_count || 0;
  const uniqueUsers = stats?.unique_users || 0;
  const adminLogins = stats?.admin_logins || 0;
  const creatorLogins = stats?.creator_logins || 0;

  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Başarılı Giriş</CardTitle>
          <IconLogin className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loginCount}</div>
          <p className="text-xs text-muted-foreground">
            {period === "1h"
              ? "Son 1 saat"
              : period === "24h"
                ? "Son 24 saat"
                : period === "7d"
                  ? "Son 7 gün"
                  : "Son 30 gün"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Çıkış</CardTitle>
          <IconLogout className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{logoutCount}</div>
          <p className="text-xs text-muted-foreground">Oturum sonlandırma</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yeni Kayıt</CardTitle>
          <IconUserPlus className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{signupCount}</div>
          <p className="text-xs text-muted-foreground">Yeni kullanıcı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{failedCount}</div>
          <p className="text-xs text-muted-foreground">Başarısız deneme</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Benzersiz</CardTitle>
          <IconUsers className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueUsers}</div>
          <p className="text-xs text-muted-foreground">Farklı kullanıcı</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admin</CardTitle>
          <IconShield className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{adminLogins}</div>
          <p className="text-xs text-muted-foreground">Admin girişi</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Creator</CardTitle>
          <IconCrown className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{creatorLogins}</div>
          <p className="text-xs text-muted-foreground">Creator girişi</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
