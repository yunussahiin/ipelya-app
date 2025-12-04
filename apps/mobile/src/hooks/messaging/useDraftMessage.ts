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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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
          console.log("[Draft] Loaded draft for:", conversationId, "length:", savedDraft.length);
        }
      } catch (error) {
        console.warn("[Draft] Failed to load draft:", error);
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
          console.log("[Draft] Saved draft for:", conversationId, "length:", text.length);
        } else {
          // Boş ise sil
          await AsyncStorage.removeItem(storageKey);
          console.log("[Draft] Cleared empty draft for:", conversationId);
        }
      } catch (error) {
        console.warn("[Draft] Failed to save draft:", error);
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
      console.log("[Draft] Cleared draft for:", conversationId);
    } catch (error) {
      console.warn("[Draft] Failed to clear draft:", error);
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
      console.log("[Draft] Cleared all drafts:", draftKeys.length);
    }
  } catch (error) {
    console.warn("[Draft] Failed to clear all drafts:", error);
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
