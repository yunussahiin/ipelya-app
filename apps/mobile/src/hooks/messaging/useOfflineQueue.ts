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
import { useSendMessage } from "./useMessages";
import { useMessageStore } from "@/store/messaging";

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
  const addPendingMessage = useMessageStore((s) => s.addPendingMessage);
  const removePendingMessage = useMessageStore((s) => s.removePendingMessage);
  
  const isProcessing = useRef(false);
  const queueRef = useRef<QueuedMessage[]>([]);

  // Kuyruğu yükle
  const loadQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        queueRef.current = JSON.parse(stored);
        console.log(`[OfflineQueue] ${queueRef.current.length} mesaj yüklendi`);
      }
    } catch (error) {
      console.error("[OfflineQueue] Kuyruk yüklenemedi:", error);
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
      console.error("[OfflineQueue] Kuyruk kaydedilemedi:", error);
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
      addPendingMessage(request.conversation_id, {
        tempId: queuedMessage.id,
        ...request,
        status: "pending",
      });

      console.log(`[OfflineQueue] Mesaj kuyruğa eklendi: ${queuedMessage.id}`);
      return queuedMessage.id;
    },
    [saveQueue, addPendingMessage]
  );

  // Kuyruğu işle
  const processQueue = useCallback(async () => {
    if (isProcessing.current || queueRef.current.length === 0) return;

    // Bağlantı kontrolü
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        console.log("[OfflineQueue] Bağlantı yok, kuyruk bekletiliyor");
        return;
      }
    } catch (error) {
      console.warn("[OfflineQueue] Network check failed:", error);
      return;
    }

    isProcessing.current = true;
    console.log(`[OfflineQueue] ${queueRef.current.length} mesaj işleniyor...`);

    const failedMessages: QueuedMessage[] = [];

    for (const queuedMessage of queueRef.current) {
      try {
        // Mesajı gönder
        await sendMessage(queuedMessage.request);

        // Pending mesajı kaldır
        removePendingMessage(
          queuedMessage.request.conversation_id,
          queuedMessage.id
        );

        console.log(`[OfflineQueue] Mesaj gönderildi: ${queuedMessage.id}`);
      } catch (error) {
        console.error(`[OfflineQueue] Mesaj gönderilemedi: ${queuedMessage.id}`, error);

        // Retry sayısını artır
        queuedMessage.retryCount++;

        // Max retry'a ulaşmadıysa tekrar dene
        if (queuedMessage.retryCount < MAX_RETRY_COUNT) {
          failedMessages.push(queuedMessage);
        } else {
          // Max retry'a ulaştı, mesajı failed olarak işaretle
          removePendingMessage(
            queuedMessage.request.conversation_id,
            queuedMessage.id
          );
          console.log(`[OfflineQueue] Mesaj başarısız: ${queuedMessage.id}`);
        }
      }
    }

    // Başarısız mesajları kuyruğa geri ekle
    queueRef.current = failedMessages;
    await saveQueue();

    isProcessing.current = false;
    console.log(`[OfflineQueue] İşlem tamamlandı, kalan: ${failedMessages.length}`);
  }, [sendMessage, removePendingMessage, saveQueue]);

  // Bağlantı değişikliğini dinle (periyodik kontrol)
  useEffect(() => {
    let wasConnected = true;

    const checkConnection = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        const isConnected = networkState.isConnected ?? false;

        // Bağlantı geri geldiyse kuyruğu işle
        if (isConnected && !wasConnected) {
          console.log("[OfflineQueue] Bağlantı geri geldi, kuyruk işleniyor...");
          processQueue();
        }

        wasConnected = isConnected;
      } catch (error) {
        console.warn("[OfflineQueue] Network check failed:", error);
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
 */
export function useSyncOnReconnect() {
  const lastSyncRef = useRef<Date | null>(null);

  // Senkronizasyon fonksiyonu
  const sync = useCallback(async () => {
    const now = new Date();
    const lastSync = lastSyncRef.current;

    // Son 5 dakika içinde sync yapıldıysa atla
    if (lastSync && now.getTime() - lastSync.getTime() < 5 * 60 * 1000) {
      console.log("[Sync] Son 5 dakika içinde sync yapıldı, atlanıyor");
      return;
    }

    console.log("[Sync] Veriler senkronize ediliyor...");

    try {
      // TODO: Burada gerekli senkronizasyon işlemleri yapılacak
      // - Okunmamış mesaj sayılarını güncelle
      // - Yeni mesajları çek
      // - Conversation listesini güncelle

      lastSyncRef.current = now;
      console.log("[Sync] Senkronizasyon tamamlandı");
    } catch (error) {
      console.error("[Sync] Senkronizasyon hatası:", error);
    }
  }, []);

  // Bağlantı değişikliğini dinle
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        sync();
      }
    });

    return () => unsubscribe();
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
