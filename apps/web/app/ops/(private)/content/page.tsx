import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconEye,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconX
} from "@tabler/icons-react";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ContentPage() {
  const supabase = await createServerSupabaseClient();

  // İstatistikler
  const { count: totalContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true });

  const { count: pendingContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true })
    .eq("moderation_status", "pending");

  const { count: approvedContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true })
    .eq("moderation_status", "approved");

  const { count: rejectedContent } = await supabase
    .from("content")
    .select("*", { count: "exact", head: true })
    .eq("moderation_status", "rejected");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İçerik Moderasyonu</h1>
          <p className="text-muted-foreground">Kullanıcı içeriklerini inceleyin ve yönetin</p>
        </div>
        <Button>
          <IconFileText className="mr-2 h-4 w-4" />
          Rapor Oluştur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İçerik</CardTitle>
            <IconFileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent || 0}</div>
            <p className="text-xs text-muted-foreground">Tüm içerikler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingContent || 0}</div>
            <p className="text-xs text-muted-foreground">Moderasyon bekliyor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onaylanan</CardTitle>
            <IconCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedContent || 0}</div>
            <p className="text-xs text-muted-foreground">Yayında</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
            <IconX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedContent || 0}</div>
            <p className="text-xs text-muted-foreground">Kural ihlali</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
          <CardDescription>İçerikleri filtreleyin ve arayın</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input placeholder="İçerik ara..." className="max-w-sm" />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="İçerik Tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="photo">Fotoğraf</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Ses</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="pending">Bekleyen</SelectItem>
                <SelectItem value="approved">Onaylanan</SelectItem>
                <SelectItem value="rejected">Reddedilen</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Filtreleri Temizle</Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Bekleyen ({pendingContent || 0})</TabsTrigger>
          <TabsTrigger value="approved">Onaylanan ({approvedContent || 0})</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen ({rejectedContent || 0})</TabsTrigger>
          <TabsTrigger value="all">Tümü ({totalContent || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <ContentGrid status="pending" />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ContentGrid status="approved" />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <ContentGrid status="rejected" />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <ContentGrid status="all" />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ContentGrid({ status }: { status: string }) {
  // Mock data - gerçek data Supabase'den gelecek
  const mockContent = [
    {
      id: "1",
      type: "photo",
      thumbnail: "https://picsum.photos/400/300?random=1",
      creator: "user123",
      uploadDate: "2025-01-15",
      views: 1234,
      reports: 0
    },
    {
      id: "2",
      type: "video",
      thumbnail: "https://picsum.photos/400/300?random=2",
      creator: "creator456",
      uploadDate: "2025-01-14",
      views: 5678,
      reports: 2
    },
    {
      id: "3",
      type: "photo",
      thumbnail: "https://picsum.photos/400/300?random=3",
      creator: "user789",
      uploadDate: "2025-01-13",
      views: 910,
      reports: 0
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {mockContent.map((content) => (
        <Card key={content.id} className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <img src={content.thumbnail} alt="Content" className="h-full w-full object-cover" />
            <div className="absolute right-2 top-2">
              {content.type === "photo" ? (
                <Badge variant="secondary">
                  <IconPhoto className="mr-1 h-3 w-3" />
                  Fotoğraf
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <IconVideo className="mr-1 h-3 w-3" />
                  Video
                </Badge>
              )}
            </div>
            {content.reports > 0 && (
              <div className="absolute left-2 top-2">
                <Badge variant="destructive">
                  <IconAlertTriangle className="mr-1 h-3 w-3" />
                  {content.reports} Şikayet
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">@{content.creator}</p>
                <p className="text-xs text-muted-foreground">{content.uploadDate}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconEye className="h-3 w-3" />
                {content.views}
              </div>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <IconEye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>İncele</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <IconCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Onayla</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex-1">
                    <IconX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reddet</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
