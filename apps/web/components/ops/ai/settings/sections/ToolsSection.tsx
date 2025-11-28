"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Database, Users, FileText, BarChart3, Shield, Search } from "lucide-react";

const TOOLS = [
  {
    id: "lookupUser",
    name: "Kullanıcı Sorgula",
    description: "ID, email veya username ile kullanıcı bilgilerini getir",
    icon: Users,
    enabled: true
  },
  {
    id: "searchUsers",
    name: "Kullanıcı Ara",
    description: "Kullanıcıları isim, email veya role ile ara",
    icon: Search,
    enabled: true
  },
  {
    id: "getRecentPosts",
    name: "Son Postlar",
    description: "Son paylaşımları listele",
    icon: FileText,
    enabled: true
  },
  {
    id: "getSystemStats",
    name: "Sistem İstatistikleri",
    description: "Kullanıcı, post ve mesaj sayılarını getir",
    icon: BarChart3,
    enabled: true
  },
  {
    id: "getModerationQueue",
    name: "Moderasyon Kuyruğu",
    description: "Bekleyen moderasyon işlemlerini listele",
    icon: Shield,
    enabled: true
  },
  {
    id: "getPostDetails",
    name: "Post Detayları",
    description: "Belirli bir postun detaylarını getir",
    icon: Database,
    enabled: true
  }
];

export function ToolsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Veritabanı Tool&apos;ları</CardTitle>
          <CardDescription>
            AI asistanın veritabanından bilgi çekmek için kullanabileceği tool&apos;lar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tool.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {tool.id}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                  <Switch checked={tool.enabled} disabled />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Tool izinleri şu anda tüm admin kullanıcılar için aktiftir. Gelecekte rol bazlı izin
            sistemi eklenecektir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
