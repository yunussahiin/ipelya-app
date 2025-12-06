"use client";

/**
 * Session Detail Page
 * Oturum detayı ve canlı izleme sayfası - 3 Kolonlu Layout
 * Sol: iPhone Mockup (Video)
 * Orta: Mesajlar
 * Sağ: Katılımcılar
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
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
  RefreshCw,
  UserX,
  Ban,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

import { MobilePreview } from "@/components/ops/live/mobile-preview";
import { AudioRoomPreview } from "@/components/ops/live/audio-room-preview";
import { ParticipantsList } from "@/components/ops/live/participants-list";
import { ModerationActions } from "@/components/ops/live/moderation-actions";

import type { LiveSession, LiveParticipant } from "@/lib/types/live";

interface LiveMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    id: string;
    user_id?: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

type MessageActionType = "kick" | "ban" | "delete" | null;

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
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Telefon zoom state
  const [phoneZoom, setPhoneZoom] = useState<"1x" | "2x" | "3x" | "4x">("1x");

  // Mesaj aksiyonları için state
  const [selectedMessage, setSelectedMessage] = useState<LiveMessage | null>(null);
  const [messageAction, setMessageAction] = useState<MessageActionType>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Supabase client ve scroll ref
  const supabase = createBrowserSupabaseClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mesaj listesini en alta kaydır
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, participantsRes, messagesRes] = await Promise.all([
        fetch(`/api/ops/live/sessions/${sessionId}`),
        fetch(`/api/ops/live/sessions/${sessionId}/participants?active=false`),
        fetch(`/api/ops/live/sessions/${sessionId}/messages?limit=50`)
      ]);

      if (!sessionRes.ok) throw new Error("Oturum bulunamadı");

      const sessionData = await sessionRes.json();
      setSession(sessionData);

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants || []);
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        // Mesajları kronolojik sıraya çevir (eski -> yeni)
        const sortedMessages = (messagesData.messages || []).sort(
          (a: LiveMessage, b: LiveMessage) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
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

    // 5 saniyede bir yenile (mesajlar için hızlı polling)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime mesaj subscription - yeni mesaj geldiğinde refetch yap
  useEffect(() => {
    console.log("[Realtime] Setting up subscription for session:", sessionId);

    const channel = supabase
      .channel(`live_messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages"
        },
        () => {
          // Yeni mesaj geldiğinde mesajları yeniden yükle
          console.log("[Realtime] New message detected, refetching...");
          fetchData();
          setTimeout(scrollToBottom, 200);
        }
      )
      .subscribe((status: string) => {
        console.log("[Realtime] Subscription status:", status);
      });

    return () => {
      console.log("[Realtime] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, fetchData, scrollToBottom]);

  // Mesajlar yüklendiğinde en alta kaydır
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [loading, messages.length, scrollToBottom]);

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

  // Mesaj üzerinden kullanıcıya aksiyon al
  const handleMessageAction = async () => {
    if (!selectedMessage || !messageAction) return;

    setActionLoading(true);
    try {
      if (messageAction === "delete") {
        // Mesajı sil
        const response = await fetch(`/api/ops/live/messages/${selectedMessage.id}/delete`, {
          method: "POST"
        });
        if (!response.ok) throw new Error("Mesaj silinemedi");
        toast.success("Mesaj silindi");
      } else {
        // Kullanıcıyı kick veya ban
        const endpoint =
          messageAction === "kick"
            ? `/api/ops/live/users/${selectedMessage.sender_id}/kick`
            : `/api/ops/live/users/${selectedMessage.sender_id}/ban`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            reason: `Admin tarafından ${messageAction === "kick" ? "çıkarıldı" : "yasaklandı"}`
          })
        });
        if (!response.ok) throw new Error("İşlem başarısız");
        toast.success(messageAction === "kick" ? "Kullanıcı çıkarıldı" : "Kullanıcı yasaklandı");
      }
      handleRefresh();
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setActionLoading(false);
      setSelectedMessage(null);
      setMessageAction(null);
    }
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

  const activeParticipants = participants.filter((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold truncate">{session.title || "Başlıksız Yayın"}</h1>
              {session.status === "live" && (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shrink-0">
                  <span className="animate-pulse mr-1">●</span> CANLI
                </Badge>
              )}
              {session.status === "ended" && (
                <Badge variant="secondary" className="shrink-0">
                  Sona Erdi
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={session.creator?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {session.creator?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">@{session.creator?.username}</span>
              <span className="text-muted-foreground/50">•</span>
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
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div
            className={`p-2 rounded-lg ${session.session_type === "video_live" ? "bg-red-500/10" : "bg-purple-500/10"}`}
          >
            {session.session_type === "video_live" ? (
              <Video className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-purple-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tür</p>
            <p className="font-semibold text-sm">
              {session.session_type === "video_live" ? "Video" : "Sesli"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Eye className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">İzleyici</p>
            <p className="font-bold">{session.current_viewers}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Süre</p>
            <p className="font-bold font-mono text-sm">
              {formatDuration(session.duration_seconds)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <MessageCircle className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mesaj</p>
            <p className="font-bold">{session.message_count}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Gift className="h-4 w-4 text-pink-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hediye</p>
            <p className="font-bold">{session.gift_count}</p>
          </div>
        </div>
      </div>

      {/* 3 Kolonlu Layout: Mesajlar | iPhone | Katılımcılar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol: Mesajlar */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  Mesajlar
                </CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {messages.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">Henüz mesaj yok</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex gap-3 group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-linear-to-br from-blue-500 to-purple-600 text-white">
                            {msg.sender?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">@{msg.sender?.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), "HH:mm", { locale: tr })}
                            </span>
                          </div>
                          <p className="text-sm break-words mt-0.5">{msg.content}</p>
                        </div>
                        {/* Mesaj Aksiyonları - Yan yana butonlar */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    setMessageAction("delete");
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Mesajı Sil
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-orange-500"
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    setMessageAction("kick");
                                  }}
                                >
                                  <UserX className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Kullanıcıyı Çıkar
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setSelectedMessage(msg);
                                    setMessageAction("ban");
                                  }}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Kullanıcıyı Yasakla
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Scroll anchor - mesaj listesinin en altı */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Orta: iPhone Mockup */}
        <div className="lg:col-span-4 flex flex-col items-center justify-start order-1 lg:order-2">
          {/* Zoom Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <ToggleGroup
              type="single"
              value={phoneZoom}
              onValueChange={(value) => value && setPhoneZoom(value as "1x" | "2x" | "3x")}
              className="bg-muted rounded-lg p-1"
            >
              <ToggleGroupItem value="1x" className="text-xs px-3 data-[state=on]:bg-background">
                1x
              </ToggleGroupItem>
              <ToggleGroupItem value="2x" className="text-xs px-3 data-[state=on]:bg-background">
                2x
              </ToggleGroupItem>
              <ToggleGroupItem value="3x" className="text-xs px-3 data-[state=on]:bg-background">
                3x
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Phone Preview */}
          <div
            className={`transition-transform duration-300 origin-top ${
              phoneZoom === "2x" ? "scale-125" : phoneZoom === "3x" ? "scale-150" : ""
            }`}
          >
            {session.status === "live" ? (
              session.session_type === "video_live" ? (
                <MobilePreview
                  sessionId={session.id}
                  roomName={session.livekit_room_name}
                  creator={
                    session.creator
                      ? {
                          username: session.creator.username,
                          display_name: session.creator.display_name,
                          avatar_url: session.creator.avatar_url
                        }
                      : undefined
                  }
                />
              ) : (
                <AudioRoomPreview
                  sessionId={session.id}
                  roomName={session.livekit_room_name}
                  sessionTitle={session.title || "Sesli Oda"}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  {session.session_type === "video_live" ? (
                    <Video className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  ) : (
                    <Mic className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  )}
                  <p className="text-lg font-medium">Yayın sona erdi</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {session.ended_at &&
                      format(new Date(session.ended_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Katılımcılar */}
        <div className="lg:col-span-4 order-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Katılımcılar
                </CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {activeParticipants.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <ParticipantsList
                    participants={participants}
                    sessionId={session.id}
                    onRefresh={handleRefresh}
                    compact
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mesaj Aksiyon Onay Dialog */}
      <AlertDialog
        open={!!selectedMessage && !!messageAction}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {messageAction === "delete" && "Mesajı Sil"}
              {messageAction === "kick" && "Kullanıcıyı Çıkar"}
              {messageAction === "ban" && "Kullanıcıyı Yasakla"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {messageAction === "delete" && "Bu mesajı silmek istediğinize emin misiniz?"}
              {messageAction === "kick" &&
                `@${selectedMessage?.sender?.username} kullanıcısını bu oturumdan çıkarmak istediğinize emin misiniz?`}
              {messageAction === "ban" &&
                `@${selectedMessage?.sender?.username} kullanıcısını yasaklamak istediğinize emin misiniz? Kullanıcı bu oturuma bir daha katılamaz.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMessageAction}
              disabled={actionLoading}
              className={
                messageAction === "ban"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {actionLoading
                ? "İşleniyor..."
                : messageAction === "delete"
                  ? "Sil"
                  : messageAction === "kick"
                    ? "Çıkar"
                    : "Yasakla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
