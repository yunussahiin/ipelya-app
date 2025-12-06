/**
 * LiveKit Room Hook
 * LiveKit odasına bağlanma ve yönetme işlemleri
 * Reconnection handling, event listening içerir
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  ConnectionState,
  ConnectionQuality,
  Track,
  LocalParticipant,
  RemoteParticipant,
  VideoPresets,
  DisconnectReason,
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

// Data message types
export type DataMessageType = 'hand_raise' | 'grant_speak' | 'revoke_speak' | 'chat';

export interface DataMessage {
  type: DataMessageType;
  senderId: string;
  senderName: string;
  payload?: Record<string, unknown>;
  timestamp: number;
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
  /** Audio-only mode - video ayarlarını devre dışı bırak */
  audioOnly?: boolean;
  /** Krisp gelişmiş gürültü engelleme aktif mi */
  enableKrisp?: boolean;
  /** Kullanıcı bilgileri - token'a eklenecek */
  userInfo?: {
    name?: string;
    avatarUrl?: string;
    isHost?: boolean;
  };
  /** Media ayarları (video kalitesi, ses ayarları) */
  mediaSettings?: MediaSettings;
  onConnected?: () => void;
  onDisconnected?: (reason?: DisconnectReason) => void;
  /** Admin tarafından kick/ban edildiğinde (PARTICIPANT_REMOVED) */
  onAdminKick?: () => void;
  /** Oda admin tarafından sonlandırıldığında (ROOM_DELETED) */
  onRoomTerminated?: () => void;
  /** Başka cihazdan giriş yapıldığında (DUPLICATE_IDENTITY) */
  onDuplicateSession?: () => void;
  onError?: (error: Error) => void;
  onParticipantJoined?: (participant: RemoteParticipant) => void;
  onParticipantLeft?: (participant: RemoteParticipant) => void;
  /** Data message alındığında */
  onDataMessage?: (message: DataMessage, participant: RemoteParticipant | undefined) => void;
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
  /** Data message gönder (söz iste, konuşma izni ver vb.) */
  sendDataMessage: (type: DataMessageType, payload?: Record<string, unknown>) => Promise<void>;
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
    audioOnly = false,
    enableKrisp = false,
    userInfo,
    mediaSettings = defaultMediaSettings,
    onConnected,
    onDisconnected,
    onAdminKick,
    onRoomTerminated,
    onDuplicateSession,
    onError,
    onParticipantJoined,
    onParticipantLeft,
    onDataMessage,
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
  const mediaSettingsRef = useRef(mediaSettings);
  const audioOnlyRef = useRef(audioOnly);
  const enableMediaOnConnectRef = useRef(enableMediaOnConnect);
  const enableKrispRef = useRef(enableKrisp);
  
  // Settings değiştiğinde ref'leri güncelle
  useEffect(() => {
    mediaSettingsRef.current = mediaSettings;
  }, [mediaSettings]);
  
  useEffect(() => {
    audioOnlyRef.current = audioOnly;
  }, [audioOnly]);

  useEffect(() => {
    enableMediaOnConnectRef.current = enableMediaOnConnect;
  }, [enableMediaOnConnect]);

  useEffect(() => {
    enableKrispRef.current = enableKrisp;
  }, [enableKrisp]);

  // Token alma - gerçek roomName'i de döndürür
  const getToken = useCallback(async (roomName: string): Promise<{ token: string; actualRoomName: string }> => {
    const { data, error } = await supabase.functions.invoke('get-livekit-token', {
      body: { 
        roomName, 
        sessionId, 
        callId,
        // Kullanıcı bilgileri - token metadata'sına eklenecek
        userName: userInfo?.name,
        userAvatar: userInfo?.avatarUrl,
        isHost: userInfo?.isHost,
      },
    });

    if (error) {
      throw new Error(`Token alınamadı: ${error.message}`);
    }

    console.log('[LiveKit] Token response:', { role: data.role, canPublish: data.canPublish, roomName: data.roomName });
    return { token: data.token, actualRoomName: data.roomName };
  }, [sessionId, callId, userInfo]);

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

      // Media ayarlarından resolution ve bitrate al (ref kullan - stable reference)
      const currentSettings = mediaSettingsRef.current;
      const isAudioOnly = audioOnlyRef.current;

      console.log('[LiveKit] Creating room:', {
        audioOnly: isAudioOnly,
        noiseSuppression: currentSettings.noiseSuppression,
        echoCancellation: currentSettings.echoCancellation,
        autoGainControl: currentSettings.autoGainControl,
        ...(isAudioOnly ? {} : { videoQuality: currentSettings.videoQuality }),
      });

      // Room options - audio only için video ayarlarını dahil etme
      const roomOptions: ConstructorParameters<typeof Room>[0] = {
        adaptiveStream: !isAudioOnly,
        dynacast: !isAudioOnly,
        // Audio capture ayarları - her zaman
        audioCaptureDefaults: {
          echoCancellation: currentSettings.echoCancellation,
          noiseSuppression: currentSettings.noiseSuppression,
          autoGainControl: currentSettings.autoGainControl,
        },
        publishDefaults: {
          dtx: true, // Discontinuous transmission - sessizlikte bant genişliği tasarrufu
          red: true, // Redundant encoding - paket kaybına karşı
        },
      };

      // Video ayarlarını sadece video mode için ekle
      if (!isAudioOnly) {
        const videoResolution = getVideoResolution(currentSettings.videoQuality);
        const videoBitrate = getVideoBitrate(currentSettings.videoQuality);
        
        roomOptions.videoCaptureDefaults = {
          facingMode: 'user',
          resolution: videoResolution,
        };
        roomOptions.publishDefaults = {
          ...roomOptions.publishDefaults,
          videoEncoding: {
            maxBitrate: videoBitrate,
            maxFramerate: videoResolution.frameRate,
          },
          videoSimulcastLayers: [
            VideoPresets.h360,
            VideoPresets.h180,
          ],
        };
      }

      const newRoom = new Room(roomOptions);

      roomRef.current = newRoom;
      setRoom(newRoom);

      // Event listeners
      newRoom.on(RoomEvent.Connected, async () => {
        setIsConnected(true);
        setConnectionState(ConnectionState.Connected);
        
        // Mevcut katılımcıları hemen al - bağlantı kurulduğunda odada zaten olanlar
        const existingParticipants = Array.from(newRoom.remoteParticipants.values());
        console.log('[LiveKit] Connected! Existing participants:', existingParticipants.length);
        setRemoteParticipants(existingParticipants);
        
        // Host için medyayı aktifle - BAĞLANTI TAMAMLANDIKTAN SONRA
        // Ref'lerden güncel değerleri al (closure stale value sorunu için)
        const shouldEnableMedia = enableMediaOnConnectRef.current;
        const isAudioOnlyMode = audioOnlyRef.current;
        const shouldEnableKrisp = enableKrispRef.current;

        console.log('[LiveKit] enableMedia:', shouldEnableMedia, 'audioOnly:', isAudioOnlyMode);

        if (shouldEnableMedia) {
          try {
            if (isAudioOnlyMode) {
              console.log('[LiveKit] Enabling microphone (audio-only mode)...');
              await newRoom.localParticipant.setMicrophoneEnabled(true);
              setIsMicrophoneEnabled(true);
              
              // Krisp gelişmiş gürültü engelleme
              if (shouldEnableKrisp) {
                try {
                  const { KrispNoiseFilter } = await import('@livekit/react-native-krisp-noise-filter');
                  const krispProcessor = KrispNoiseFilter();
                  const micTrack = newRoom.localParticipant.getTrackPublication(Track.Source.Microphone)?.audioTrack;
                  if (micTrack) {
                    await micTrack.setProcessor(krispProcessor);
                    console.log('[LiveKit] Krisp noise filter enabled');
                  }
                } catch (krispError) {
                  console.log('[LiveKit] Krisp not available:', krispError);
                }
              }
            } else {
              console.log('[LiveKit] Enabling camera and microphone...');
              await newRoom.localParticipant.setCameraEnabled(true);
              await newRoom.localParticipant.setMicrophoneEnabled(true);
              setIsCameraEnabled(true);
              setIsMicrophoneEnabled(true);
            }
            console.log('[LiveKit] Media enabled successfully');
          } catch (mediaError) {
            console.warn('[LiveKit] Media enable error:', mediaError);
          }
        }
        
        onConnected?.();
      });

      newRoom.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        setIsConnected(false);
        setConnectionState(ConnectionState.Disconnected);
        
        // Admin aksiyonlarını tespit et
        console.log('[LiveKit] Disconnected, reason:', reason);
        
        if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
          // Admin tarafından kick veya ban edildi
          console.log('[LiveKit] Admin kick/ban detected');
          onAdminKick?.();
        } else if (reason === DisconnectReason.ROOM_DELETED) {
          // Oda silindi (admin terminate)
          console.log('[LiveKit] Room terminated by admin');
          onRoomTerminated?.();
        } else if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
          // Başka cihazdan giriş yapıldı
          console.log('[LiveKit] Duplicate session detected');
          onDuplicateSession?.();
        }
        
        onDisconnected?.(reason);
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
      
      // Track muted/unmuted events - Admin tarafından mute/unmute yapıldığında tetiklenir
      newRoom.on(RoomEvent.TrackMuted, (publication, participant) => {
        // Local participant mute edildi mi kontrol et
        if (participant === newRoom.localParticipant || participant.identity === newRoom.localParticipant.identity) {
          if (publication.source === Track.Source.Microphone) {
            setIsMicrophoneEnabled(false);
          }
          if (publication.source === Track.Source.Camera) {
            setIsCameraEnabled(false);
          }
        }
        // Remote participants güncelle
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });
      
      newRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        // Local participant unmute edildi mi kontrol et
        if (participant === newRoom.localParticipant || participant.identity === newRoom.localParticipant.identity) {
          if (publication.source === Track.Source.Microphone) {
            setIsMicrophoneEnabled(true);
          }
          if (publication.source === Track.Source.Camera) {
            setIsCameraEnabled(true);
          }
        }
        // Remote participants güncelle
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });
      
      // Local participant'ın kendi track event'leri - ParticipantEvent kullanarak
      newRoom.localParticipant.on(ParticipantEvent.TrackMuted, (publication) => {
        if (publication.source === Track.Source.Microphone) {
          setIsMicrophoneEnabled(false);
        }
        if (publication.source === Track.Source.Camera) {
          setIsCameraEnabled(false);
        }
      });
      
      newRoom.localParticipant.on(ParticipantEvent.TrackUnmuted, (publication) => {
        if (publication.source === Track.Source.Microphone) {
          setIsMicrophoneEnabled(true);
        }
        if (publication.source === Track.Source.Camera) {
          setIsCameraEnabled(true);
        }
      });

      // Active speakers changed - kim konuşuyor
      newRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
        // Participant'ların isSpeaking durumu güncellendi, re-render tetikle
        setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
      });

      // Data message received - söz iste, konuşma izni vb.
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const decoder = new TextDecoder();
          const messageStr = decoder.decode(payload);
          const message: DataMessage = JSON.parse(messageStr);
          console.log('[LiveKit] Data message received:', message.type, 'from:', participant?.identity);
          onDataMessage?.(message, participant);
        } catch (err) {
          console.error('[LiveKit] Failed to parse data message:', err);
        }
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
      const { token, actualRoomName } = await getToken(roomName);
      console.log('[LiveKit] Token received, connecting to:', serverUrl, 'actualRoom:', actualRoomName);
      await newRoom.connect(serverUrl, token, {
        autoSubscribe: true, // Remote track'leri otomatik subscribe et
      });
      
      // connect() tamamlandıktan sonra room state'i Connected olmalı
      console.log('[LiveKit] Connect completed, room state:', newRoom.state);
      
      // Eğer Connected event'i henüz tetiklenmediyse manuel olarak state'i güncelle
      if (newRoom.state === 'connected') {
        console.log('[LiveKit] Room already connected, updating state manually');
        
        // Önce room state'ini güncelle - bu önemli!
        setRoom(newRoom);
        
        // Sonra connected state'ini güncelle
        setIsConnected(true);
        setConnectionState(ConnectionState.Connected);
        
        // Mevcut katılımcıları al
        const existingParticipants = Array.from(newRoom.remoteParticipants.values());
        console.log('[LiveKit] Existing participants after connect:', existingParticipants.length);
        setRemoteParticipants(existingParticipants);
      }

      // Mevcut katılımcıları al ve subscribe olmamış track'lere subscribe ol
      const currentRemoteParticipants = Array.from(newRoom.remoteParticipants.values());
      currentRemoteParticipants.forEach((p) => {
        p.trackPublications.forEach((pub) => {
          if (!pub.isSubscribed) {
            pub.setSubscribed(true);
          }
        });
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bağlantı hatası');
      setError(error);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, providedRoomName, sessionId, callId, isConnecting, isConnected, getToken, onConnected, onDisconnected, onError, onParticipantJoined, onParticipantLeft]);

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
  // useMemo ile hesapla - remoteParticipants, room, isConnected veya local mic/camera state değiştiğinde yeniden hesapla
  const participants: FormattedParticipant[] = useMemo(() => {
    const currentRoom = roomRef.current || room;
    if (!currentRoom || !isConnected) return [];
    
    const result = [
      formatParticipant(currentRoom.localParticipant),
      ...remoteParticipants.map((p) => formatParticipant(p)),
    ];
    
    return result;
    // isMicrophoneEnabled ve isCameraEnabled dependency'leri local participant state değişikliklerini yakalar
  }, [room, remoteParticipants, isConnected, isMicrophoneEnabled, isCameraEnabled]);

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

  // Data message gönderme fonksiyonu
  const sendDataMessage = useCallback(async (type: DataMessageType, payload?: Record<string, unknown>) => {
    const currentRoom = roomRef.current || room;
    if (!currentRoom || !isConnected) {
      console.warn('[LiveKit] Cannot send data message - not connected');
      return;
    }

    const message: DataMessage = {
      type,
      senderId: currentRoom.localParticipant.identity,
      senderName: currentRoom.localParticipant.name || 'Kullanıcı',
      payload,
      timestamp: Date.now(),
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    try {
      await currentRoom.localParticipant.publishData(data, { reliable: true });
      console.log('[LiveKit] Data message sent:', type);
    } catch (err) {
      console.error('[LiveKit] Failed to send data message:', err);
    }
  }, [room, isConnected]);

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
    sendDataMessage,
  };
}
