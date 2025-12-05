/**
 * Connection Quality Hook
 * Bağlantı kalitesini izler ve UI'da gösterir
 */

import { useState, useEffect, useCallback } from 'react';
import { ConnectionQuality, Room, RoomEvent } from 'livekit-client';

export type QualityLevel = 'excellent' | 'good' | 'poor' | 'lost' | 'unknown';

export interface ConnectionQualityState {
  quality: QualityLevel;
  signalStrength: number; // 0-4 (bars)
  isReconnecting: boolean;
  showWarning: boolean;
  warningMessage: string | null;
}

interface UseConnectionQualityOptions {
  room: Room | null;
  onQualityChange?: (quality: QualityLevel) => void;
  poorQualityThreshold?: number; // Kaç saniye poor kalırsa uyarı göster
}

export function useConnectionQuality(options: UseConnectionQualityOptions) {
  const { room, onQualityChange, poorQualityThreshold = 5 } = options;

  const [state, setState] = useState<ConnectionQualityState>({
    quality: 'unknown',
    signalStrength: 0,
    isReconnecting: false,
    showWarning: false,
    warningMessage: null,
  });

  const [poorQualityStartTime, setPoorQualityStartTime] = useState<number | null>(null);

  // Quality to signal strength mapping
  const getSignalStrength = useCallback((quality: ConnectionQuality): number => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return 4;
      case ConnectionQuality.Good:
        return 3;
      case ConnectionQuality.Poor:
        return 1;
      case ConnectionQuality.Lost:
        return 0;
      default:
        return 0;
    }
  }, []);

  // Quality to level mapping
  const getQualityLevel = useCallback((quality: ConnectionQuality): QualityLevel => {
    switch (quality) {
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
  }, []);

  // Room event listeners
  useEffect(() => {
    if (!room) return;

    const handleQualityChange = (quality: ConnectionQuality) => {
      const level = getQualityLevel(quality);
      const signalStrength = getSignalStrength(quality);

      setState((prev) => ({
        ...prev,
        quality: level,
        signalStrength,
      }));

      onQualityChange?.(level);

      // Poor quality tracking
      if (level === 'poor' || level === 'lost') {
        if (!poorQualityStartTime) {
          setPoorQualityStartTime(Date.now());
        }
      } else {
        setPoorQualityStartTime(null);
        setState((prev) => ({
          ...prev,
          showWarning: false,
          warningMessage: null,
        }));
      }
    };

    const handleReconnecting = () => {
      setState((prev) => ({
        ...prev,
        isReconnecting: true,
        showWarning: true,
        warningMessage: 'Bağlantı yeniden kuruluyor...',
      }));
    };

    const handleReconnected = () => {
      setState((prev) => ({
        ...prev,
        isReconnecting: false,
        showWarning: false,
        warningMessage: null,
      }));
    };

    room.on(RoomEvent.ConnectionQualityChanged, handleQualityChange);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQualityChange);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
    };
  }, [room, getQualityLevel, getSignalStrength, onQualityChange, poorQualityStartTime]);

  // Poor quality warning timer
  useEffect(() => {
    if (!poorQualityStartTime) return;

    const checkInterval = setInterval(() => {
      const elapsed = (Date.now() - poorQualityStartTime) / 1000;
      
      if (elapsed >= poorQualityThreshold) {
        setState((prev) => ({
          ...prev,
          showWarning: true,
          warningMessage: 'Bağlantı kalitesi düşük. Daha iyi bir ağa bağlanmayı deneyin.',
        }));
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [poorQualityStartTime, poorQualityThreshold]);

  // Get color for quality
  const getQualityColor = useCallback((quality: QualityLevel): string => {
    switch (quality) {
      case 'excellent':
        return '#10B981'; // green
      case 'good':
        return '#F59E0B'; // amber
      case 'poor':
        return '#EF4444'; // red
      case 'lost':
        return '#6B7280'; // gray
      default:
        return '#9CA3AF'; // gray-400
    }
  }, []);

  return {
    ...state,
    getQualityColor,
  };
}
