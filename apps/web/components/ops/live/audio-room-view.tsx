"use client";

/**
 * AudioRoomView Component
 * Sesli oda için Clubhouse/Twitter Spaces tarzı görünüm
 * Speakers (sunucular) ve Listeners (dinleyiciler) ayrı gösterilir
 * Yönetim butonları ile kick/ban işlemleri
 */

import { useState, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

import {
  Loader2,
  Volume2,
  VolumeX,
  Users,
  Mic,
  MicOff,
  AlertCircle,
  Radio,
  UserX,
  Ban,
  Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
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
import { toast } from "sonner";

import { VolumeControl } from "./volume-control";

interface AudioRoomViewProps {
  sessionId: string;
  roomName: string;
  sessionTitle: string;
}

export function AudioRoomView({ sessionId, roomName, sessionTitle }: AudioRoomViewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/ops/live/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, sessionId })
        });

        if (!response.ok) {
          throw new Error("Token alınamadı");
        }

        const data = await response.json();
        setToken(data.token);
        setWsUrl(data.wsUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bağlantı hatası");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomName, sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl border bg-linear-to-br from-purple-950/50 to-slate-900/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          <p className="text-muted-foreground">Odaya bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Bağlantı Hatası</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!token || !wsUrl) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Token Hatası</AlertTitle>
        <AlertDescription>Oda izleme token&apos;ı alınamadı.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="h-[600px] rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-500/20 dark:bg-purple-500/10">
            <Radio className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{sessionTitle}</h3>
            <p className="text-xs text-muted-foreground">Sesli Oda</p>
          </div>
        </div>
        <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30">
          <span className="animate-pulse mr-1.5">●</span> Canlı
        </Badge>
      </div>

      {/* Content */}
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        audio={false}
        video={false}
        onError={(err) => setError(err.message)}
        className="flex-1 overflow-hidden"
      >
        <AudioRoomContent
          sessionId={sessionId}
          isMuted={isMuted}
          volume={volume}
          onMuteChange={setIsMuted}
          onVolumeChange={setVolume}
        />
        {!isMuted && <RoomAudioRenderer volume={volume} />}
      </LiveKitRoom>
    </div>
  );
}

interface AudioRoomContentProps {
  sessionId: string;
  isMuted: boolean;
  volume: number;
  onMuteChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

type ActionType = "kick" | "ban" | "mute" | "unmute" | null;

interface ParticipantInfo {
  identity: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  isHost: boolean;
}

function AudioRoomContent({
  sessionId,
  isMuted,
  volume,
  onMuteChange,
  onVolumeChange
}: AudioRoomContentProps) {
  const participants = useParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);

  // Yönetim state
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantInfo | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Participant bilgilerini parse et
  const getParticipantInfo = (participant: (typeof participants)[0]): ParticipantInfo => {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
    } catch {
      metadata = {};
    }

    // İsim önceliği: metadata.username > participant.name > identity
    const username = (metadata.username as string) || participant.name || participant.identity;
    const avatarUrl = (metadata.avatarUrl as string) || (metadata.avatar_url as string) || null;
    const role = (metadata.role as string) || "viewer";
    const isHost = role === "host" || role === "co_host" || (metadata.isHost as boolean) === true;

    return {
      identity: participant.identity,
      username,
      avatarUrl,
      role,
      isHost
    };
  };

  // Mikrofon durumunu kontrol et
  const hasMicTrack = (identity: string) => {
    return audioTracks.some((t) => t.participant.identity === identity && !t.publication?.isMuted);
  };

  // Admin kullanıcıları filtrele (hidden olsalar bile görünebilirler)
  const visibleParticipants = participants.filter((p) => {
    const info = getParticipantInfo(p);
    // Admin viewer'ları gizle
    return info.role !== "admin_viewer" && !info.identity.startsWith("admin_");
  });

  // Konuşabilenleri bul (host, speaker, moderator)
  const speakers = visibleParticipants.filter((p) => p.permissions?.canPublish);
  const listeners = visibleParticipants.filter((p) => !p.permissions?.canPublish);

  // Kick/Ban/Mute/Unmute işlemi
  const handleAction = async () => {
    if (!selectedParticipant || !actionType) return;

    setActionLoading(true);
    try {
      // Identity'den user_id çıkar
      const userId = selectedParticipant.identity.replace("admin_", "");

      let endpoint: string;
      let successMessage: string;

      if (actionType === "mute") {
        endpoint = `/api/ops/live/participants/${userId}/mute`;
        successMessage = "Katılımcının mikrofonu kapatıldı";
      } else if (actionType === "unmute") {
        endpoint = `/api/ops/live/participants/${userId}/unmute`;
        successMessage = "Katılımcının mikrofonu açıldı";
      } else if (actionType === "kick") {
        endpoint = `/api/ops/live/participants/${userId}/kick`;
        successMessage = "Katılımcı çıkarıldı";
      } else {
        endpoint = `/api/ops/live/participants/${userId}/ban`;
        successMessage = "Katılımcı yasaklandı";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          reason:
            actionType === "mute"
              ? "Yönetici tarafından susturuldu"
              : actionType === "unmute"
                ? "Yönetici tarafından mikrofonu açıldı"
                : actionType === "kick"
                  ? "Yönetici tarafından çıkarıldı"
                  : "Yönetici tarafından yasaklandı",
          ban_type: "session"
        })
      });

      if (!response.ok) {
        throw new Error("İşlem başarısız");
      }

      toast.success(successMessage);
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setActionLoading(false);
      setSelectedParticipant(null);
      setActionType(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Speakers Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-medium text-foreground">Sunucular</h4>
              <Badge variant="secondary" className="text-xs">
                {speakers.length}
              </Badge>
            </div>

            {speakers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz sunucu yok</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-center">
                {speakers.map((participant) => {
                  const info = getParticipantInfo(participant);
                  const isSpeaking = participant.isSpeaking;
                  const isMicOn = hasMicTrack(participant.identity);

                  return (
                    <ContextMenu key={participant.identity}>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <ContextMenuTrigger asChild>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-2 cursor-pointer select-none">
                                <div
                                  className={`relative rounded-full transition-all duration-300 ${
                                    isSpeaking
                                      ? "ring-4 ring-green-500/50 ring-offset-2 ring-offset-transparent scale-105"
                                      : ""
                                  }`}
                                >
                                  <Avatar className="h-20 w-20 border-2 border-border">
                                    <AvatarImage src={info.avatarUrl || undefined} />
                                    <AvatarFallback className="text-xl bg-linear-to-br from-purple-600 to-pink-600 text-white">
                                      {info.username?.[0]?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  {/* Mic indicator */}
                                  <div
                                    className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-background ${
                                      isMicOn ? "bg-green-500" : "bg-destructive"
                                    }`}
                                  >
                                    {isMicOn ? (
                                      <Mic className="h-3 w-3 text-white" />
                                    ) : (
                                      <MicOff className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  {/* Role badge */}
                                  {info.isHost && (
                                    <div className="absolute -top-1 -left-1 p-1 rounded-full bg-yellow-500 border-2 border-background">
                                      <Crown className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  {/* Speaking animation */}
                                  {isSpeaking && (
                                    <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
                                  )}
                                </div>
                                {/* İsim ve Rol */}
                                <div className="flex flex-col items-center text-center">
                                  <span className="text-sm font-medium text-foreground">
                                    {info.username}
                                  </span>
                                  <span className="text-xs text-purple-500 dark:text-purple-400">
                                    {info.isHost ? "👑 Host" : "🎙 Sunucu"}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                          </ContextMenuTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-semibold">@{info.username}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {info.isHost ? (
                                  <>
                                    <Crown className="h-3 w-3 text-yellow-500" /> Host
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-3 w-3 text-purple-500" /> Sunucu
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                {isSpeaking ? (
                                  <span className="text-green-500 flex items-center gap-1">
                                    <span className="animate-pulse">●</span> Konuşuyor
                                  </span>
                                ) : isMicOn ? (
                                  <span className="text-green-500 flex items-center gap-1">
                                    <Mic className="h-3 w-3" /> Mikrofon açık
                                  </span>
                                ) : (
                                  <span className="text-destructive flex items-center gap-1">
                                    <MicOff className="h-3 w-3" /> Mikrofon kapalı
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground pt-1 border-t">
                                Sağ tıklayarak yönetim menüsünü açın
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* Context Menu - Yönetim Menüsü */}
                      <ContextMenuContent className="w-48">
                        <ContextMenuLabel className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={info.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {info.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">@{info.username}</span>
                            {info.isHost && (
                              <span className="text-[10px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <Crown className="h-2.5 w-2.5" /> Host
                              </span>
                            )}
                          </div>
                        </ContextMenuLabel>
                        <ContextMenuSeparator />
                        {/* Mikrofon Kontrolü */}
                        {isMicOn ? (
                          <ContextMenuItem
                            onClick={() => {
                              setSelectedParticipant(info);
                              setActionType("mute");
                            }}
                            className="text-purple-600 dark:text-purple-400 focus:text-purple-600 dark:focus:text-purple-400"
                          >
                            <MicOff className="h-4 w-4 mr-2" />
                            Mikrofonu Kapat
                          </ContextMenuItem>
                        ) : (
                          <ContextMenuItem
                            onClick={() => {
                              setSelectedParticipant(info);
                              setActionType("unmute");
                            }}
                            className="text-green-600 dark:text-green-400 focus:text-green-600 dark:focus:text-green-400"
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Mikrofonu Aç
                          </ContextMenuItem>
                        )}
                        <ContextMenuSeparator />
                        {/* Yönetim İşlemleri */}
                        <ContextMenuItem
                          onClick={() => {
                            setSelectedParticipant(info);
                            setActionType("kick");
                          }}
                          className="text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Oturumdan Çıkar
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            setSelectedParticipant(info);
                            setActionType("ban");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Yasakla
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Listeners Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <h4 className="text-sm font-medium text-foreground">Dinleyiciler</h4>
              <Badge variant="secondary" className="text-xs">
                {listeners.length}
              </Badge>
            </div>

            {listeners.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz dinleyici yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {listeners.map((participant) => {
                  const info = getParticipantInfo(participant);

                  return (
                    <ContextMenu key={participant.identity}>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <ContextMenuTrigger asChild>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1.5 cursor-pointer select-none">
                                <Avatar className="h-14 w-14 border border-border">
                                  <AvatarImage src={info.avatarUrl || undefined} />
                                  <AvatarFallback className="text-base bg-muted text-muted-foreground">
                                    {info.username?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                {/* İsim ve Rol */}
                                <div className="flex flex-col items-center text-center">
                                  <span className="text-xs font-medium text-foreground">
                                    {info.username}
                                  </span>
                                  <span className="text-[10px] text-blue-500 dark:text-blue-400">
                                    👂 Dinleyici
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                          </ContextMenuTrigger>
                          <TooltipContent side="bottom" className="max-w-[180px]">
                            <div className="space-y-1">
                              <p className="font-semibold">@{info.username}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Users className="h-3 w-3 text-blue-500" /> Dinleyici
                              </div>
                              <p className="text-[10px] text-muted-foreground pt-1 border-t">
                                Sağ tıklayarak yönetim menüsünü açın
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* Context Menu - Yönetim Menüsü */}
                      <ContextMenuContent className="w-48">
                        <ContextMenuLabel className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={info.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {info.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">@{info.username}</span>
                        </ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => {
                            setSelectedParticipant(info);
                            setActionType("kick");
                          }}
                          className="text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Oturumdan Çıkar
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => {
                            setSelectedParticipant(info);
                            setActionType("ban");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Yasakla
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Volume Control */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-muted/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">{visibleParticipants.length} katılımcı</span>
        </div>

        <div className="flex items-center gap-3">
          <VolumeControl value={volume} onChange={onVolumeChange} disabled={isMuted} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMuteChange(!isMuted)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Kick/Ban/Mute/Unmute Onay Dialog */}
      <AlertDialog
        open={!!selectedParticipant && !!actionType}
        onOpenChange={(open) => !open && setSelectedParticipant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "mute"
                ? "Mikrofonu Kapat"
                : actionType === "unmute"
                  ? "Mikrofonu Aç"
                  : actionType === "kick"
                    ? "Katılımcıyı Çıkar"
                    : "Katılımcıyı Yasakla"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "mute"
                ? `@${selectedParticipant?.username} kullanıcısının mikrofonunu kapatmak istediğinize emin misiniz?`
                : actionType === "unmute"
                  ? `@${selectedParticipant?.username} kullanıcısının mikrofonunu açmak istediğinize emin misiniz?`
                  : actionType === "kick"
                    ? `@${selectedParticipant?.username} kullanıcısını oturumdan çıkarmak istediğinize emin misiniz?`
                    : `@${selectedParticipant?.username} kullanıcısını yasaklamak istediğinize emin misiniz? Kullanıcı bu oturuma bir daha katılamaz.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={actionLoading}
              className={
                actionType === "ban"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : actionType === "mute"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : actionType === "unmute"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : ""
              }
            >
              {actionLoading
                ? "İşleniyor..."
                : actionType === "mute"
                  ? "Mikrofonu Kapat"
                  : actionType === "unmute"
                    ? "Mikrofonu Aç"
                    : actionType === "kick"
                      ? "Çıkar"
                      : "Yasakla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
