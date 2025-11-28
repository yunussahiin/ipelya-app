"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Table, Eye, Lock } from "lucide-react";

const DATABASE_TABLES = [
  {
    name: "profiles",
    description: "Kullanıcı profil bilgileri",
    columns: ["id", "username", "display_name", "avatar_url", "role", "created_at"],
    access: "read"
  },
  {
    name: "posts",
    description: "Kullanıcı paylaşımları",
    columns: ["id", "user_id", "content", "media_urls", "created_at", "is_archived"],
    access: "read"
  },
  {
    name: "messages",
    description: "Kullanıcı mesajları",
    columns: ["id", "sender_id", "receiver_id", "content", "created_at"],
    access: "read"
  },
  {
    name: "comments",
    description: "Post yorumları",
    columns: ["id", "post_id", "user_id", "content", "created_at"],
    access: "read"
  },
  {
    name: "likes",
    description: "Beğeniler",
    columns: ["id", "post_id", "user_id", "created_at"],
    access: "read"
  },
  {
    name: "follows",
    description: "Takip ilişkileri",
    columns: ["follower_id", "following_id", "created_at"],
    access: "read"
  }
];

export function DatabaseSection() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Veritabanı Erişimi
          </CardTitle>
          <CardDescription>
            AI tool&apos;larının erişebildiği veritabanı tabloları ve alanları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Sadece Okuma Erişimi</p>
              <p className="text-sm text-muted-foreground">
                AI tool&apos;ları veritabanında değişiklik yapamaz, sadece veri okuyabilir
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Erişilebilir Tablolar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DATABASE_TABLES.map((table) => (
              <div key={table.name} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{table.name}</span>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      {table.access}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{table.description}</p>
                <div className="flex flex-wrap gap-1">
                  {table.columns.map((col) => (
                    <Badge key={col} variant="secondary" className="text-xs font-mono">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 dark:text-orange-200">Güvenlik Notu</h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Hassas veriler (şifreler, tam email adresleri, telefon numaraları) AI tool&apos;ları
                tarafından maskelenerek gösterilir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
