"use client";

/**
 * MobilePreview Component
 * iPhone 15 Pro mockup içinde LiveKit video gösterimi
 */

import { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useParticipants,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

import { Loader2, Volume2, VolumeX, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Iphone15Pro from "@/components/iphone-15-pro";

import { VolumeControl } from "./volume-control";

interface CreatorInfo {
  username: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface MobilePreviewProps {
  sessionId: string;
  roomName: string;
  creator?: CreatorInfo;
}

export function MobilePreview({ sessionId, roomName, creator }: MobilePreviewProps) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Varsayılan olarak ses kapalı - browser autoplay policy nedeniyle
  // Kullanıcı tıklayınca açılabilir
  const [isMuted, setIsMuted] = useState(true);
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
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <Iphone15Pro width={280} height={570} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 mt-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Bağlanılıyor...</p>
            </div>
          </div>
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
        <AlertDescription>Yayın izleme token&apos;ı alınamadı.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        audio={false}
        video={false}
        onError={(err) => setError(err.message)}
      >
        <MobileVideoContent creator={creator} />
        {!isMuted && <RoomAudioRenderer volume={volume} />}
      </LiveKitRoom>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 mt-4">
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <VolumeControl value={volume} onChange={setVolume} disabled={isMuted} />
      </div>
    </div>
  );
}

interface MobileVideoContentProps {
  creator?: CreatorInfo;
}

function MobileVideoContent({ creator }: MobileVideoContentProps) {
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Host'un video track'ini bul
  const hostVideoTrack = tracks.find(
    (track) => track.participant.permissions?.canPublish && track.source === Track.Source.Camera
  );

  const screenShareTrack = tracks.find((track) => track.source === Track.Source.ScreenShare);
  const displayTrack = screenShareTrack || hostVideoTrack;

  // Loading timeout
  useEffect(() => {
    if (displayTrack) {
      setLoadingTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!displayTrack]);

  const isVideoLoading = !displayTrack && !loadingTimeout;

  // iPhone 15 Pro oranları (viewBox: 433x882)
  // Ekran alanı: x=21.25, y=19.25, w=389.5, h=843.5, rx=55.75
  const phoneWidth = 280;
  const phoneHeight = 570;
  const scale = phoneWidth / 433;

  // Ekran pozisyonları (orantılı)
  const screenLeft = 21.25 * scale;
  const screenTop = 19.25 * scale;
  const screenWidth = 389.5 * scale;
  const screenHeight = 843.5 * scale;
  const borderRadius = 55.75 * scale;

  return (
    <div className="relative">
      {/* iPhone Frame with Video Inside */}
      <div className="relative">
        <Iphone15Pro width={phoneWidth} height={phoneHeight}>
          {/* Video content rendered inside phone */}
        </Iphone15Pro>

        {/* Video overlay positioned inside phone screen */}
        <div
          className="absolute bg-black overflow-hidden"
          style={{
            top: `${screenTop}px`,
            left: `${screenLeft}px`,
            width: `${screenWidth}px`,
            height: `${screenHeight}px`,
            borderRadius: `${borderRadius}px`
          }}
        >
          {displayTrack ? (
            <VideoTrack trackRef={displayTrack} className="w-full h-full object-cover" />
          ) : isVideoLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
              <p className="text-xs text-white/50">Video yükleniyor...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-white/50">Video yok</p>
            </div>
          )}

          {/* Overlay: Creator Info & Live Badge */}
          <div className="absolute top-10 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1.5 rounded-full">
              <Avatar className="h-6 w-6 border border-white/20">
                <AvatarImage src={creator?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-linear-to-br from-pink-500 to-purple-600 text-white">
                  {creator?.display_name?.[0] || creator?.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-xs font-medium">
                @{creator?.username || "creator"}
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-red-500 border-red-500 text-[10px] bg-black/60 backdrop-blur-sm"
            >
              🔴 CANLI
            </Badge>
          </div>

          {/* Overlay: Viewer Count */}
          <div className="absolute bottom-4 right-3 flex items-center gap-1 text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <Users className="h-3 w-3" />
            <span className="text-xs">{participants.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
