/**
 * Feed Moderation Sayfası
 *
 * Amaç: Feed içeriklerinin moderasyonunu yönetir
 *
 * Özellikler:
 * - Moderation queue listesi
 * - Pending/Approved/Rejected filtreleri
 * - Bulk actions
 * - İçerik detay görüntüleme
 *
 * Database:
 * - moderation_queue tablosu
 *
 * Edge Functions:
 * - moderate-content
 */

import { IconAlertTriangle, IconCheck, IconClock, IconX } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 30 saniyede bir revalidate
export const revalidate = 30;

export default async function ModerationPage() {
  const supabase = await createServerSupabaseClient();

  // Moderation queue istatistikleri
  const { count: pendingCount } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedCount } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: rejectedCount } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected");

  // Pending items
  const { data: pendingItems } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İçerik Moderasyonu</h1>
          <p className="text-muted-foreground">Feed içeriklerini inceleyin ve yönetin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">İnceleme bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onaylanan</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Onaylandı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
            <IconX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Reddedildi</p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>İnceleme bekleyen içerikler</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <IconClock className="h-4 w-4" />
                Bekleyen ({pendingCount || 0})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <IconCheck className="h-4 w-4" />
                Onaylanan
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <IconX className="h-4 w-4" />
                Reddedilen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingItems && pendingItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İçerik Türü</TableHead>
                      <TableHead>İçerik ID</TableHead>
                      <TableHead>Sebep</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Aksiyonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.content_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.content_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{item.reason || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600">
                              <IconCheck className="mr-1 h-4 w-4" />
                              Onayla
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <IconX className="mr-1 h-4 w-4" />
                              Reddet
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconAlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Bekleyen içerik yok</h3>
                  <p className="text-sm text-muted-foreground">Tüm içerikler incelendi</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconCheck className="mb-4 h-12 w-12 text-green-500" />
                <h3 className="text-lg font-medium">Onaylanan içerikler</h3>
                <p className="text-sm text-muted-foreground">
                  {approvedCount || 0} içerik onaylandı
                </p>
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconX className="mb-4 h-12 w-12 text-destructive" />
                <h3 className="text-lg font-medium">Reddedilen içerikler</h3>
                <p className="text-sm text-muted-foreground">
                  {rejectedCount || 0} içerik reddedildi
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
