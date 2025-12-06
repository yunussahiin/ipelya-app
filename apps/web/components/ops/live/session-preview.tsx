"use client";

/**
 * SessionPreview Component
 * LiveKit ile video yayını canlı izleme
 * Referans: LIVEKIT_REACT_INTEGRATION.md → Session Preview Component
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { VolumeControl } from "./volume-control";

interface SessionPreviewProps {
  sessionId: string;
  roomName: string;
  sessionTitle: string;
}

export function SessionPreview({ sessionId, roomName, sessionTitle }: SessionPreviewProps) {
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
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Yayına bağlanılıyor...</p>
          </div>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sessionTitle}</CardTitle>
          <Badge variant="outline" className="text-red-500 border-red-500">
            🔴 CANLI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect={true}
          audio={false}
          video={false}
          onError={(err) => setError(err.message)}
        >
          <VideoPreviewContent
            isMuted={isMuted}
            volume={volume}
            onMuteChange={setIsMuted}
            onVolumeChange={setVolume}
          />
          {!isMuted && <RoomAudioRenderer volume={volume} />}
        </LiveKitRoom>
      </CardContent>
    </Card>
  );
}

interface VideoPreviewContentProps {
  isMuted: boolean;
  volume: number;
  onMuteChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

function VideoPreviewContent({
  isMuted,
  volume,
  onMuteChange,
  onVolumeChange
}: VideoPreviewContentProps) {
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Host'un video track'ini bul
  const hostVideoTrack = tracks.find(
    (track) => track.participant.permissions?.canPublish && track.source === Track.Source.Camera
  );

  const screenShareTrack = tracks.find((track) => track.source === Track.Source.ScreenShare);

  const displayTrack = screenShareTrack || hostVideoTrack;

  // Track dimensions'dan aspect ratio belirle - dimensions değiştiğinde güncelle
  const [videoAspect, setVideoAspect] = useState<"landscape" | "portrait">("landscape");

  useEffect(() => {
    if (!displayTrack) return;

    // Dimensions'ı kontrol et
    const checkDimensions = () => {
      const trackDims = displayTrack.publication?.dimensions;
      if (trackDims && trackDims.width > 0 && trackDims.height > 0) {
        const isPortrait = trackDims.height > trackDims.width;
        setVideoAspect(isPortrait ? "portrait" : "landscape");
      }
    };

    // İlk kontrol
    checkDimensions();

    // Track değişikliklerini dinle
    const interval = setInterval(checkDimensions, 1000);
    return () => clearInterval(interval);
  }, [displayTrack]);

  // Loading timeout - track yokken 5 saniye bekle
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

  // Loading durumu: track yoksa ve timeout geçmediyse loading göster
  const isVideoLoading = !displayTrack && !loadingTimeout;

  return (
    <div className="relative">
      {/* Video Area - Portrait/Landscape dinamik */}
      <div
        className={`bg-black relative flex items-center justify-center ${
          videoAspect === "portrait"
            ? "aspect-[9/16] max-h-[600px] mx-auto max-w-[340px]"
            : "aspect-video"
        }`}
      >
        {displayTrack ? (
          <VideoTrack trackRef={displayTrack} className="w-full h-full object-contain" />
        ) : isVideoLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-white/50">Video yükleniyor...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Video yok</p>
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => onMuteChange(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <VolumeControl value={volume} onChange={onVolumeChange} disabled={isMuted} />
            </div>

            <div className="flex items-center gap-2 text-white">
              <Users className="h-4 w-4" />
              <span className="text-sm">{participants.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
