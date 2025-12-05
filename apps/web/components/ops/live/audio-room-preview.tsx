"use client";

/**
 * AudioRoomPreview Component
 * LiveKit ile sesli oda canlı izleme
 * Referans: LIVEKIT_REACT_INTEGRATION.md → Audio Room Preview
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

import { Loader2, Volume2, VolumeX, Users, Mic, MicOff, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { VolumeControl } from "./volume-control";

interface AudioRoomPreviewProps {
  sessionId: string;
  roomName: string;
  sessionTitle: string;
}

export function AudioRoomPreview({ sessionId, roomName, sessionTitle }: AudioRoomPreviewProps) {
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
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Odaya bağlanılıyor...</p>
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
        <AlertDescription>Oda izleme token&apos;ı alınamadı.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sessionTitle}</CardTitle>
          <Badge variant="outline" className="text-purple-500 border-purple-500">
            🎙️ SESLİ ODA
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect={true}
          audio={false}
          video={false}
          onError={(err) => setError(err.message)}
        >
          <AudioPreviewContent
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

interface AudioPreviewContentProps {
  isMuted: boolean;
  volume: number;
  onMuteChange: (muted: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

function AudioPreviewContent({
  isMuted,
  volume,
  onMuteChange,
  onVolumeChange
}: AudioPreviewContentProps) {
  const participants = useParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);

  // Konuşabilenleri bul (host, speaker, moderator)
  const speakers = participants.filter((p) => p.permissions?.canPublish);
  const listeners = participants.filter((p) => !p.permissions?.canPublish);

  return (
    <div className="space-y-4">
      {/* Speakers Section */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Konuşmacılar ({speakers.length})
        </h4>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {speakers.map((participant) => {
            const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
            const isSpeaking = participant.isSpeaking;
            const isMicOn = audioTracks.some(
              (t) => t.participant.identity === participant.identity
            );

            return (
              <div key={participant.identity} className="flex flex-col items-center gap-1">
                <div
                  className={`relative rounded-full p-0.5 ${
                    isSpeaking ? "ring-2 ring-green-500 ring-offset-2" : ""
                  }`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={metadata.avatarUrl} />
                    <AvatarFallback>{metadata.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
                      isMicOn ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {isMicOn ? (
                      <Mic className="h-3 w-3 text-white" />
                    ) : (
                      <MicOff className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
                <span className="text-xs text-center truncate w-full">
                  {metadata.username || "User"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listeners Count */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">{listeners.length} dinleyici</span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onMuteChange(!isMuted)}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <VolumeControl value={volume} onChange={onVolumeChange} disabled={isMuted} />
        </div>
      </div>
    </div>
  );
}
