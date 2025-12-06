/**
 * useDraftMessage Hook
 *
 * Amaç: Yazılan ama gönderilmemiş mesajları AsyncStorage'da saklar
 * Tarih: 2025-12-04
 *
 * Kullanıcı bir sohbetten çıktığında yazdığı mesaj kaybolmaz,
 * tekrar girdiğinde draft mesaj yüklenir.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@/utils/logger";

// =============================================
// CONSTANTS
// =============================================

const DRAFT_PREFIX = "draft_message_";
const DEBOUNCE_MS = 500; // 500ms debounce ile kaydet

// =============================================
// TYPES
// =============================================

interface UseDraftMessageOptions {
  conversationId: string;
  enabled?: boolean;
}

interface UseDraftMessageReturn {
  /** Mevcut draft mesaj */
  draft: string;
  /** Draft mesajı güncelle (debounced olarak kaydeder) */
  setDraft: (text: string) => void;
  /** Draft mesajı temizle (mesaj gönderildiğinde çağır) */
  clearDraft: () => Promise<void>;
  /** Draft yükleniyor mu? */
  isLoading: boolean;
}

// =============================================
// HOOK
// =============================================

/**
 * Draft mesaj yönetimi hook'u
 * 
 * @example
 * ```tsx
 * const { draft, setDraft, clearDraft } = useDraftMessage({ conversationId });
 * 
 * // GiftedChat'te kullan
 * <GiftedChat
 *   text={draft}
 *   onInputTextChanged={setDraft}
 *   onSend={(messages) => {
 *     handleSend(messages);
 *     clearDraft();
 *   }}
 * />
 * ```
 */
export function useDraftMessage({
  conversationId,
  enabled = true,
}: UseDraftMessageOptions): UseDraftMessageReturn {
  const [draft, setDraftState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = `${DRAFT_PREFIX}${conversationId}`;

  // Draft'ı AsyncStorage'dan yükle
  useEffect(() => {
    if (!enabled || !conversationId) {
      setIsLoading(false);
      return;
    }

    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(storageKey);
        if (savedDraft) {
          setDraftState(savedDraft);
        }
      } catch (error) {
        logger.warn('Failed to load draft', { tag: 'Draft' });
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [conversationId, enabled, storageKey]);

  // Draft'ı AsyncStorage'a kaydet (debounced)
  const saveDraft = useCallback(
    async (text: string) => {
      if (!enabled || !conversationId) return;

      try {
        if (text.trim()) {
          await AsyncStorage.setItem(storageKey, text);
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } catch (error) {
        logger.warn('Failed to save draft', { tag: 'Draft' });
      }
    },
    [conversationId, enabled, storageKey]
  );

  // Draft'ı güncelle (debounced kaydetme ile)
  const setDraft = useCallback(
    (text: string) => {
      setDraftState(text);

      // Önceki debounce'u iptal et
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Yeni debounce başlat
      debounceRef.current = setTimeout(() => {
        saveDraft(text);
      }, DEBOUNCE_MS);
    },
    [saveDraft]
  );

  // Draft'ı temizle (mesaj gönderildiğinde)
  const clearDraft = useCallback(async () => {
    if (!enabled || !conversationId) return;

    // Debounce'u iptal et
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setDraftState("");

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      logger.warn('Failed to clear draft', { tag: 'Draft' });
    }
  }, [conversationId, enabled, storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    draft,
    setDraft,
    clearDraft,
    isLoading,
  };
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Tüm draft mesajları temizle
 * (Örneğin logout'ta kullanılabilir)
 */
export async function clearAllDrafts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith(DRAFT_PREFIX));
    
    if (draftKeys.length > 0) {
      await AsyncStorage.multiRemove(draftKeys);
    }
  } catch (error) {
    logger.warn('Failed to clear all drafts', { tag: 'Draft' });
  }
}

/**
 * Belirli bir conversation için draft var mı kontrol et
 */
export async function hasDraft(conversationId: string): Promise<boolean> {
  try {
    const draft = await AsyncStorage.getItem(`${DRAFT_PREFIX}${conversationId}`);
    return !!draft?.trim();
  } catch {
    return false;
  }
}
