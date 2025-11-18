import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { BannedUsersTableClient } from "./banned-users-table-client";

export default async function BannedUsersPage() {
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

  // Fetch banned users
  const { data: allBanned } = await supabase
    .from("profiles")
    .select("*")
    .eq("type", "banned")
    .order("updated_at", { ascending: false });

  const { data: permanentBanned } = await supabase
    .from("profiles")
    .select("*")
    .eq("type", "banned")
    .is("ban_expires_at", null)
    .order("updated_at", { ascending: false });

  const { data: temporaryBanned } = await supabase
    .from("profiles")
    .select("*")
    .eq("type", "banned")
    .not("ban_expires_at", "is", null)
    .order("updated_at", { ascending: false });

  // Stats
  const totalBanned = allBanned?.length || 0;
  const permanentCount = permanentBanned?.length || 0;
  const temporaryCount = temporaryBanned?.length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yasaklı Kullanıcılar</h1>
          <p className="text-muted-foreground">Yasaklanmış hesapları yönetin</p>
        </div>
        <Button variant="destructive">Toplu İşlem</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yasaklı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBanned}</div>
            <p className="text-xs text-muted-foreground">Tüm yasaklı hesaplar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kalıcı Yasak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{permanentCount}</div>
            <p className="text-xs text-muted-foreground">Süresiz yasaklı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geçici Yasak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{temporaryCount}</div>
            <p className="text-xs text-muted-foreground">Süreli yasaklı</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tümü{" "}
            <Badge className="ml-2" variant="secondary">
              {totalBanned}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="permanent">
            Kalıcı{" "}
            <Badge className="ml-2" variant="secondary">
              {permanentCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="temporary">
            Geçici{" "}
            <Badge className="ml-2" variant="secondary">
              {temporaryCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Banned */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Yasaklı Kullanıcılar</CardTitle>
              <CardDescription>Sistemden yasaklanmış tüm hesaplar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Input placeholder="Kullanıcı ara..." className="max-w-sm" />
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Yasak Süresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="permanent">Kalıcı</SelectItem>
                    <SelectItem value="temporary">Geçici</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Yasak Nedeni" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="harassment">Taciz</SelectItem>
                    <SelectItem value="copyright">Telif İhlali</SelectItem>
                    <SelectItem value="fraud">Dolandırıcılık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <BannedUsersTableClient data={allBanned || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permanent Banned */}
        <TabsContent value="permanent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kalıcı Yasaklı Kullanıcılar</CardTitle>
              <CardDescription>Süresiz yasaklanmış hesaplar</CardDescription>
            </CardHeader>
            <CardContent>
              <BannedUsersTableClient data={permanentBanned || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporary Banned */}
        <TabsContent value="temporary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geçici Yasaklı Kullanıcılar</CardTitle>
              <CardDescription>Belirli süre için yasaklanmış hesaplar</CardDescription>
            </CardHeader>
            <CardContent>
              <BannedUsersTableClient data={temporaryBanned || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
