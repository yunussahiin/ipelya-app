/**
 * Message Store
 *
 * Amaç: DM mesaj state yönetimi
 * Tarih: 2025-11-26
 *
 * Bu store, sohbet mesajlarını ve pending mesajları yönetir.
 * Optimistic updates için pending mesaj desteği sağlar.
 */

import { create } from "zustand";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Message } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

/**
 * Pending mesaj (gönderilmekte olan)
 */
interface PendingMessage extends Omit<Message, "id"> {
  tempId: string;
  status: "sending";
}

interface MessageState {
  // State - conversationId -> messages
  messages: Record<string, Message[]>;
  pendingMessages: Record<string, PendingMessage[]>;
  isLoadingMore: Record<string, boolean>;
  hasMore: Record<string, boolean>;
  cursors: Record<string, string | null>;

  // Actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

  // Pending messages
  addPendingMessage: (conversationId: string, message: PendingMessage) => void;
  removePendingMessage: (conversationId: string, tempId: string) => void;
  confirmPendingMessage: (
    conversationId: string,
    tempId: string,
    realMessage: Message
  ) => void;

  // Pagination
  setLoadingMore: (conversationId: string, loading: boolean) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;
  setCursor: (conversationId: string, cursor: string | null) => void;

  // Utils
  clearConversation: (conversationId: string) => void;
  reset: () => void;
}

// =============================================
// INITIAL STATE
// =============================================

const initialState = {
  messages: {},
  pendingMessages: {},
  isLoadingMore: {},
  hasMore: {},
  cursors: {},
};

// =============================================
// STORE
// =============================================

export const useMessageStore = create<MessageState>()((set, get) => ({
  ...initialState,

  /**
   * Sohbetin mesajlarını set eder (ilk yükleme)
   */
  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },

  /**
   * Yeni mesaj ekler (başa - en yeni)
   */
  addMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Duplicate kontrolü
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [message, ...existing],
        },
      };
    });
  },

  /**
   * Birden fazla mesaj ekler (sona - pagination için)
   */
  addMessages: (conversationId, messages) => {
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const existingIds = new Set(existing.map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, ...newMessages],
        },
      };
    });
  },

  /**
   * Mesajı günceller
   */
  updateMessage: (conversationId, messageId, updates) => {
    set((state) => {
      const messages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        },
      };
    });
  },

  /**
   * Mesajı kaldırır
   */
  removeMessage: (conversationId, messageId) => {
    set((state) => {
      const messages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.filter((m) => m.id !== messageId),
        },
      };
    });
  },

  /**
   * Pending mesaj ekler (optimistic update)
   */
  addPendingMessage: (conversationId, message) => {
    set((state) => {
      const existing = state.pendingMessages[conversationId] || [];
      return {
        pendingMessages: {
          ...state.pendingMessages,
          [conversationId]: [message, ...existing],
        },
      };
    });
  },

  /**
   * Pending mesajı kaldırır (hata durumunda)
   */
  removePendingMessage: (conversationId, tempId) => {
    set((state) => {
      const existing = state.pendingMessages[conversationId] || [];
      return {
        pendingMessages: {
          ...state.pendingMessages,
          [conversationId]: existing.filter((m) => m.tempId !== tempId),
        },
      };
    });
  },

  /**
   * Pending mesajı gerçek mesajla değiştirir
   */
  confirmPendingMessage: (conversationId, tempId, realMessage) => {
    set((state) => {
      // Pending'den kaldır
      const pending = state.pendingMessages[conversationId] || [];
      const newPending = pending.filter((m) => m.tempId !== tempId);

      // Gerçek mesajı ekle
      const messages = state.messages[conversationId] || [];
      const newMessages = [realMessage, ...messages];

      return {
        pendingMessages: {
          ...state.pendingMessages,
          [conversationId]: newPending,
        },
        messages: {
          ...state.messages,
          [conversationId]: newMessages,
        },
      };
    });
  },

  /**
   * Loading more state'i set eder
   */
  setLoadingMore: (conversationId, loading) => {
    set((state) => ({
      isLoadingMore: {
        ...state.isLoadingMore,
        [conversationId]: loading,
      },
    }));
  },

  /**
   * Has more state'i set eder
   */
  setHasMore: (conversationId, hasMore) => {
    set((state) => ({
      hasMore: {
        ...state.hasMore,
        [conversationId]: hasMore,
      },
    }));
  },

  /**
   * Cursor'ı set eder
   */
  setCursor: (conversationId, cursor) => {
    set((state) => ({
      cursors: {
        ...state.cursors,
        [conversationId]: cursor,
      },
    }));
  },

  /**
   * Sohbetin mesajlarını temizler
   */
  clearConversation: (conversationId) => {
    set((state) => {
      const { [conversationId]: _, ...messages } = state.messages;
      const { [conversationId]: __, ...pendingMessages } = state.pendingMessages;
      const { [conversationId]: ___, ...isLoadingMore } = state.isLoadingMore;
      const { [conversationId]: ____, ...hasMore } = state.hasMore;
      const { [conversationId]: _____, ...cursors } = state.cursors;
      return { messages, pendingMessages, isLoadingMore, hasMore, cursors };
    });
  },

  /**
   * Store'u sıfırlar
   */
  reset: () => set(initialState),
}));

// =============================================
// SELECTORS
// =============================================

/**
 * Sohbetin mesajlarını döndürür (pending dahil)
 * useShallow ile stable reference sağlanır
 */
export const useConversationMessages = (conversationId: string) => {
  const { messages, pending } = useMessageStore(
    useShallow((state) => ({
      messages: state.messages[conversationId] ?? [],
      pending: state.pendingMessages[conversationId] ?? [],
    }))
  );

  // Pending mesajları başa ekle - useMemo ile cache'le
  return useMemo(
    () => [...pending, ...messages] as (Message | PendingMessage)[],
    [messages, pending]
  );
};

/**
 * Sohbetin loading more durumunu döndürür
 */
export const useIsLoadingMore = (conversationId: string) => {
  return useMessageStore((state) => state.isLoadingMore[conversationId] ?? false);
};

/**
 * Sohbetin has more durumunu döndürür
 */
export const useHasMore = (conversationId: string) => {
  return useMessageStore((state) => state.hasMore[conversationId] ?? true);
};
