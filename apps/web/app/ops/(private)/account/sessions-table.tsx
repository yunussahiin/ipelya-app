"use client";

import { useEffect, useState } from "react";
import { IconDeviceDesktop, IconDeviceMobile, IconMapPin, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface Session {
  id: string;
  device: string;
  location: string;
  timezone?: string;
  coordinates?: string;
  ip: string;
  last_active: string;
  is_current: boolean;
}

export function SessionsTable({ sessions }: { sessions: Session[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceType, setDeviceType] = useState("Bu Cihaz");

  // Get device type from user agent
  useEffect(() => {
    const ua = navigator.userAgent;
    let device = "Desktop";

    if (/mobile|android|iphone|ipod|phone/i.test(ua)) {
      device = "Mobile";
    } else if (/tablet|ipad|kindle/i.test(ua)) {
      device = "Tablet";
    } else if (/windows|win32/i.test(ua)) {
      device = "Windows";
    } else if (/macintosh|mac os x/i.test(ua)) {
      device = "macOS";
    } else if (/linux/i.test(ua)) {
      device = "Linux";
    }

    setDeviceType(device);
  }, []);

  const getDeviceIcon = (device: string) => {
    if (
      device.toLowerCase().includes("mobile") ||
      device.toLowerCase().includes("iphone") ||
      device.toLowerCase().includes("android")
    ) {
      return <IconDeviceMobile className="h-5 w-5" />;
    }
    return <IconDeviceDesktop className="h-5 w-5" />;
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Şimdi";
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return `${Math.floor(diffInMinutes / 1440)} gün önce`;
  };

  const handleLogoutSession = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("✕ Oturum sonlandırılamadı");
        return;
      }

      toast.success("✓ Oturum sonlandırıldı!");
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      toast.error("Bir hata oluştu");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cihaz</TableHead>
            <TableHead>Konum</TableHead>
            <TableHead>IP Adresi</TableHead>
            <TableHead>Son Aktivite</TableHead>
            <TableHead className="text-right">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {getDeviceIcon(deviceType)}
                  <div>
                    <p className="font-medium">{deviceType}</p>
                    {session.is_current && (
                      <Badge variant="default" className="mt-1 bg-green-500">
                        Aktif Oturum
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">{session.location}</p>
                    {session.timezone && (
                      <p className="text-xs text-muted-foreground">{session.timezone}</p>
                    )}
                    {session.coordinates && (
                      <p className="text-xs text-muted-foreground">{session.coordinates}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{session.ip}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatLastActive(session.last_active)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {session.is_current ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogoutSession()}
                    disabled={isLoading}
                  >
                    <IconTrash className="h-4 w-4 text-destructive" />
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {sessions.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">Aktif oturum bulunamadı</div>
      )}
    </div>
  );
}
