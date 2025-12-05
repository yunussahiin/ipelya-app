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
  Participant,
  Track,
  LocalParticipant,
  RemoteParticipant,
} from 'livekit-client';
import { supabase } from '@/lib/supabaseClient';

export interface UseLiveKitRoomOptions {
  serverUrl: string;
  sessionId?: string;
  callId?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onParticipantJoined?: (participant: RemoteParticipant) => void;
  onParticipantLeft?: (participant: RemoteParticipant) => void;
}

export interface UseLiveKitRoomResult {
  room: Room | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  connectionQuality: ConnectionQuality;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
}

export function useLiveKitRoom(options: UseLiveKitRoomOptions): UseLiveKitRoomResult {
  const {
    serverUrl,
    sessionId,
    callId,
    onConnected,
    onDisconnected,
    onError,
    onParticipantJoined,
    onParticipantLeft,
  } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(ConnectionQuality.Unknown);
  const [error, setError] = useState<Error | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

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
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = newRoom;
      setRoom(newRoom);

      // Event listeners
      newRoom.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        setConnectionState(ConnectionState.Connected);
        onConnected?.();
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setConnectionState(ConnectionState.Disconnected);
        onDisconnected?.();
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        setConnectionState(ConnectionState.Reconnecting);
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        setConnectionState(ConnectionState.Connected);
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

      // Room adını sessionId veya callId'den al
      const roomName = sessionId
        ? `live_video_${sessionId}`
        : callId
        ? `call_${callId}`
        : '';

      if (!roomName) {
        throw new Error('sessionId veya callId gerekli');
      }

      // Token al ve bağlan
      const token = await getToken(roomName);
      await newRoom.connect(serverUrl, token);

      // Mevcut katılımcıları al
      setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bağlantı hatası');
      setError(error);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, sessionId, callId, isConnecting, isConnected, getToken, onConnected, onDisconnected, onError, onParticipantJoined, onParticipantLeft]);

  // Bağlantıyı kes
  const disconnect = useCallback(() => {
    if (roomRef.current) {
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

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    room,
    isConnecting,
    isConnected,
    connectionState,
    connectionQuality,
    localParticipant: room?.localParticipant || null,
    remoteParticipants,
    error,
    connect,
    disconnect,
    toggleMicrophone,
    toggleCamera,
    isMicrophoneEnabled,
    isCameraEnabled,
  };
}
