import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { CreatorsPageClient } from "./creators-page-client";

export default async function CreatorsPage() {
  const supabase = await createServerSupabaseClient();

  // Auth check
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/ops/login");
  }

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/ops");
  }

  // Fetch creators
  const { data: allCreators } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .order("created_at", { ascending: false });

  const { data: activeCreators } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .eq("type", "active")
    .order("created_at", { ascending: false });

  const { data: verifiedCreators } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  const { data: pendingCreators } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .eq("type", "pending")
    .order("created_at", { ascending: false });

  // Stats
  const totalCreators = allCreators?.length || 0;
  const activeCount = activeCreators?.length || 0;
  const verifiedCount = verifiedCreators?.length || 0;
  const pendingCount = pendingCreators?.length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Yönetimi</h1>
          <p className="text-muted-foreground">İçerik üreticilerini yönetin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Creator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreators}</div>
            <p className="text-xs text-muted-foreground">Tüm creator hesapları</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Aktif creator'lar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doğrulanmış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Verified badge sahipleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pending durumunda</p>
          </CardContent>
        </Card>
      </div>

      <CreatorsPageClient
        allCreators={allCreators || []}
        activeCreators={activeCreators || []}
        verifiedCreators={verifiedCreators || []}
        pendingCreators={pendingCreators || []}
        stats={{ totalCreators, activeCount, verifiedCount, pendingCount }}
      />
    </>
  );
}
