import {
  IconAlertTriangle,
  IconBan,
  IconCamera,
  IconDeviceMobile,
  IconFingerprint,
  IconLock,
  IconShield,
  IconUserOff
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SecurityPage() {
  const supabase = await createServerSupabaseClient();

  // İstatistikler
  const { count: totalLogs } = await supabase
    .from("screenshot_logs")
    .select("*", { count: "exact", head: true });

  const { count: blockedAttempts } = await supabase
    .from("screenshot_logs")
    .select("*", { count: "exact", head: true })
    .eq("action_taken", "blocked");

  const { count: bannedUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("type", "banned");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Güvenlik</h1>
          <p className="text-muted-foreground">Sistem güvenliği ve screenshot koruması</p>
        </div>
        <Button>
          <IconShield className="mr-2 h-4 w-4" />
          Güvenlik Raporu
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Log</CardTitle>
            <IconFingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">Güvenlik olayları</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engellenen</CardTitle>
            <IconCamera className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">Screenshot engellendi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yasaklı Kullanıcı</CardTitle>
            <IconBan className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Aktif yasak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Seviyesi</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Düşük</div>
            <p className="text-xs text-muted-foreground">Sistem durumu</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="screenshots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="screenshots">Screenshot Logları</TabsTrigger>
          <TabsTrigger value="firewall">Firewall</TabsTrigger>
          <TabsTrigger value="bans">Yasaklar</TabsTrigger>
          <TabsTrigger value="devices">Cihazlar</TabsTrigger>
        </TabsList>

        {/* Screenshot Logs */}
        <TabsContent value="screenshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Screenshot Koruması Logları</CardTitle>
              <CardDescription>Tüm screenshot denemeleri ve engellenen içerikler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Input placeholder="Kullanıcı ara..." className="max-w-sm" />
                <Button variant="outline">Filtrele</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>İçerik</TableHead>
                    <TableHead>Cihaz</TableHead>
                    <TableHead>Aksiyon</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ScreenshotLogsTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firewall */}
        <TabsContent value="firewall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firewall Kuralları</CardTitle>
              <CardDescription>IP engelleme ve güvenlik kuralları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <IconLock className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">VPN Engelleme</p>
                      <p className="text-sm text-muted-foreground">
                        VPN kullanımını tespit et ve engelle
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Aktif
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <IconShield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">DDoS Koruması</p>
                      <p className="text-sm text-muted-foreground">Otomatik rate limiting</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Aktif
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <IconCamera className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Screenshot Koruması</p>
                      <p className="text-sm text-muted-foreground">
                        Mobil ve web screenshot engelleme
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Aktif
                  </Badge>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <IconDeviceMobile className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Cihaz Doğrulama</p>
                      <p className="text-sm text-muted-foreground">Güvenilir cihaz kontrolü</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pasif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bans */}
        <TabsContent value="bans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yasaklı Kullanıcılar</CardTitle>
              <CardDescription>Güvenlik ihlali nedeniyle yasaklanan hesaplar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Sebep</TableHead>
                    <TableHead>Yasak Tarihi</TableHead>
                    <TableHead>Süre</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <BannedUsersTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Şüpheli Cihazlar</CardTitle>
              <CardDescription>Güvenlik riski taşıyan cihazlar</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cihaz ID</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Cihaz Tipi</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Son Aktivite</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SuspiciousDevicesTable />
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ScreenshotLogsTable() {
  // Mock data
  const logs = [
    {
      id: "1",
      user: "user123",
      content: "Premium Video #1234",
      device: "iPhone 15 Pro",
      action: "blocked",
      date: "2025-01-15 14:30"
    },
    {
      id: "2",
      user: "creator456",
      content: "Private Photo #5678",
      device: "Samsung Galaxy S24",
      action: "blocked",
      date: "2025-01-15 13:15"
    }
  ];

  return (
    <>
      {logs.map((log) => (
        <TableRow key={log.id}>
          <TableCell className="font-medium">@{log.user}</TableCell>
          <TableCell>{log.content}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{log.device}</TableCell>
          <TableCell>
            <Badge variant="destructive">Engellendi</Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{log.date}</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <IconUserOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kullanıcıyı Yasakla</TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function BannedUsersTable() {
  // Mock data
  const banned = [
    {
      id: "1",
      user: "baduser123",
      reason: "Screenshot ihlali (3x)",
      banDate: "2025-01-10",
      duration: "Kalıcı"
    }
  ];

  return (
    <>
      {banned.map((ban) => (
        <TableRow key={ban.id}>
          <TableCell className="font-medium">@{ban.user}</TableCell>
          <TableCell>{ban.reason}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{ban.banDate}</TableCell>
          <TableCell>
            <Badge variant="destructive">{ban.duration}</Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button variant="outline" size="sm">
              Yasağı Kaldır
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function SuspiciousDevicesTable() {
  // Mock data
  const devices = [
    {
      id: "1",
      deviceId: "abc123xyz",
      user: "user789",
      type: "Android Emulator",
      risk: "high",
      lastActivity: "2025-01-15 12:00"
    }
  ];

  return (
    <>
      {devices.map((device) => (
        <TableRow key={device.id}>
          <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
          <TableCell>@{device.user}</TableCell>
          <TableCell>{device.type}</TableCell>
          <TableCell>
            <Badge variant="destructive">Yüksek</Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{device.lastActivity}</TableCell>
          <TableCell className="text-right">
            <Button variant="destructive" size="sm">
              Engelle
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
