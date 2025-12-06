/**
 * useOfflineQueue Hook
 *
 * Amaç: Offline mesaj kuyruğu yönetimi
 * Tarih: 2025-11-26
 *
 * Çevrimdışıyken gönderilen mesajları kuyruğa alır,
 * bağlantı geri geldiğinde sırayla gönderir.
 */

import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { useQueryClient } from "@tanstack/react-query";
import { useSendMessage } from "./useMessages";
import { useMessageStore, useConversationStore } from "@/store/messaging";
import { logger } from "@/utils/logger";

// =============================================
// TYPES
// =============================================

interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: "text" | "image" | "video" | "audio" | "file";
  media_url?: string;
  reply_to_id?: string;
}

interface QueuedMessage {
  id: string;
  request: SendMessageRequest;
  createdAt: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = "@messaging:offline_queue";
const MAX_RETRY_COUNT = 3;

// =============================================
// HOOK
// =============================================

export function useOfflineQueue() {
  const { mutateAsync: sendMessage } = useSendMessage();
  
  const isProcessing = useRef(false);
  const queueRef = useRef<QueuedMessage[]>([]);

  // Kuyruğu yükle
  const loadQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        queueRef.current = JSON.parse(stored);
      }
    } catch (error) {
      logger.error("Queue load error", error, { tag: "OfflineQueue" });
    }
  }, []);

  // Kuyruğu kaydet
  const saveQueue = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(queueRef.current)
      );
    } catch (error) {
      logger.error("Queue save error", error, { tag: "OfflineQueue" });
    }
  }, []);

  // Kuyruğa mesaj ekle
  const enqueue = useCallback(
    async (request: SendMessageRequest) => {
      const queuedMessage: QueuedMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        request,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };

      queueRef.current.push(queuedMessage);
      await saveQueue();

      // Pending mesaj olarak store'a ekle
      useMessageStore.getState().addPendingMessage(request.conversation_id, {
        tempId: queuedMessage.id,
        ...request,
        status: "pending",
      } as any);

      return queuedMessage.id;
    },
    [saveQueue]
  );

  // Kuyruğu işle
  const processQueue = useCallback(async () => {
    if (isProcessing.current || queueRef.current.length === 0) return;

    // Bağlantı kontrolü
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) return;
    } catch {
      return;
    }

    isProcessing.current = true;

    const failedMessages: QueuedMessage[] = [];

    for (const queuedMessage of queueRef.current) {
      try {
        // Mesajı gönder
        await sendMessage(queuedMessage.request);

        // Pending mesajı kaldır
        useMessageStore.getState().removePendingMessage(
          queuedMessage.request.conversation_id,
          queuedMessage.id
        );

      } catch (error) {
        logger.error("Message send failed", error, { tag: "OfflineQueue" });

        // Retry sayısını artır
        queuedMessage.retryCount++;

        // Max retry'a ulaşmadıysa tekrar dene
        if (queuedMessage.retryCount < MAX_RETRY_COUNT) {
          failedMessages.push(queuedMessage);
        } else {
          // Max retry'a ulaştı, mesajı failed olarak işaretle
          useMessageStore.getState().removePendingMessage(
            queuedMessage.request.conversation_id,
            queuedMessage.id
          );
        }
      }
    }

    queueRef.current = failedMessages;
    await saveQueue();
    isProcessing.current = false;
  }, [sendMessage, removePendingMessage, saveQueue]);

  // Bağlantı değişikliğini dinle (periyodik kontrol)
  useEffect(() => {
    let wasConnected = true;

    const checkConnection = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const isConnected = networkState.isConnected ?? false;

        if (isConnected && !wasConnected) {
          processQueue();
        }
        wasConnected = isConnected;
      } catch {
        // Network check failed
      }
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [processQueue]);

  // App foreground'a geldiğinde kuyruğu işle
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        processQueue();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [processQueue]);

  // İlk yüklemede kuyruğu yükle ve işle
  useEffect(() => {
    loadQueue().then(() => processQueue());
  }, [loadQueue, processQueue]);

  return {
    enqueue,
    processQueue,
    queueLength: queueRef.current.length,
  };
}

// =============================================
// SYNC ON RECONNECT HOOK
// =============================================

/**
 * Bağlantı geri geldiğinde verileri senkronize eder
 * 
 * Bu hook şu işlemleri yapar:
 * 1. Conversation listesini yeniler
 * 2. Aktif conversation varsa mesajları yeniler
 * 3. Unread count'ları günceller
 * 
 * @updated 2025-12-04 - Tam implementasyon eklendi
 */
export function useSyncOnReconnect() {
  const lastSyncRef = useRef<Date | null>(null);
  const queryClient = useQueryClient();

  // Senkronizasyon fonksiyonu
  const sync = useCallback(async () => {
    const now = new Date();
    const lastSync = lastSyncRef.current;

    if (lastSync && now.getTime() - lastSync.getTime() < 30 * 1000) {
      return;
    }

    try {
      const convStore = useConversationStore.getState();
      const activeConversationId = convStore.activeConversationId;

      // 1. Conversation listesini invalidate et
      await queryClient.invalidateQueries({ 
        queryKey: ["conversations"],
        refetchType: "active"
      });

      // 2. Aktif conversation varsa mesajları yenile
      if (activeConversationId) {
        await queryClient.invalidateQueries({ 
          queryKey: ["messages", activeConversationId],
          refetchType: "active"
        });
      }

      // 3. Supabase'den güncel unread count'ları çek
      const { supabase } = await import("@/lib/supabaseClient");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("conversation_id, unread_count")
          .eq("user_id", user.id)
          .is("left_at", null);

        if (participants) {
          // Store'daki unread count'ları güncelle
          for (const p of participants) {
            if (p.unread_count > 0) {
              convStore.updateConversation(p.conversation_id, {
                unread_count: p.unread_count,
              });
            }
          }
        }
      }

      lastSyncRef.current = now;
    } catch (error) {
      logger.error("Sync error", error, { tag: "Sync" });
    }
  }, [queryClient]);

  // Bağlantı değişikliğini dinle (periyodik kontrol)
  useEffect(() => {
    let wasConnected = true;

    const checkConnection = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const isConnected = networkState.isConnected ?? false;

        if (isConnected && !wasConnected) {
          sync();
        }
        wasConnected = isConnected;
      } catch {
        // Network check failed
      }
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [sync]);

  // App foreground'a geldiğinde sync yap
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        sync();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [sync]);

  return { sync };
}
