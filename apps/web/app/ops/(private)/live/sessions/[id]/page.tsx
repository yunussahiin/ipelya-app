"use client";

/**
 * Session Detail Page
 * Oturum detayı ve canlı izleme sayfası
 * Referans: WEB_ADMIN_DASHBOARD.md → Session Detail
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Gift,
  Clock,
  Eye,
  Video,
  Mic,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { SessionPreview } from "@/components/ops/live/session-preview";
import { AudioRoomPreview } from "@/components/ops/live/audio-room-preview";
import { ParticipantsList } from "@/components/ops/live/participants-list";
import { ModerationActions } from "@/components/ops/live/moderation-actions";

import type { LiveSession, LiveParticipant } from "@/lib/types/live";

interface SessionWithDetails extends LiveSession {
  current_viewers: number;
  total_joins: number;
  message_count: number;
  gift_count: number;
  duration_seconds: number;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const showPreview = searchParams.get("preview") === "true";

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(showPreview ? "preview" : "details");

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, participantsRes] = await Promise.all([
        fetch(`/api/ops/live/sessions/${sessionId}`),
        fetch(`/api/ops/live/sessions/${sessionId}/participants?active=false`)
      ]);

      if (!sessionRes.ok) throw new Error("Oturum bulunamadı");

      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();

    // 15 saniyede bir yenile
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Oturum bulunamadı</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{session.title || "Başlıksız Yayın"}</h1>
              {session.status === "live" && (
                <Badge variant="outline" className="text-red-500 border-red-500">
                  🔴 CANLI
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarImage src={session.creator?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {session.creator?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span>@{session.creator?.username}</span>
              <span>•</span>
              <span>
                {session.started_at
                  ? formatDistanceToNow(new Date(session.started_at), {
                      locale: tr,
                      addSuffix: true
                    })
                  : "Başlangıç yok"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          {session.status === "live" && (
            <ModerationActions
              sessionId={session.id}
              sessionTitle={session.title || "Bu yayın"}
              onRefresh={() => router.push("/ops/live")}
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tür</CardTitle>
            {session.session_type === "video_live" ? (
              <Video className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-purple-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {session.session_type === "video_live" ? "Video Yayını" : "Sesli Oda"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif İzleyici
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.current_viewers}</div>
            <p className="text-xs text-muted-foreground">Toplam: {session.total_joins}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Süre</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatDuration(session.duration_seconds)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mesajlar</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.message_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hediyeler</CardTitle>
            <Gift className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.gift_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Detaylar</TabsTrigger>
          {session.status === "live" && <TabsTrigger value="preview">Canlı İzle</TabsTrigger>}
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Katılımcılar
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {participants.filter((p) => p.is_active).length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oturum Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Erişim Türü</p>
                  <Badge>
                    {session.access_type === "public" && "Herkese Açık"}
                    {session.access_type === "subscribers_only" && "Abonelere Özel"}
                    {session.access_type === "pay_per_view" &&
                      `PPV: ${session.ppv_coin_price} Coin`}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chat</p>
                  <Badge variant={session.chat_enabled ? "default" : "secondary"}>
                    {session.chat_enabled ? "Açık" : "Kapalı"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hediyeler</p>
                  <Badge variant={session.gifts_enabled ? "default" : "secondary"}>
                    {session.gifts_enabled ? "Açık" : "Kapalı"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Yüksek İzleyici</p>
                  <p className="font-medium">{session.peak_viewers}</p>
                </div>
              </div>
              {session.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Açıklama</p>
                  <p>{session.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">LiveKit Room</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {session.livekit_room_name}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {session.status === "live" && (
          <TabsContent value="preview">
            {session.session_type === "video_live" ? (
              <SessionPreview
                sessionId={session.id}
                roomName={session.livekit_room_name}
                sessionTitle={session.title || "Canlı Yayın"}
              />
            ) : (
              <AudioRoomPreview
                sessionId={session.id}
                roomName={session.livekit_room_name}
                sessionTitle={session.title || "Sesli Oda"}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="participants">
          <ParticipantsList
            participants={participants}
            sessionId={session.id}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
