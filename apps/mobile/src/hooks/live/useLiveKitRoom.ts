/**
 * LiveKit Room Hook
 * LiveKit odasına bağlanma ve yönetme işlemleri
 * Reconnection handling, event listening içerir
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  ConnectionQuality,
  Track,
  LocalParticipant,
  RemoteParticipant,
  VideoPresets,
} from 'livekit-client';
import { AudioSession, TrackReferenceOrPlaceholder } from '@livekit/react-native';
import { supabase } from '@/lib/supabaseClient';

export type VideoQuality = "360p" | "540p" | "720p" | "1080p";

export interface MediaSettings {
  videoQuality: VideoQuality;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

export interface UseLiveKitRoomOptions {
  serverUrl?: string;
  /** Session'dan gelen room name - öncelikli */
  roomName?: string;
  sessionId?: string;
  callId?: string;
  autoConnect?: boolean;
  /** Host için bağlandığında kamera/mikrofonu otomatik aktif et */
  enableMediaOnConnect?: boolean;
  /** Media ayarları (video kalitesi, ses ayarları) */
  mediaSettings?: MediaSettings;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onParticipantJoined?: (participant: RemoteParticipant) => void;
  onParticipantLeft?: (participant: RemoteParticipant) => void;
}

// Participant with formatted data
export interface FormattedParticipant {
  identity: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraEnabled: boolean;
  isSpeaking: boolean;
  videoTrack: TrackReferenceOrPlaceholder | null;
  audioTrack: TrackReferenceOrPlaceholder | null;
  metadata?: {
    avatarUrl?: string;
    isCreator?: boolean;
    role?: string;
  };
}

export interface UseLiveKitRoomResult {
  room: Room | null;
  isConnecting: boolean;
  isConnected: boolean;
  isReconnecting: boolean;
  connectionState: ConnectionState;
  connectionQuality: string;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  participants: FormattedParticipant[];
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  flipCamera: () => Promise<void>;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
}

// Default LiveKit server URL from env
const DEFAULT_LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

// Video kalitesine göre resolution ayarları
const getVideoResolution = (quality: VideoQuality) => {
  switch (quality) {
    case "360p":
      return { width: 640, height: 360, frameRate: 24 };
    case "540p":
      return { width: 960, height: 540, frameRate: 30 };
    case "720p":
      return { width: 1280, height: 720, frameRate: 30 };
    case "1080p":
      return { width: 1920, height: 1080, frameRate: 30 };
    default:
      return { width: 1280, height: 720, frameRate: 30 };
  }
};

// Video kalitesine göre bitrate ayarları
const getVideoBitrate = (quality: VideoQuality) => {
  switch (quality) {
    case "360p":
      return 600_000; // 600 kbps
    case "540p":
      return 1_000_000; // 1 Mbps
    case "720p":
      return 1_500_000; // 1.5 Mbps
    case "1080p":
      return 3_000_000; // 3 Mbps
    default:
      return 1_500_000;
  }
};

// Default media settings
const defaultMediaSettings: MediaSettings = {
  videoQuality: "720p",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

export function useLiveKitRoom(options: UseLiveKitRoomOptions): UseLiveKitRoomResult {
  const {
    serverUrl = DEFAULT_LIVEKIT_URL,
    roomName: providedRoomName,
    sessionId,
    callId,
    autoConnect = false,
    enableMediaOnConnect = false,
    mediaSettings = defaultMediaSettings,
    onConnected,
    onDisconnected,
    onError,
    onParticipantJoined,
    onParticipantLeft,
  } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const [error, setError] = useState<Error | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true); // Kamera yönü state'i

  const roomRef = useRef<Room | null>(null);

  // Token alma
  const getToken = useCallback(async (roomName: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('get-livekit-token', {
      body: { roomName, sessionId, callId },
    });

    if (error) {
      throw new Error(`Token alınamadı: ${error.message}`);
    }

    return data.token;
  }, [sessionId, callId]);

  // Odaya bağlan
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Eğer eski room varsa önce temizle
      if (roomRef.current) {
        roomRef.current.removeAllListeners();
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      // Media ayarlarından resolution ve bitrate al
      const videoResolution = getVideoResolution(mediaSettings.videoQuality);
      const videoBitrate = getVideoBitrate(mediaSettings.videoQuality);

      console.log('[LiveKit] Creating room with settings:', {
        videoQuality: mediaSettings.videoQuality,
        resolution: videoResolution,
        bitrate: videoBitrate,
        noiseSuppression: mediaSettings.noiseSuppression,
        echoCancellation: mediaSettings.echoCancellation,
        autoGainControl: mediaSettings.autoGainControl,
      });

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        // Video capture ayarları - mediaSettings'ten al
        videoCaptureDefaults: {
          facingMode: 'user', // Ön kamera varsayılan
          resolution: videoResolution,
        },
        // Audio capture ayarları - mediaSettings'ten al
        audioCaptureDefaults: {
          echoCancellation: mediaSettings.echoCancellation,
          noiseSuppression: mediaSettings.noiseSuppression,
          autoGainControl: mediaSettings.autoGainControl,
        },
        // Video publish ayarları - mediaSettings'ten al
        publishDefaults: {
          videoEncoding: {
            maxBitrate: videoBitrate,
            maxFramerate: videoResolution.frameRate,
          },
          // Simulcast katmanları - farklı kaliteler için preset kullan
          videoSimulcastLayers: [
            VideoPresets.h360,
            VideoPresets.h180,
          ],
          dtx: true, // Discontinuous transmission - sessizlikte bant genişliği tasarrufu
          red: true, // Redundant encoding - paket kaybına karşı
        },
      });

      roomRef.current = newRoom;
      setRoom(newRoom);

      // Event listeners
      newRoom.on(RoomEvent.Connected, async () => {
        setIsConnected(true);
        setConnectionState(ConnectionState.Connected);
        
        // Host için kamera ve mikrofonu aktifle - BAĞLANTI TAMAMLANDIKTAN SONRA
        if (enableMediaOnConnect) {
          try {
            console.log('[LiveKit] Enabling camera and microphone...');
            await newRoom.localParticipant.setCameraEnabled(true);
            await newRoom.localParticipant.setMicrophoneEnabled(true);
            setIsCameraEnabled(true);
            setIsMicrophoneEnabled(true);
            console.log('[LiveKit] Media enabled successfully');
          } catch (mediaError) {
            console.warn('[LiveKit] Media enable error:', mediaError);
          }
        }
        
        onConnected?.();
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setConnectionState(ConnectionState.Disconnected);
        onDisconnected?.();
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        setConnectionState(ConnectionState.Reconnecting);
        setIsReconnecting(true);
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        setConnectionState(ConnectionState.Connected);
        setIsReconnecting(false);
      });

      newRoom.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality) => {
        setConnectionQuality(quality);
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setRemoteParticipants((prev) => [...prev, participant]);
        onParticipantJoined?.(participant);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        setRemoteParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
        onParticipantLeft?.(participant);
      });

      newRoom.on(RoomEvent.LocalTrackPublished, () => {
        setIsMicrophoneEnabled(newRoom.localParticipant.isMicrophoneEnabled);
        setIsCameraEnabled(newRoom.localParticipant.isCameraEnabled);
      });

      newRoom.on(RoomEvent.LocalTrackUnpublished, () => {
        setIsMicrophoneEnabled(newRoom.localParticipant.isMicrophoneEnabled);
        setIsCameraEnabled(newRoom.localParticipant.isCameraEnabled);
      });

      // Remote track events - izleyici tarafında host'un track'lerini almak için
      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('[LiveKit] Track subscribed:', track.kind, 'from:', participant.identity);
        // Force re-render by updating participants
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('[LiveKit] Track unsubscribed:', track.kind, 'from:', participant.identity);
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      // Track published event - remote participant yeni track publish ettiğinde
      newRoom.on(RoomEvent.TrackPublished, (publication) => {
        // Video track ise otomatik subscribe et
        if (publication.kind === 'video' && !publication.isSubscribed) {
          publication.setSubscribed(true);
        }
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });
      
      // Track muted/unmuted events
      newRoom.on(RoomEvent.TrackMuted, () => {
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });
      
      newRoom.on(RoomEvent.TrackUnmuted, () => {
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      // Active speakers changed - kim konuşuyor
      newRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
        // Participant'ların isSpeaking durumu güncellendi, re-render tetikle
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      // Room adını önce prop'tan, yoksa sessionId/callId'den al
      const roomName = providedRoomName 
        || (sessionId ? `live_video_${sessionId}` : null)
        || (callId ? `call_${callId}` : null);

      if (!roomName) {
        throw new Error('roomName, sessionId veya callId gerekli');
      }

      // Token al ve bağlan
      console.log('[LiveKit] Getting token for room:', roomName);
      const token = await getToken(roomName);
      console.log('[LiveKit] Token received, connecting to:', serverUrl);
      await newRoom.connect(serverUrl, token, {
        autoSubscribe: true, // Remote track'leri otomatik subscribe et
      });
      console.log('[LiveKit] Connect called, waiting for Connected event...');

      // Mevcut katılımcıları al ve subscribe olmamış track'lere subscribe ol
      const currentRemoteParticipants = Array.from(newRoom.remoteParticipants.values());
      currentRemoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (!pub.isSubscribed) {
            pub.setSubscribed(true);
          }
        });
      });
      setRemoteParticipants(currentRemoteParticipants);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bağlantı hatası');
      setError(error);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, providedRoomName, sessionId, callId, isConnecting, isConnected, enableMediaOnConnect, getToken, onConnected, onDisconnected, onError, onParticipantJoined, onParticipantLeft]);

  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      // Önce tüm event listener'ları temizle
      roomRef.current.removeAllListeners();
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setIsConnected(false);
      setRemoteParticipants([]);
    }
  }, []);

  // Mikrofon toggle
  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    
    const enabled = roomRef.current.localParticipant.isMicrophoneEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMicrophoneEnabled(!enabled);
  }, []);

  // Kamera toggle
  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    
    const enabled = roomRef.current.localParticipant.isCameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(!enabled);
    setIsCameraEnabled(!enabled);
  }, []);

  // Kamera flip (front/back)
  const flipCamera = useCallback(async () => {
    if (!roomRef.current) return;
    
    const videoTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
    if (videoTrack?.track) {
      try {
        const newFacingMode = isFrontCamera ? 'environment' : 'user';
        
        // LiveKit track'i yeni facingMode ile yeniden başlat
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const track = videoTrack.track as any;
        
        if (typeof track.restartTrack === 'function') {
          await track.restartTrack({ facingMode: newFacingMode });
          setIsFrontCamera(!isFrontCamera);
          console.log('[LiveKit] Camera flipped to:', newFacingMode);
        } else if (typeof track.switchCamera === 'function') {
          // React Native WebRTC fallback
          await track.switchCamera();
          setIsFrontCamera(!isFrontCamera);
          console.log('[LiveKit] Camera switched using switchCamera()');
        } else {
          // En son çare: kamerayı kapat ve yeni facingMode ile aç
          await roomRef.current.localParticipant.setCameraEnabled(false);
          await new Promise(resolve => setTimeout(resolve, 100));
          await roomRef.current.localParticipant.setCameraEnabled(true, {
            facingMode: newFacingMode,
          });
          setIsFrontCamera(!isFrontCamera);
          console.log('[LiveKit] Camera restarted with facingMode:', newFacingMode);
        }
      } catch (err) {
        console.error('[LiveKit] Camera flip error:', err);
      }
    } else {
      console.warn('[LiveKit] No video track to flip');
    }
  }, [isFrontCamera]);

  // Audio session management
  useEffect(() => {
    const startAudio = async () => {
      try {
        await AudioSession.startAudioSession();
      } catch (err) {
        console.warn('[useLiveKitRoom] AudioSession start failed:', err);
      }
    };
    startAudio();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  // Auto connect effect
  useEffect(() => {
    if (autoConnect && (sessionId || callId) && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, sessionId, callId, isConnected, isConnecting, connect]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Format participants for easy consumption
  const formatParticipant = (p: LocalParticipant | RemoteParticipant): FormattedParticipant => {
    let metadata: FormattedParticipant['metadata'];
    try {
      metadata = p.metadata ? JSON.parse(p.metadata) : undefined;
    } catch {
      metadata = undefined;
    }

    const videoPub = p.getTrackPublication(Track.Source.Camera);
    const audioPub = p.getTrackPublication(Track.Source.Microphone);


    // TrackReference oluştur - LiveKit React Native için gerekli format
    // videoPub varsa ve subscribed ise (veya local participant ise) track reference oluştur
    const videoTrack: TrackReferenceOrPlaceholder | null = videoPub
      ? { participant: p, publication: videoPub, source: Track.Source.Camera }
      : null;
    
    const audioTrack: TrackReferenceOrPlaceholder | null = audioPub
      ? { participant: p, publication: audioPub, source: Track.Source.Microphone }
      : null;

    // isCameraEnabled: participant'ın kamerası açık mı?
    // Remote participant için: videoPub varsa ve enabled ise true
    // Local participant için: p.isCameraEnabled kullan
    const isCameraOn = videoPub 
      ? (videoPub.isEnabled !== false) // undefined veya true ise açık kabul et
      : p.isCameraEnabled;

    return {
      identity: p.identity,
      name: p.name || 'Kullanıcı',
      isHost: metadata?.role === 'host' || metadata?.isCreator === true,
      isMuted: !p.isMicrophoneEnabled,
      isCameraEnabled: isCameraOn,
      isSpeaking: p.isSpeaking,
      videoTrack,
      audioTrack,
      metadata,
    };
  };

  // All participants (local + remote)
  const participants: FormattedParticipant[] = room
    ? [
        formatParticipant(room.localParticipant),
        ...remoteParticipants.map((p) => formatParticipant(p)),
      ]
    : [];

  // Map connection quality to string
  const qualityString = (() => {
    switch (connectionQuality) {
      case ConnectionQuality.Excellent:
        return 'excellent';
      case ConnectionQuality.Good:
        return 'good';
      case ConnectionQuality.Poor:
        return 'poor';
      case ConnectionQuality.Lost:
        return 'lost';
      default:
        return 'unknown';
    }
  })();

  return {
    room,
    isConnecting,
    isConnected,
    isReconnecting,
    connectionState,
    connectionQuality: qualityString,
    localParticipant: room?.localParticipant || null,
    remoteParticipants,
    participants,
    error,
    connect,
    disconnect,
    toggleMicrophone,
    toggleCamera,
    flipCamera,
    isMicrophoneEnabled,
    isCameraEnabled,
  };
}
