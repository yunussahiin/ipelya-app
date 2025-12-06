/**
 * useRealtimeConnection Hook
 *
 * Amaç: Supabase Realtime bağlantı yönetimi
 * Tarih: 2025-11-26
 *
 * Auto-reconnect, connection status ve offline queue desteği.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { supabase } from "@/lib/supabaseClient";
import * as Network from "expo-network";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";

// =============================================
// TYPES
// =============================================

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UseRealtimeConnectionReturn {
  status: ConnectionStatus;
  isOnline: boolean;
  reconnect: () => void;
}

// =============================================
// HOOK
// =============================================

export function useRealtimeConnection(): UseRealtimeConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isOnline, setIsOnline] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  // Bağlantı kur
  const connect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    setStatus("connecting");

    const channel = supabase.channel("connection-status");

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setStatus("connected");
        reconnectAttempts.current = 0;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus("disconnected");
        scheduleReconnect();
      }
      if (status === "CLOSED") {
        setStatus("disconnected");
      }
    });

    channelRef.current = channel;
  }, []);

  // Yeniden bağlan (exponential backoff)
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    setStatus("reconnecting");

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isOnline) {
        connect();
      }
    }, delay);
  }, [connect, isOnline]);

  // Manuel reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Network durumu
  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const online = networkState.isConnected ?? false;
        if (mounted) {
          setIsOnline(online);
          if (online && status === "disconnected") {
            reconnect();
          }
        }
      } catch (error) {
        logger.warn('Network check failed', { tag: 'Realtime' });
      }
    };

    // İlk kontrol
    checkNetwork();

    // Periyodik kontrol (her 5 saniye)
    const interval = setInterval(checkNetwork, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [status, reconnect]);

  // App state (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && status === "disconnected") {
        reconnect();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [status, reconnect]);

  // İlk bağlantı
  useEffect(() => {
    connect();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { status, isOnline, reconnect };
}

// =============================================
// CONNECTION STATUS INDICATOR HOOK
// =============================================

/**
 * Bağlantı durumu göstergesi için kullanılır
 */
export function useConnectionStatusIndicator() {
  const { status, isOnline, reconnect } = useRealtimeConnection();

  const shouldShowIndicator = status !== "connected" || !isOnline;

  const message = !isOnline
    ? "İnternet bağlantısı yok"
    : status === "connecting"
      ? "Bağlanıyor..."
      : status === "reconnecting"
        ? "Yeniden bağlanıyor..."
        : status === "disconnected"
          ? "Bağlantı kesildi"
          : "";

  return {
    shouldShowIndicator,
    message,
    isOnline,
    status,
    reconnect,
  };
}
