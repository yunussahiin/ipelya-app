/**
 * Host Disconnect Hook
 * Host bağlantısı kesildiğinde viewer'ları bilgilendirir
 * 30 saniye countdown gösterir
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface HostDisconnectState {
  isHostDisconnected: boolean;
  reconnectDeadline: number | null;
  remainingSeconds: number;
  message: string | null;
}

interface UseHostDisconnectOptions {
  sessionId: string | null;
  onHostReconnected?: () => void;
  onSessionEnded?: (reason: string) => void;
}

export function useHostDisconnect(options: UseHostDisconnectOptions) {
  const { sessionId, onHostReconnected, onSessionEnded } = options;

  const [state, setState] = useState<HostDisconnectState>({
    isHostDisconnected: false,
    reconnectDeadline: null,
    remainingSeconds: 0,
    message: null,
  });

  // Countdown timer
  useEffect(() => {
    if (!state.isHostDisconnected || !state.reconnectDeadline) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.reconnectDeadline! - Date.now()) / 1000));
      setState((prev) => ({
        ...prev,
        remainingSeconds: remaining,
      }));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isHostDisconnected, state.reconnectDeadline]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live:${sessionId}`)
      .on('broadcast', { event: 'host_disconnected' }, (payload) => {
        setState({
          isHostDisconnected: true,
          reconnectDeadline: payload.payload?.reconnectDeadline || Date.now() + 30000,
          remainingSeconds: 30,
          message: payload.payload?.message || 'Yayıncı bağlantısı kesildi...',
        });
      })
      .on('broadcast', { event: 'host_reconnected' }, () => {
        setState({
          isHostDisconnected: false,
          reconnectDeadline: null,
          remainingSeconds: 0,
          message: null,
        });
        onHostReconnected?.();
      })
      .on('broadcast', { event: 'session_ended' }, (payload) => {
        setState({
          isHostDisconnected: false,
          reconnectDeadline: null,
          remainingSeconds: 0,
          message: null,
        });
        onSessionEnded?.(payload.payload?.reason || 'unknown');
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, onHostReconnected, onSessionEnded]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isHostDisconnected: false,
      reconnectDeadline: null,
      remainingSeconds: 0,
      message: null,
    });
  }, []);

  return {
    ...state,
    reset,
  };
}
